import ffmpeg from "fluent-ffmpeg";
import addToStory from "./story";
import validateAspectRatio from "../../util/image/ratio";
import cropImage from "../../util/image/cropImage";
import convertToJpeg from "../../util/image/convertToJpeg";
import AspectRatioValidationResult from "../../enums/AspectRatioValidationResult";
import * as logger from "../../util/logger";
import { readFile } from "fs";
import { promisify } from "util";
import { stripIndents } from "common-tags";
import { IgApiClient, MediaRepositoryConfigureResponseRootObject } from "instagram-private-api";
import { APODResponse, DownloadedMediaData, InstagramUsertag } from "../../types";
import { fetchMediaData } from "../../tools/common/fetch";
import { getArchiveLink, truncate } from "../../util/functions";
import { IG_CAPTION_MAX_LENGTH } from "../../util/constants";
import { generateThumbnail } from "../../util/video/thumbnail";

const readFileAsync = promisify(readFile);
const ig = new IgApiClient();

const login = async (): Promise<void> => {
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME as string);
    await ig.account.login(process.env.INSTAGRAM_USERNAME as string, process.env.INSTAGRAM_PASSWORD as string);
};

const instaPost = async (media: DownloadedMediaData): Promise<void> => {
    await login();

    let path = media.path as string;
    
    // Fetch and download image data
    const image: APODResponse = await fetchMediaData();
    
    let caption = stripIndents`
        ${image.title}${image.copyright ? ` (© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        %expln%

        🔗 ${getArchiveLink(image.date)}
    `;

    // Calculate how many characters we have left in the caption
    // formula: 2200 - (caption.length - 7 [length of "%expln%"])
    const remainingChars = IG_CAPTION_MAX_LENGTH - (caption.length - 7);

    // Add explanation to caption and truncate it to the number of remaining chars (minus 1, for the ellipsis character)
    caption = caption.replace(/%expln%/g, truncate(image.explanation, remainingChars - 1));

    try {
        if (image.media_type === "image") {
            // Check aspect ratio
            const aspectRatio = await validateAspectRatio(path);

            // If current aspect ratio is invalid
            if (aspectRatio !== AspectRatioValidationResult.Valid) {
                // Crop image to the maximum allowed aspect ratio
                const cropped = await cropImage(image, media, aspectRatio);

                // Publish cropped image
                setTimeout(publishImage, 3000, cropped.path as string, caption);
                return;
            }

            // If the image isn't a JPEG...
            if (media.type !== "jpg") {
                // Convert image to JPEG
                convertToJpeg(path)
                    .then(async (media: DownloadedMediaData) => {
                        // Publish JPEG image
                        await publishImage(media.path as string, caption);
                        return;
                    })
                    .catch(err => logger.error(err));
            }

            // Otherwise, publish the image as-is
            await publishImage(path, caption);
        }

        if (image.media_type === "video") {
            ffmpeg.ffprobe(path, async (err, metadata) => {
                if (err) logger.error(`ffprobe error: ${err}`);

                // Get duration of original video
                const duration = metadata.format.duration as number;

                // Check if video is longer than 60 seconds (max length for Instagram videos)
                // ? Q: why not upload the video as a reel (max length 90 seconds)?
                // ? A: instagram-private-api currently doesn't support this functionality
                if (duration < 60) await publishVideo(path, caption, image);
                else {
                    // Trim video down to 60 seconds before publishing
                    ffmpeg(path)
                        .setStartTime("00:00:00")
                        .setDuration(60)
                        .output(`img/${image.date}_trim.mp4`)
                        .on("end", async err => {
                            !err ? logger.debug("[Instagram]: video trimmed to 60 seconds") : logger.error(`ffmpeg (end): ${err}`);
                            path = `img/${image.date}_trim.mp4`;
                            await publishVideo(path, caption, image);
                        })
                        .on("error", err => logger.error(`ffmpeg (error): ${err}`))
                        .run();
                }
            });
        }
    } catch (err: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error(`(instaPost) ${err.stack}`);
    }
};

const publishImage = async (path: string, caption: string): Promise<void> => {
    const publish = await ig.publish.photo({
        file: await readFileAsync(path),
        caption
        // usertags: {
        //     in: [
        //         // tag @nasa at position (0.5, 0.5)
        //         await generateUsertagFromName("nasa", 0.5, 0.5)
        //     ]
        // }
    });

    handleAfterPublish(publish);
    addToStory(ig, path);
};

const publishVideo = async (path: string, caption: string, image: APODResponse): Promise<void> => {
    const thumbnail = await generateThumbnail(image, path);

    const publish = await ig.publish.video({
        video: await readFileAsync(path),
        coverImage: await readFileAsync(thumbnail.path as string),
        caption
    });

    handleAfterPublish(publish);
    addToStory(ig, thumbnail.path as string);
};

const handleAfterPublish = (publish: MediaRepositoryConfigureResponseRootObject) => {
    if (publish.status === "ok") return logger.log("✅ Instagram post successfully sent");
    else return logger.warn("⚠ Instagram post did not return status of 'ok'");
};

const generateUsertagFromName = async (name: string, x: number, y: number): Promise<InstagramUsertag> => {
    // constrain x and y between 0 and 1 (exclusive; 0 and 1 are not supported)
    x = clamp(x, 0.0001, 0.9999);
    y = clamp(y, 0.0001, 0.9999);

    // get user_id for the name
    const { pk } = await ig.user.searchExact(name);
    return { user_id: pk, position: [x, y] };
};

// function to constrain a value
const clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), min);

export default instaPost;

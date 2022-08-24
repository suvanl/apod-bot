import * as logger from "../../util/logger";
import { createWriteStream, readFile } from "fs";
import { promisify } from "util";
import { IgApiClient, MediaRepositoryConfigureResponseRootObject } from "instagram-private-api";
import { APODResponse, DownloadedMediaData, InstagramUsertag } from "../../types";
import { fetchMediaData } from "../../tools/common/fetch";
import { stripIndents } from "common-tags";
import { getArchiveLink, truncate } from "../../util/functions";
import { IG_CAPTION_MAX_LENGTH } from "../../util/constants";
import axios from "axios";
import ytdl from "ytdl-core";
import { DateTime } from "luxon";

const readFileAsync = promisify(readFile);
const ig = new IgApiClient();

const login = async (): Promise<void> => {
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME as string);
    await ig.account.login(process.env.INSTAGRAM_USERNAME as string, process.env.INSTAGRAM_PASSWORD as string);
};

const instaPost = async (media: DownloadedMediaData): Promise<void> => {
    await login();

    const path = `${process.cwd()}/${media.path}`;
    
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
        }

        if (image.media_type === "video") {
            const timestamp = `${DateTime.now().toFormat("y-MM-dd")}`;
            const thumbPath = `${process.cwd()}/img/${timestamp}_thumb.jpg`;

            const videoId = ytdl.getURLVideoID(image.url);
            const thumbnail = await axios.get(`https://i.ytimg/vi/${videoId}/hqdefault.jpg`, { responseType: "stream" });
            thumbnail.data.pipe(createWriteStream(thumbPath));

            const publish = await ig.publish.video({
                video: await readFileAsync(path),
                coverImage: await readFileAsync(thumbPath),
                caption
            });

            handleAfterPublish(publish);
        }
    } catch (err) {
        logger.error(err);
    }
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

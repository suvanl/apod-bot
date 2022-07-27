import "dotenv/config";
import client from "./client";
import * as logger from "./util/logger";
import { stripIndents } from "common-tags";
import { DateTime } from "luxon";
import { APODResponse, DownloadedMediaData } from "./types";
import { createJob } from "./job";
import { getArchiveLink, truncate } from "./util/functions";
import { fetchMediaData } from "./tools/common/fetch";
import { downloadImage } from "./tools/download/image";
import { downloadYouTubeVideo } from "./tools/download/youtube";

const init = (): void => {
    logger.info(`Running in ${process.env.NODE_ENV} mode`);
};

const tweet = async (media: DownloadedMediaData): Promise<void> => {
    // Fetch and download image data
    const image: APODResponse = await fetchMediaData();
    const tweetText = stripIndents`
        ${image.title}${image.copyright ? ` (© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        ${truncate(image.explanation, 150)}

        🔗 ${getArchiveLink(image.date)}
    `;

    try {
        // Upload media
        const mediaId = await client.v1.uploadMedia(media.path as string, { mimeType: media.type });
        logger.debug(`media ID: ${mediaId}`);

        // Add alt text to images
        if (image.media_type === "image") {
            // Convert the ISO 8601 date to a format more suitable for alt text
            const date: string = DateTime.fromISO(image.date).toLocaleString(DateTime.DATE_FULL, { locale: "en-gb" });

            // Define the alt text and add it to the media by providing the media ID
            const altText = `NASA Astronomy Picture of the Day for ${date}, showing ${image.title}. For more detailed alt text, view the image on the linked webpage.`;
            await client.v1.createMediaMetadata(mediaId, { alt_text: { text: altText }});
        }
        
        // Tweet media with tweetText
        await client.v1.tweet(tweetText, { media_ids: mediaId });
        logger.log("✅ Tweet successfully sent");
    } catch (err) {
        logger.error(`Twitter ${err}`);
    }
};

const run = async (): Promise<void> => {
    const { media_type } = await fetchMediaData();

    let media;
    if (media_type === "image") media = await downloadImage();
    else if (media_type === "video") media = await downloadYouTubeVideo();
    else media = { path: "", type: "" };

    setTimeout(tweet, 3000, media);
};

init();
createJob(run);

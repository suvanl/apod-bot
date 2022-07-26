import "dotenv/config";
import client from "./client";
import * as logger from "./util/logger";
import { stripIndents } from "common-tags";
import { DownloadedMediaData } from "./types";
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
    const image = await fetchMediaData();
    const tweetText = stripIndents`
        ${image.title}${image.copyright ? ` (© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        ${truncate(image.explanation, 150)}

        🔗 ${getArchiveLink(image.date)}
    `;

    try {
        // Upload the image and tweet it with a description
        const mediaId = await client.v1.uploadMedia(media.path as string, { mimeType: media.type });
        logger.debug(`media ID: ${mediaId}`);

        await client.v1.tweet(tweetText, { media_ids: mediaId });
        logger.log("✅ Tweet successfully sent");
    } catch (err) {
        logger.error(`Twitter ${err}`);
    }
};

const run = async (): Promise<void> => {
    const data = await fetchMediaData();

    let media;
    if (data.media_type === "image") media = await downloadImage();
    else if (data.media_type === "video") media = await downloadYouTubeVideo();

    setTimeout(tweet, 3000, media);
};

init();
createJob(run);

import "dotenv/config";
import axios from "axios";
import fs from "fs";
import client from "./client";
import * as logger from "./util/logger";
import { DateTime } from "luxon";
import { stripIndents } from "common-tags";
import { APODResponse, DownloadedImageData } from "./types";
import { getArchiveLink, getUrlFileExtension, truncate } from "./util/functions";
import { createJob } from "./job";

const init = (): void => {
    logger.info(`Running in ${process.env.NODE_ENV} mode`);
};

const fetchImageData = async (): Promise<APODResponse> => {
    // Fetch image data from the NASA APOD API
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    const img = await axios.get<APODResponse>(url);

    // Return the JSON object containing data such as the author, description and image URL
    return img.data;
};

const downloadImage = async (): Promise<DownloadedImageData> => {
    const TIMESTAMP = `${DateTime.now().toFormat("y-MM-dd")}`;
    let IMAGE_PATH = `img/${TIMESTAMP}`;

    const data = await fetchImageData();

    let img = await axios.get(data.hdurl, { responseType: "stream" });
    if (parseInt(img.headers["content-length"]) > 5242880) {
        img = await axios.get(data.url, { responseType: "stream" });
    }
    
    const fileExt = getUrlFileExtension(data.hdurl);
    IMAGE_PATH += `.${fileExt}`;
    logger.info(`Downloading image for ${TIMESTAMP}...`);
    fileExt === "jpg" ? logger.debug(`Filetype is: ${fileExt}`) : logger.warn(`Filetype is: ${fileExt}`);

    // If the image doesn't already exist...
    if (!fs.existsSync(IMAGE_PATH)) {
        // Download image with file format "YYYY-MM-DD.jpg"
        img.data.pipe(fs.createWriteStream(IMAGE_PATH));
        
        // Return the image file path and file type
        return { path: IMAGE_PATH, type: fileExt };
    } else {
        logger.log(`Attempted to download image but it already exists (${IMAGE_PATH})`);
        return { path: undefined, type: undefined };
    }
};

const tweet = async (imageData: DownloadedImageData): Promise<void> => {
    // Fetch and download image data
    const image = await fetchImageData();
    const tweetText = stripIndents`
        ${image.title}${image.copyright ? ` (© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        ${truncate(image.explanation, 150)}

        🔗 ${getArchiveLink(image.date)}
    `;

    try {
        // Upload the image and tweet it with a description
        const mediaId = await client.v1.uploadMedia(imageData.path as string, { mimeType: imageData.type });
        logger.debug(`media ID: ${mediaId}`);

        await client.v1.tweet(tweetText, { media_ids: mediaId });
        logger.log("✅ Tweet successfully sent");
    } catch (err) {
        logger.error(`Twitter ${err}`);
    }
};

const run = async (): Promise<void> => {
    const image = await downloadImage();
    setTimeout(tweet, 3000, image);
};

init();
createJob(run);

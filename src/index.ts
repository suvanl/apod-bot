import "dotenv/config";
import axios from "axios";
import fs from "fs";
import client from "./client";
import * as logger from "./util/logger";
import { DateTime } from "luxon";
import { stripIndents } from "common-tags";
import { APODResponse } from "./types";
import { getArchiveLink, getUrlFileExtension, truncate } from "./util/util";
import { createJob } from "./job";

const TIMESTAMP = `${DateTime.now().toFormat("y-MM-dd")}`;
let IMAGE_PATH_FORMAT = `img/${TIMESTAMP}`;

const init = (): void => {
    logger.info(`Running in ${process.env.NODE_ENV} mode`);
};

const fetchImageData = async (): Promise<APODResponse> => {
    // Fetch image data from the NASA APOD API
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    const img = await axios.get<APODResponse>(url);

    // Return the image's JSON object containing data such as the author and description
    return img.data;
};

const downloadImage = async (): Promise<void> => {
    const data = await fetchImageData();
    const img = await axios.get(data.hdurl, { responseType: "stream" });

    const fileExt = getUrlFileExtension(data.hdurl);
    fileExt === "jpg" ? logger.info(`Filetype is: ${fileExt}`) : logger.warn(`Filetype is: ${fileExt}`);
    IMAGE_PATH_FORMAT += `.${fileExt}`;

    // If the image doesn't already exist...
    if (!fs.existsSync(IMAGE_PATH_FORMAT)) {
        // Download image with file format "YYYY-MM-DD.jpg"
        img.data.pipe(fs.createWriteStream(IMAGE_PATH_FORMAT));
    } else {
        // Else (if the image already exists) just return
        return;
    }
};

const tweet = async (imagePath: string): Promise<void> => {
    // Fetch and download image data
    const image = await fetchImageData();
    const tweetText = stripIndents`
        ${image.title} ${image.copyright ? `(© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        ${truncate(image.explanation, 150)}

        🔗 ${getArchiveLink(image.date)}
    `;

    try {
        // Upload the image and tweet it with a description
        const mediaId = await client.v1.uploadMedia(imagePath);
        await client.v1.tweet(tweetText, { media_ids: mediaId });
        logger.log("✅ Tweet successfully sent");
    } catch (err) {
        logger.error(`Twitter error: ${err}`);
    }
};

const run = (): void => {
    tweet(`${IMAGE_PATH_FORMAT}`);
};

init();
downloadImage();
createJob(run);

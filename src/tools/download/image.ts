import fs from "fs";
import axios from "axios";
import * as logger from "../../util/logger";
import { fetchMediaData } from "../common/fetch";
import { APODResponse, DownloadedMediaData } from "../../types";
import { getUrlFileExtension } from "../../util/functions";
import { IMAGE_MAX_SIZE } from "../../util/constants";

export const downloadImage = async (apodData: APODResponse): Promise<DownloadedMediaData> => {
    // Get current date timestamp for the file name
    const TIMESTAMP = apodData.date;
    let IMAGE_PATH = `img/${TIMESTAMP}`;

    const data = await fetchMediaData();

    // Determine the file extension and append it to the image path
    const fileExt = getUrlFileExtension(data.hdurl as string);
    IMAGE_PATH += `.${fileExt}`;

    logger.info(`Downloading image for ${TIMESTAMP}...`);

    // Allowed image formats
    const imageFormats = ["jpg", "png"];

    // If file type is not an image, display a warning in the console
    imageFormats.includes(fileExt as string) ? logger.debug(`Filetype is: ${fileExt}`) : logger.warn(`Filetype is: ${fileExt}`);
    
    // Use HD url by default
    let img = await axios.get(data.hdurl as string, { responseType: "stream" });


    // If the file is an image and the file size exceeds the max image upload size (5MB), use the SD URL
    if (imageFormats.includes(fileExt as string) && parseInt(img.headers["content-length"]) > IMAGE_MAX_SIZE) {
        img = await axios.get(data.url, { responseType: "stream" });
    }

    // If the image doesn't already exist...
    if (!fs.existsSync(IMAGE_PATH)) {
        // Download image with file format "YYYY-MM-DD.jpg"
        img.data.pipe(fs.createWriteStream(IMAGE_PATH));
        
        // Return the image file path and file type
        return { path: IMAGE_PATH, type: fileExt };
    } else {
        logger.warn(`Attempted to download image but it already exists (${IMAGE_PATH})`);
        return { path: undefined, type: undefined };
    }
};
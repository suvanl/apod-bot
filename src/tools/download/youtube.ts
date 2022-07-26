import fs from "fs";
import ytdl from "ytdl-core";
import * as logger from "../../util/logger";
import { DateTime } from "luxon";
import { fetchMediaData } from "../common/fetch";
import { DownloadedMediaData } from "../../types";
import { EUploadMimeType } from "twitter-api-v2";

export const downloadYouTubeVideo = async (): Promise<DownloadedMediaData> => {
    // Get the video URL from the media data
    const { url } = await fetchMediaData();

    // Get current date timestamp for the file name
    const TIMESTAMP = `${DateTime.now().toFormat("y-MM-dd")}`;
    const MEDIA_PATH = `img/${TIMESTAMP}.mp4`;

    logger.info(`Downloading video for ${TIMESTAMP}...`);
    logger.debug("Filetype is: mp4");

    if (!fs.existsSync(MEDIA_PATH)) {
        // Check available video formats
        const videoId = ytdl.getURLVideoID(url);
        const info = await ytdl.getInfo(videoId);

        // Determine the best itag/quality to be used
        let quality;
        if (info.formats.find(f => f.itag === 22)) quality = 22;
        else quality = "highestvideo";

        // Download the image (using youtube-dl) with the format "YYYY-MM-DD.mp4"
        ytdl(url, { filter: format => format.container === "mp4", quality }).pipe(fs.createWriteStream(MEDIA_PATH));

        // Return the image file path and file type
        return { path: MEDIA_PATH, type: EUploadMimeType.Mp4 };
    } else {
        logger.log(`Attempted to download YouTube video but it already exists (${MEDIA_PATH})`);
        return { path: undefined, type: undefined };
    }
};

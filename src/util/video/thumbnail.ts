import * as logger from "../../util/logger";
import ffmpeg from "fluent-ffmpeg";
import { APODResponse, DownloadedMediaData } from "../../types";

export const generateThumbnail = (media: APODResponse, videoPath: string): Promise<DownloadedMediaData> => {
    const thumbnailPath = `img/${media.date}-thumb.jpg`;
    const filename = `${media.date}-thumb.jpg`;

    return new Promise<DownloadedMediaData>((resolve, reject) => {
        // Take a screenshot from halfway through the video
        ffmpeg({ source: videoPath })
            .takeScreenshots({ filename, folder: "img", timemarks: ["50%"] })
            .on("end", () => {
                logger.info("Video thumbnail generated");
                resolve({ path: thumbnailPath, type: "jpg" });
            })
            .on("error", (err: Error) => {
                logger.error(`(generateThumbnail): ${err.stack}`);
                reject();
            });
    });
};

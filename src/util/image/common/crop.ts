import * as logger from "../../logger";
import { Sharp } from "sharp";
import { DownloadedMediaData } from "../../../types";

export const crop = async (media: DownloadedMediaData, image: Sharp, newPath: string, newWidth: number, newHeight: number) => {
    logger.debug("Cropping image...");

    // TODO: ensure image stays centred after cropping
    return new Promise<DownloadedMediaData>((resolve, reject) => {
        image
            .extract({ left: 0, top: 0, width: newWidth, height: newHeight })
            .toFile(newPath, err => {
                if (err) reject(new Error(`(sharp) ${err}`));
            });

        resolve({ path: newPath, type: media.type });
    });
};

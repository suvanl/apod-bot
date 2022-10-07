import sharp, { Sharp } from "sharp";
import * as logger from "../logger";
import { APODResponse, DownloadedMediaData } from "../../types";
import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from "../constants";
import { validateDimensions } from "./validateDimensions";
import DimensionValidationResult from "../../enums/DimensionValidationResult";

const crop = async (media: DownloadedMediaData, image: Sharp, newPath: string, newWidth: number, newHeight: number) => {
    return new Promise<DownloadedMediaData>((resolve, reject) => {
        image
            .extract({ left: 0, top: 0, width: newWidth, height: newHeight })
            .toFile(newPath, err => {
                if (err) reject(new Error(`(sharp) ${err}`));
            });

        resolve({ path: newPath, type: media.type });
    });
};

// Crops an image that is too large for Twitter to an acceptable size
const cropToFit = async ({ date }: APODResponse, media: DownloadedMediaData): Promise<DownloadedMediaData> => {
    const newPath = `img/${date}-crop-tw.${media.type}`;
    const image = sharp(media.path);
    const meta = await image.metadata();

    logger.debug("Image exceeds max width and/or height. Cropping...");
    const dimensionStatus = await validateDimensions(media.path as string);

    // Crop based on which side of the image exceeds the max size (may be both)
    if (dimensionStatus === DimensionValidationResult.ExcessWidthAndHeight) return await crop(media, image, newPath, IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT);
    if (dimensionStatus === DimensionValidationResult.ExcessHeight) return await crop(media, image, newPath, meta.width as number, IMAGE_MAX_HEIGHT);
    if (dimensionStatus === DimensionValidationResult.ExcessWidth) return await crop(media, image, newPath, IMAGE_MAX_WIDTH, meta.height as number);

    // Else return original path
    return { path: media.path, type: media.type };
};

export default cropToFit;

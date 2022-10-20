import sharp from "sharp";
import AspectRatioValidationResult from "../../enums/AspectRatioValidationResult";
import * as logger from "../logger";
import { crop } from "./common/crop";
import { APODResponse, DownloadedMediaData } from "../../types";

// Crops an image to an aspect ratio allowed by Instagram
// This function uses subtractive correction because using additive correction will result in unattractive results and artefacts
const cropImage = async ({ date }: APODResponse, media: DownloadedMediaData, result: AspectRatioValidationResult): Promise<DownloadedMediaData> => {
    const newPath = `img/${date}-crop.${media.type}`;
    const image = sharp(media.path);
    const meta = await image.metadata();

    // Max aspect ratio is 1.91:1 (width:height)
    if (result === AspectRatioValidationResult.TooBig) {
        logger.debug("Image aspect ratio too large.");

        // Keep height the same, crop width
        // For example, an image with dimensions 1080x527:
        // height | 527
        // width  | 527 * 1.91 ~= 1006.57

        let newWidth = Math.floor(Number(meta.height) * 1.91);

        // If newWidth is odd, make it even, to ensure the cropped image stays centred
        // by cropping even amounts from the top and bottom of the original image
        if (newWidth % 2 !== 0) newWidth -= 1;

        return await crop(media, image, newPath, newWidth, Number(meta.height));
    }

    // Min aspect ratio is 4:5 (width:height)
    if (result === AspectRatioValidationResult.TooSmall) {
        logger.debug("Image aspect ratio too small.");

        // Keep width the same, crop height
        // For example, an image with dimensions 1200x1600:
        // width  | 1200
        // height | (1200 / 4) + 1200 = 1500

        let newHeight = (Math.floor(Number(meta.width) / 4)) + Number(meta.width);
        
        // If newHeight is odd, make it even, to ensure the cropped image stays centred
        // by cropping even amounts from the left and right of the original image
        if (newHeight % 2 !== 0) newHeight -= 1;

        return await crop(media, image, newPath, Number(meta.width), newHeight);
    }

    // Else the original image's aspect ratio must be unproblematic, so we'll return the original path
    return { path: media.path, type: media.type };
};

export default cropImage;

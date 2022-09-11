import Jimp from "jimp";
import AspectRatioValidationResult from "../../enums/AspectRatioValidationResult";
import * as logger from "../../util/logger";
import { APODResponse, DownloadedMediaData } from "../../types";

// Crops an image to an aspect ratio allowed by Instagram
// This function uses subtractive correction because using additive correction will result in unattractive results and artefacts
const cropImage = async ({ date }: APODResponse, media: DownloadedMediaData, result: AspectRatioValidationResult): Promise<DownloadedMediaData> => {
    const newPath = `img/${date}-crop.${media.type}`;
    const image = await Jimp.read(media.path as string);

    // Max aspect ratio is 1.91:1 (width:height)
    if (result === AspectRatioValidationResult.TooBig) {
        logger.debug("Image aspect ratio too large. Cropping...");

        // Keep height the same, crop width
        // For example, an image with dimensions 1080x527:
        // height | 527
        // width  | 527 * 1.91 ~= 1006.57

        let newWidth = Math.floor(image.bitmap.height * 1.91);

        // If newWidth is odd, make it even, to ensure the cropped image stays centred
        // by cropping even amounts from the left and right of the original image
        if (newWidth % 2 !== 0) newWidth -= 1; 

        return new Promise<DownloadedMediaData>((resolve, reject) => {
            // TODO: ensure image stays centred after cropping
            image.crop(0, 0, newWidth, image.bitmap.height, err => {
                if (err) reject(new Error(`(jimp) ${err}`));
            }).write(newPath);

            resolve({ path: newPath, type: media.type });
        });
    }

    // Min aspect ratio is 4:5 (width:height)
    if (result === AspectRatioValidationResult.TooSmall) {
        logger.debug("Image aspect ratio too small. Cropping...");

        // Keep width the same, crop height
        // For example, an image with dimensions 1200x1600:
        // width  | 1200
        // height | (1200 / 4) + 1200 = 1500

        let newHeight = (Math.floor(image.bitmap.width / 4)) + image.bitmap.width;
        
        // If newHeight is odd, make it even, to ensure the cropped image stays centred
        // by cropping even amounts from the left and right of the original image
        if (newHeight % 2 !== 0) newHeight -= 1;

        return new Promise<DownloadedMediaData>((resolve, reject) => {
            // TODO: ensure image stays centred after cropping
            image.crop(0, 0, image.bitmap.width, newHeight, err => {
                if (err) reject(new Error(`(jimp) ${err}`));
            }).write(newPath);

            resolve({ path: newPath, type: media.type });
        });
    }

    // Else the original image's aspect ratio must be unproblematic, so we'll return the original path
    return { path: media.path, type: media.type };
};

export default cropImage;

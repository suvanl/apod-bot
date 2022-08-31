import Jimp from "jimp";
import AspectRatioValidationResult from "../../enums/aspectRatioValidationResult";
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

        // If newWidth is odd, make it even
        // This has been done to ensure the cropped image stays centered by cropping even amounts from the left and right of the original image
        if (newWidth % 2 !== 0) newWidth -= 1; 

        return new Promise<DownloadedMediaData>((resolve, reject) => {
            // TODO: ensure image stays centred after cropping
            image.crop(0, 0, newWidth - 6, image.bitmap.height, err => {
                if (err) {
                    logger.error(`(jimp) ${err}`);
                    reject();
                }
            }).write(newPath);

            resolve({ path: newPath, type: media.type });
        });
    }

    // Min aspect ratio is 4:5 (width:height)
    if (result === AspectRatioValidationResult.TooSmall) {
        logger.debug("Image aspect ratio too small. Cropping...");
        throw new Error("(NotImplementedException) Cropping for AspectRatioValidationResult.TooSmall has not yet been implemented");
    }

    // Else the original image's aspect ratio must be unproblematic, so we'll return the original path
    return { path: media.path, type: media.type };
};

export default cropImage;

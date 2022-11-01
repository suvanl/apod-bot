import sharp from "sharp";
import DimensionValidationResult from "../../enums/DimensionValidationResult";
import { crop } from "./common/crop";
import { validateDimensions } from "./validateDimensions";
import { APODResponse, DownloadedMediaData } from "../../types";
import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from "../constants";

// Crops an image that is too large for Twitter to an acceptable size
const cropToFit = async ({ date }: APODResponse, media: DownloadedMediaData): Promise<DownloadedMediaData> => {
    const newPath = `img/${date}-crop-tw.${media.type}`;
    const image = sharp(media.path);
    const meta = await image.metadata();

    const dimensionStatus = await validateDimensions(media.path as string);

    // Crop based on which side of the image exceeds the max size (may be both)
    if (dimensionStatus === DimensionValidationResult.ExcessWidthAndHeight) return await crop(media, image, newPath, IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT);
    if (dimensionStatus === DimensionValidationResult.ExcessHeight) return await crop(media, image, newPath, meta.width as number, IMAGE_MAX_HEIGHT);
    if (dimensionStatus === DimensionValidationResult.ExcessWidth) return await crop(media, image, newPath, IMAGE_MAX_WIDTH, meta.height as number);

    // Else return original path
    return { path: media.path, type: media.type };
};

export default cropToFit;

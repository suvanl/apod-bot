import sharp from "sharp";
import DimensionValidationResult from "../../enums/DimensionValidationResult";
import { IMAGE_MAX_HEIGHT, IMAGE_MAX_WIDTH } from "../constants";

export const validateDimensions = async (imgPath: string): Promise<DimensionValidationResult> => {
    const image = sharp(imgPath);
    const { height, width } = await image.metadata();

    if (height as number > IMAGE_MAX_HEIGHT && width as number > IMAGE_MAX_WIDTH) return DimensionValidationResult.ExcessWidthAndHeight;
    if (height as number > IMAGE_MAX_HEIGHT) return DimensionValidationResult.ExcessHeight;
    if (width as number > IMAGE_MAX_WIDTH) return DimensionValidationResult.ExcessWidth;
    return DimensionValidationResult.OK;
};

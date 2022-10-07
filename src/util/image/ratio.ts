import sharp from "sharp";
import AspectRatioValidationResult from "../../enums/AspectRatioValidationResult";
import { IG_IMAGE_ASPECT_RATIO_MAX as RATIO_MAX, IG_IMAGE_ASPECT_RATIO_MIN as RATIO_MIN } from "../constants";

const validateAspectRatio = async (imgPath: string): Promise<AspectRatioValidationResult> => {
    const image = sharp(imgPath);
    const meta = await image.metadata();

    const aspectRatio = Number(meta.width) / Number(meta.height);
    const aspectRatioMax = RATIO_MAX.width / RATIO_MAX.height;
    const aspectRatioMin = RATIO_MIN.width / RATIO_MIN.height;

    // valid ratio
    if (aspectRatio > aspectRatioMin && aspectRatio < aspectRatioMax) return AspectRatioValidationResult.Valid;

    // ratio too big
    else if (aspectRatio > aspectRatioMax) return AspectRatioValidationResult.TooBig;

    // else, the aspect ratio must be too small
    return AspectRatioValidationResult.TooSmall;
};

export default validateAspectRatio;

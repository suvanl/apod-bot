import sharp from "sharp";
import { DownloadedMediaData } from "../../types";

const convertToJpeg = async (currentPath: string): Promise<DownloadedMediaData> => {
    const image = sharp(currentPath);

    // Replace existing file extension with ".jpg"
    const newPath = currentPath.replace(/\.[^.]*$/, ".jpg");

    return new Promise<DownloadedMediaData>((resolve, reject) => {
        image
            .toFormat("jpeg")
            .toFile(newPath, err => {
                if (err) reject(new Error(`(sharp) ${err}`));
            });

        resolve({ path: newPath, type: "jpg" });
    });
};

export default convertToJpeg;

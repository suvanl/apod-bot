import "dotenv/config";
import tweet from "./platform/twitter";
import instaPost from "./platform/instagram";
import * as logger from "./util/logger";
import { fetchMediaData } from "./tools/common/fetch";
import { downloadImage } from "./tools/download/image";
import { downloadYouTubeVideo } from "./tools/download/youtube";
import { APODResponse, DownloadedMediaData } from "./types";

export const run = async (): Promise<void> => {
    logger.info(`Running in ${process.env.NODE_ENV} mode`);

    const res: APODResponse = await fetchMediaData();

    let media: DownloadedMediaData;
    if (res.media_type === "image") media = await downloadImage(res);
    else if (res.media_type === "video") media = await downloadYouTubeVideo(res);
    else media = { path: "", type: "" };

    setTimeout(tweet, 3000, media);
    setTimeout(instaPost, 3000, media);
};

//createJob(run);

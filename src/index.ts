import "dotenv/config";
import tweet from "./platform/twitter";
import instaPost from "./platform/instagram";
import * as logger from "./util/logger";
import { createJob } from "./job";
import { fetchMediaData } from "./tools/common/fetch";
import { downloadImage } from "./tools/download/image";
import { downloadYouTubeVideo } from "./tools/download/youtube";

const init = (): void => {
    logger.info(`Running in ${process.env.NODE_ENV} mode`);
};

const run = async (): Promise<void> => {
    const { media_type } = await fetchMediaData();

    let media;
    if (media_type === "image") media = await downloadImage();
    else if (media_type === "video") media = await downloadYouTubeVideo();
    else media = { path: "", type: "" };

    //setTimeout(tweet, 3000, media);
    setTimeout(instaPost, 3000, media);
};

init();
// createJob(run);
run();

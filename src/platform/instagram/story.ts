import * as logger from "../../util/logger";
import { readFile } from "fs";
import { promisify } from "util";
import { IgApiClient } from "instagram-private-api";
import { StickerBuilder } from "instagram-private-api/dist/sticker-builder";

const readFileAsync = promisify(readFile);

// shares the latest post to story
const addToStory = async (client: IgApiClient, path: string): Promise<void> => {
    const file = await readFileAsync(path);
    const { pk } = await client.user.searchExact("dailyapod");

    // note that StickerBuilder only creates the bounding box and relevant interactions for the sticker - the
    // sticker itself is invisible and not rendered by Instagram, and should be done by the application instead
    await client.publish.story({
        file,
        stickerConfig: new StickerBuilder()
            .add(StickerBuilder.attachmentFromMedia((await client.feed.user(pk).items())[0]).center())
            .build()
    });

    logger.log("✅ Added to Instagram story");
};

export default addToStory;
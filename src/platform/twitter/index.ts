import client from "./client";
import * as logger from "../../util/logger";
import { stripIndents } from "common-tags";
import { DateTime } from "luxon";
import { APODResponse, DownloadedMediaData } from "../../types";
import { getArchiveLink, truncate } from "../../util/functions";
import { TWEET_MAX_LENGTH } from "../../util/constants";
import { fetchMediaData } from "../../tools/common/fetch";

const tweet = async (media: DownloadedMediaData): Promise<void> => {
    // Fetch and download image data
    const image: APODResponse = await fetchMediaData();
    let tweetText = stripIndents`
        ${image.title}${image.copyright ? ` (© ${image.copyright})` : ""} | ${image.date}
        #NASA #apod

        %expln%

        🔗 ${getArchiveLink(image.date)}
    `;

    // Calculate how many characters we have left in the tweet
    // formula: 280 - (tweetText.length - 7 [length of "%expln%"]) + 5 [due to link wrapping - ".html" gets cut off from end of archive links]
    const remainingChars = TWEET_MAX_LENGTH - (tweetText.length - 7) + 5;

    // Add explanation to tweetText and truncate it to the number of remaining chars (minus 1, for the ellipsis character)
    tweetText = tweetText.replace(/%expln%/g, truncate(image.explanation, remainingChars - 1));

    try {
        // Upload media
        const mediaId = await client.v1.uploadMedia(media.path as string, { mimeType: media.type });
        logger.debug(`media ID: ${mediaId}`);

        // Add alt text to images
        if (image.media_type === "image") {
            // Convert the ISO 8601 date to a format more suitable for alt text
            const date: string = DateTime.fromISO(image.date).toLocaleString(DateTime.DATE_FULL, { locale: "en-gb" });

            // Define the alt text and add it to the media by providing the media ID
            const altText = `NASA Astronomy Picture of the Day for ${date}, showing ${image.title}. For more detailed alt text, view the image on the linked webpage.`;
            await client.v1.createMediaMetadata(mediaId, { alt_text: { text: altText } });
        }
        
        // Tweet media with tweetText
        await client.v1.tweet(tweetText, { media_ids: mediaId });
        logger.log("✅ Tweet successfully sent");
    } catch (err) {
        logger.error(`Twitter ${err}`);
    }
};

export default tweet;

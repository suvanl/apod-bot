import { TwitterApi } from "twitter-api-v2";
import { TwitterClient } from "../../types";

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
} as TwitterClient);

const client = twitterClient.readWrite;

export default client;

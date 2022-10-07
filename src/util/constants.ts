import { AspectRatio } from "../types";

// Twitter
export const IMAGE_MAX_SIZE = 5242880;    // 5MB
export const GIF_MAX_SIZE   = 15728640;   // 15MB
export const VIDEO_MAX_SIZE = 536870912;  // 512MB
export const TWEET_MAX_LENGTH = 280;      // 280 chars
export const IMAGE_MAX_HEIGHT = 8192;     // px
export const IMAGE_MAX_WIDTH = 8192;      // px


// Instagram
export const IG_CAPTION_MAX_LENGTH = 2200;  // 2200 characters
export const IG_IMAGE_ASPECT_RATIO_MIN: AspectRatio = { width: 4, height: 5 };
export const IG_IMAGE_ASPECT_RATIO_MAX: AspectRatio = { width: 1.91, height: 1 };

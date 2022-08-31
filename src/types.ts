import { EUploadMimeType } from "twitter-api-v2";

export type TwitterClient = {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
}

export type APODResponse = {
    copyright?: string;
    date: string;
    explanation: string;
    hdurl?: string;
    media_type: string;
    service_version: string;
    title: string;
    url: string;
}

export type DownloadedMediaData = {
    path?: string;
    type?: string | EUploadMimeType;
}

export type InstagramUsertag = {
    user_id: number;
    position: [number, number]
}

export type AspectRatio = {
    width: number;
    height: number;
}

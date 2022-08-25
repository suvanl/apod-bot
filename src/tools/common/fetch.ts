import axios from "axios";
import * as cheerio from "cheerio";
import { APODResponse } from "../../types";

export const fetchMediaData = async (): Promise<APODResponse> => {
    // Fetch media data from the NASA APOD API
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    const { data } = await axios.get<APODResponse>(url);

    // Return the JSON object containing data such as the author, description and media URL
    return data;
};

// Scrape alt text from the apod webpage
export const fetchAltText = async (): Promise<string | undefined> => {
    const url = "https://apod.nasa.gov/apod/astropix.html";
    const { data } = await axios.get<string>(url);

    const $ = cheerio.load(data);
    const alt = $("img").first().attr("alt");

    return alt?.replace(/\n/g, " ");
};

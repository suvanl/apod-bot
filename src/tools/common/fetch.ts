import axios from "axios";
import { APODResponse } from "../../types";

export const fetchMediaData = async (): Promise<APODResponse> => {
    // Fetch image data from the NASA APOD API
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    const img = await axios.get<APODResponse>(url);

    // Return the JSON object containing data such as the author, description and image URL
    return img.data;
};

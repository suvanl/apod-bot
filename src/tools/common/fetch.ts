import axios from "axios";
import { APODResponse } from "../../types";

export const fetchMediaData = async (): Promise<APODResponse> => {
    // Fetch media data from the NASA APOD API
    const url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    const { data } = await axios.get<APODResponse>(url);

    // Return the JSON object containing data such as the author, description and media URL
    return data;
};

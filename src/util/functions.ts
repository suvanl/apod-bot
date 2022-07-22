export const truncate = (input: string, length: number): string => {
    if (input.length > length) return `${input.substring(0, length)}...`;
    else return input;
};

export const getArchiveLink = (date: string): string => {
    // API date format: YYYY-MM-DD
    const archiveDate = date.slice(2, date.length).replace(/-/g, "");

    // Archive date format: YYMMDD
    const link =`https://apod.nasa.gov/apod/ap${archiveDate}.html`;
    return link;
};

export const getUrlFileExtension = (url: string): string | undefined => {
    return url.split(/[#?]/)[0].split(".").pop()?.trim();
};

import chalk from "chalk";
import { DateTime } from "luxon";

export const log = (content: string, category = "log"): void => {
    const offset = DateTime.now().toFormat("Z");
    const timestampFormat = process.env.NODE_ENV !== "production" ? "HH:mm:ss" : "y-MM-dd HH:mm:ss";
    const timestamp = `${DateTime.now().toFormat(timestampFormat)} ${offset === "0" ? "" : `UTC${offset}`} |`;

    switch (category) {
        case "debug": {
            return console.log(`${timestamp} ${chalk.yellow(category.toUpperCase())} » ${content}`);
        }
        case "error": {
            return console.log(`${timestamp} ${chalk.bgRed(category.toUpperCase())} » ${content}`);
        }
        case "info": {
            return console.log(`${timestamp} ${chalk.bgBlue(category.toUpperCase())} » ${content}`);
        }
        case "log": {
            return console.log(`${timestamp} ${chalk.white(category.toUpperCase())} » ${content}`);
        }
        case "warn": {
            return console.log(`${timestamp} ${chalk.bgYellow(category.toUpperCase())} » ${content}`);
        }
        default: throw new TypeError("Invalid logger type.");
    }
};

export const debug = (...args: [string]) => log(...args, "debug");
export const error = (...args: [string | any]) => log(...args, "error");  // eslint-disable-line @typescript-eslint/no-explicit-any
export const info = (...args: [string]) => log(...args, "info");
export const warn = (...args: [string]) => log(...args, "warn");
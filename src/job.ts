import { CronJob } from "cron";

export const createJob = (tickFunction: () => void): void => {
    const job = new CronJob({
        cronTime: "0 9 * * *",
        onTick: tickFunction
    });

    job.start();
};

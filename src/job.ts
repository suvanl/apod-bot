import { CronJob } from "cron";

export const createJob = (tickFunction: () => void): void => {
    const job = new CronJob({
        cronTime: "10 14 * * *",
        onTick: tickFunction
    });

    job.start();
};

import { app, InvocationContext, Timer } from "@azure/functions";
import { run as post } from "..";

export async function run(timer: Timer, context: InvocationContext): Promise<void> {
    context.log(`Environment: ${process.env.NODE_ENV}`);
    context.log("Timer function processed request.");
    
    post();
}

app.timer("run", {
    schedule: "0 30 13 * * *",
    handler: run
});

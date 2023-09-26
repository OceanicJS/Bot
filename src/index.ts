import { Config, isDocker, setClient } from "./util/util.js";
import { ActivityTypes, Client, type ClientEvents } from "oceanic.js";
import StatusServer, { type AnyServer } from "@uwu-codes/status-server";
import { mkdir, readdir } from "node:fs/promises";
import "./server.js";

await mkdir(`${Config.dataDir}/docs`, { recursive: true });

const client = new Client({
    auth:    Config.client.token,
    gateway: {
        intents:  ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT", "GUILD_MEMBERS"],
        presence: {
            activities: [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ],
            status:     "online"
        }
    }
});
setClient(client);

process.on("unhandledRejection", (err, promise) => console.error("Unhandled Rejection:", err, promise))
    .on("uncaughtException", err => console.error("Uncaught Exception:", err))
    .once("SIGINT", () => {
        client.disconnect(false);
        statusServer?.close();
        process.kill(process.pid, "SIGINT");
    })
    .once("SIGTERM", () => {
        client.disconnect(false);
        statusServer?.close();
        process.kill(process.pid, "SIGTERM");
    });

const events = await readdir(new URL("events", import.meta.url));
for (const file of events) {
    const event = file.split(".").slice(0, -1).join(".") as keyof ClientEvents;
    client.on(event, ((await import(`./events/${event}.js`)) as { default(): void; }).default.bind(client));
}

await client.connect();

let statusServer: AnyServer | undefined;

if (isDocker) {
    statusServer = StatusServer(() => client.ready);
}

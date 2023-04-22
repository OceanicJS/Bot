import { Config, isDocker } from "./util/util.js";
import { ActivityTypes, Client } from "oceanic.js";
import StatusServer, { type AnyServer } from "@uwu-codes/status-server";
import { mkdir } from "node:fs/promises";
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

await client.once("ready", (await import("./events/ready.js")).default.bind(client))
    .on("messageDelete", (await import("./events/messageDelete.js")).default.bind(client))
    .on("messageUpdate", (await import("./events/messageUpdate.js")).default.bind(client))
    .on("interactionCreate", (await import("./events/interactionCreate.js")).default.bind(client))
    .on("debug", (await import("./events/debug.js")).default.bind(client))
    .connect();

let statusServer: AnyServer | undefined;

if (isDocker) {
    statusServer = StatusServer(() => client.ready);
}

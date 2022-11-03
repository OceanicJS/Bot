import config from "../config.json" assert { type: "json" };
import { ActivityTypes, Client } from "oceanic.js";
import { mkdir } from "node:fs/promises";

await mkdir(`${config.dataDir}/docs`, { recursive: true });

const client = new Client({
    auth:    config.token,
    gateway: {
        intents:  ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT", "GUILD_MEMBERS"],
        presence: {
            activities: [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ],
            status:     "online"
        }
    }
});

await client.once("ready", (await import("./events/ready.js")).default.bind(client))
    .on("messageDelete", (await import("./events/messageDelete.js")).default.bind(client))
    .on("messageUpdate", (await import("./events/messageUpdate.js")).default.bind(client))
    .on("interactionCreate", (await import("./events/interactionCreate.js")).default.bind(client))
    .on("debug", (await import("./events/debug.js")).default.bind(client))
    .connect();

process.on("unhandledRejection", (err, promise) => {
    console.error("Unhandled Rejection:", err, promise);
})
    .on("uncaughtException", err => {
        console.error("Uncaught Exception:", err);
    });

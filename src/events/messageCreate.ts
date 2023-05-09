import Logger from "@uwu-codes/logger";
import { type Client, type Message } from "oceanic.js";

export default async function messageCreateEvent(this: Client, message: Message) {
    if (message.channelID === "1096577887030751262" && message.author.id === "1096577924645261444") {
        await message.crosspost().catch(err => {
            Logger.getLogger("MessageCreateEvent", "Crosspost").error(err);
        });
    }
}

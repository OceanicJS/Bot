import { saveSnipe } from "../util/util.js";
import { Client, Message, PossiblyUncachedMessage } from "oceanic.js";

export default async function messageDeleteEvent(this: Client, message: PossiblyUncachedMessage) {
    if (!(message instanceof Message)) {
        return console.log("Got Uncached Delete:", message);
    }
    await saveSnipe(message.author, message.channelID, message.content, null, "delete");
}

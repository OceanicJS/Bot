import EncryptionHandler from "../util/EncryptionHandler.js";
import { saveSnipe } from "../util/util.js";
import { type Client, Message, type PossiblyUncachedMessage } from "oceanic.js";

export default async function messageDeleteEvent(this: Client, message: PossiblyUncachedMessage) {
    if (!(message instanceof Message)) {
        return console.log("Got Uncached Delete:", message);
    }

    await saveSnipe(message.author, message.channelID, EncryptionHandler.encrypt(message.content), null, "delete");
}

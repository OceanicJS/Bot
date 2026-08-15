import { type Client, Message, type PossiblyUncachedMessage } from "oceanic.js";

import EncryptionHandler from "../util/EncryptionHandler.js";
import { saveSnipe } from "../util/util.js";

export default async function messageDeleteEvent(this: Client, message: PossiblyUncachedMessage): Promise<void> {
    if (!(message instanceof Message)) {
        console.log("Got Uncached Delete:", message); return;
    }

    await saveSnipe(message.author, message.channelID, EncryptionHandler.encrypt(message.content), null, "delete");
}

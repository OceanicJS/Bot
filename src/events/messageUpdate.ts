import EncryptionHandler from "../util/EncryptionHandler.js";
import { saveSnipe } from "../util/util.js";

import type {
    Client,
    JSONMessage,
    Message,
} from "oceanic.js";

export default async function messageUpdateEvent(this: Client, message: Message, oldMessage: JSONMessage | null): Promise<void> {
    await saveSnipe(message.author, message.channelID, EncryptionHandler.encrypt(message.content), oldMessage ? EncryptionHandler.encrypt(oldMessage.content) : null, "edit");
}

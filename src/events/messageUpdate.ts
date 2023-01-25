import EncryptionHandler from "../util/EncryptionHandler.js";
import { saveSnipe } from "../util/util.js";
import type {
    AnyTextChannelWithoutGroup,
    Client,
    JSONMessage,
    Message,
    Uncached
} from "oceanic.js";

export default async function messageUpdateEvent(this: Client, message: Message<Uncached | AnyTextChannelWithoutGroup>, oldMessage: JSONMessage | null) {
    await saveSnipe(message.author, message.channelID, EncryptionHandler.encrypt(message.content), oldMessage ? EncryptionHandler.encrypt(oldMessage.content) : null, "edit");
}

import { saveSnipe } from "../util/util.js";
import type {
    AnyTextChannelWithoutGroup,
    Client,
    JSONMessage,
    Message,
    Uncached
} from "oceanic.js";

export default async function messageUpdateEvent(this: Client, message: Message<Uncached | AnyTextChannelWithoutGroup>, oldMessage: JSONMessage | null) {
    await saveSnipe(message.author, message.channelID, message.content, oldMessage?.content || null, "edit");
}

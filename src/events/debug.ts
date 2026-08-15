import Logger from "@uwu-codes/logger";

import type { Client } from "oceanic.js";

export default async function debugEvent(this: Client, info: string, id?: number): Promise<void> {
    Logger.getLogger(`Debug${id === undefined ? "" : `/${id}`}`).debug(info);
}

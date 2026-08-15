import Logger from "@uwu-codes/logger";

import type { Client } from "oceanic.js";

export default async function errorEvent(this: Client, info: string | Error, id?: number): Promise<void> {
    Logger.getLogger(`Error${id === undefined ? "" : `/${id}`}`).error(info);
}

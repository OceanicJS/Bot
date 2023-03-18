import Logger from "@uwu-codes/logger";
import type { Client } from "oceanic.js";


export default async function debugEvent(this: Client, info: string, id?: number) {
    Logger.getLogger(`Debug${id === undefined ? "" : `/${id}`}`).debug(info);
}

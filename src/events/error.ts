import Logger from "@uwu-codes/logger";
import type { Client } from "oceanic.js";


export default async function errorEvent(this: Client, info: string, id?: number) {
    Logger.getLogger(`Error${id === undefined ? "" : `/${id}`}`).error(info);
}

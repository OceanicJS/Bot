import type { Client } from "oceanic.js";


export default async function debugEvent(this: Client, info: string, id?: number) {
    console.debug(`[Debug${id === undefined ? "" : `/${id}`}]:`, info);
}

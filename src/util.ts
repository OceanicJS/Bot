import config from "../config.json" assert { type: "json" };
import type { CreateGuildApplicationCommandOptions } from "oceanic.js";
import type { PathLike } from "fs";
import { access, readFile, writeFile } from "fs/promises";

export interface Cache {
	commands: Array<CreateGuildApplicationCommandOptions>;
	commit: string | null;
	pulls: Array<[id: number, state: string]>;
	snipes: Array<Snipe> ;
}

interface Snipe {
	author: Record<"id" | "tag" | "avatarURL", string>;
	channel: string;
	content: string;
	oldContent: string | null;
	timestamp: number;
	type: "delete" | "edit";
}

export const filter = (str: string) => str.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
export const exists = (path: PathLike) => access(path).then(() => true, () => false);
export const truncateWords = (str: string, maxLen: number) => {
	if (str.length <= maxLen) return str;
	let result = "";
	for (const part of str.split(" ")) {
		if (result.length + part.length + 3 > maxLen) break;
		result += `${part} `;
	}
	return `${result}...`;
};
export const truncate = (str: string, maxLen: number) => {
	if (str.length <= maxLen) return str;
	return `${str.slice(0, maxLen - 3)}...`;
};
export async function readCache() {
	return (await exists(`${config.dataDir}/cache.json`)) ? JSON.parse(await readFile(`${config.dataDir}/cache.json`, "utf-8")) as Cache : { commands: [], commit: null, pulls: [], snipes: [] };
}
export async function writeCache(cache: Cache) {
	await writeFile(`${config.dataDir}/cache.json`, JSON.stringify(cache, null, 2));
}

import { Config, exists } from "./util.js";
import { handleError } from "./error.js";
import { type CreateGuildApplicationCommandOptions } from "oceanic.js";
import { lock, unlock } from "proper-lockfile";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

export interface ICache {
    commandIDs: Record<string, string>;
    commands: Array<CreateGuildApplicationCommandOptions>;
    commit: string | null;
    connections: Record<string, { accessToken: string; commits: number; }>;
    pulls: Array<[id: number, state: string]>;
    snipes: Array<Snipe>;
}

interface Snipe {
    author: Record<"id" | "tag" | "avatarURL", string>;
    channel: string;
    content: string;
    oldContent: string | null;
    timestamp: number;
    type: "delete" | "edit";
}

// this definitely has problems, but it'll work good enough
export default class Cache {
    private static lockKey: string | null = null;

    static async lock() {
        await lock(`${Config.dataDir}/cache.json`, { retries: { retries: 10, factor: 1, minTimeout: 1000, maxTimeout: 10000 } });

        this.lockKey = randomBytes(16).toString("hex");
        return this.lockKey;
    }

    static async read(key?: string) {
        let didLock = false;
        if (key === undefined) {
            key = await this.lock();
            didLock = true;
        }

        if (key !== this.lockKey) {
            throw new Error("Attempted to read cache with invalid key");
        }

        let data: ICache | undefined;
        if (await exists(`${Config.dataDir}/cache.json`)) {
            try {
                data = JSON.parse(await readFile(`${Config.dataDir}/cache.json`, "utf8")) as ICache;
            } catch (err) {
                await handleError("Failed To Load Cache", err as Error);
                throw err; // rethrow so we don't accidentally delete the file or something dumb
            }
        }

        if (didLock) {
            await this.unlock(key);
        }

        return data ?? { commands: [], commandIDs: {}, commit: null, connections: {}, pulls: [], snipes: [] } satisfies ICache;
    }

    static async unlock(key: string) {
        if (this.lockKey !== key) {
            throw new Error("Attempted to unlock cache with invalid key");
        }

        await unlock(`${Config.dataDir}/cache.json`);
        this.lockKey = null;
    }

    static async write(data: ICache, key?: string) {
        let didLock = false;
        if (key === undefined) {
            key = await this.lock();
            didLock = true;
        }

        if (key !== this.lockKey) {
            throw new Error("Attempted to write cache with invalid key");
        }

        await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(data, null, 2));
        if (didLock) {
            await this.unlock(key);
        }
    }
}

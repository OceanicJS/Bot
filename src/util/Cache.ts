import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { type CreateGuildApplicationCommandOptions } from "oceanic.js";
import { lock, unlock } from "proper-lockfile";

import { handleError } from "./error.js";
import { Config, exists } from "./util.js";

export interface ICache {
    commandIDs: Record<string, string>;
    commands: Array<CreateGuildApplicationCommandOptions>;
    commit: string | null;
    connections: Record<string, { accessToken: string; commits: number } | undefined>;
    pulls: Array<[id: number, state: string]>;
    snipes: Array<Snipe>;
}

export interface Snipe {
    author: Record<"id" | "tag" | "avatarURL", string>;
    channel: string;
    content: string;
    oldContent: string | null;
    timestamp: number;
    type: "delete" | "edit";
}

function getDefaultCache(): ICache {
    return { commands: [], commandIDs: {}, commit: null, connections: {}, pulls: [], snipes: [] };
}

// this definitely has problems, but it'll work good enough
export default class Cache {
    private static lockKey: string | null = null;
    private static releaseLock: (() => Promise<void>) | null = null;

    static async lock(): Promise<string> {
        if (this.lockKey !== null) {
            throw new Error("Attempted to lock cache while another cache lock is already active in this process");
        }

        // proper-lockfile requires the target file to already exist (it resolves the realpath before locking)
        if (!await exists(`${Config.dataDir}/cache.json`)) {
            await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(getDefaultCache(), null, 2));
        }

        const release = await lock(`${Config.dataDir}/cache.json`, { retries: { retries: 10, factor: 1, minTimeout: 1000, maxTimeout: 10000 } });

        this.lockKey = randomBytes(16).toString("hex");
        this.releaseLock = release;
        return this.lockKey;
    }

    static async read(key?: string): Promise<ICache> {
        let didLock = false;
        let lockKey = key;
        if (key === undefined) {
            lockKey = await this.lock();
            didLock = true;
        }

        if (lockKey !== this.lockKey) {
            throw new Error("Attempted to read cache with invalid key");
        }

        try {
            let data: ICache | undefined;
            if (await exists(`${Config.dataDir}/cache.json`)) {
                try {
                    data = JSON.parse(await readFile(`${Config.dataDir}/cache.json`, "utf8")) as ICache;
                } catch (err) {
                    await handleError("Failed To Load Cache", err as Error);
                    throw err; // rethrow so we don't accidentally delete the file or something dumb
                }
            }

            return data ?? getDefaultCache();
        } finally {
            if (didLock) {
                await this.unlock(lockKey);
            }
        }
    }

    static async unlock(key: string): Promise<void> {
        if (this.lockKey !== key) {
            throw new Error("Attempted to unlock cache with invalid key");
        }

        const release = this.releaseLock;
        this.releaseLock = null;
        this.lockKey = null;

        if (release) {
            await release();
            return;
        }

        await unlock(`${Config.dataDir}/cache.json`);
    }

    static async write(data: ICache, key?: string): Promise<void> {
        let didLock = false;
        let lockKey = key;
        if (key === undefined) {
            lockKey = await this.lock();
            didLock = true;
        }

        if (lockKey !== this.lockKey) {
            throw new Error("Attempted to write cache with invalid key");
        }

        try {
            await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(data, null, 2));
        } finally {
            if (didLock) {
                await this.unlock(lockKey);
            }
        }
    }
}

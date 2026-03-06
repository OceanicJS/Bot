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

export interface Snipe {
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
    private static releaseLock: (() => Promise<void>) | null = null;

    static async lock() {
        if (this.lockKey !== null) {
            throw new Error("Attempted to lock cache while another cache lock is already active in this process");
        }

        const release = await lock(`${Config.dataDir}/cache.json`, { retries: { retries: 10, factor: 1, minTimeout: 1000, maxTimeout: 10000 } });

        this.lockKey = randomBytes(16).toString("hex");
        this.releaseLock = release;
        return this.lockKey;
    }

    static async read(key?: string) {
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

            return data ?? { commands: [], commandIDs: {}, commit: null, connections: {}, pulls: [], snipes: [] } satisfies ICache;
        } finally {
            if (didLock) {
                await this.unlock(lockKey);
            }
        }
    }

    static async unlock(key: string) {
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

    static async write(data: ICache, key?: string) {
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

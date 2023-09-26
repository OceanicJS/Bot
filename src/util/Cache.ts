import { Config, exists } from "./util.js";
import { handleError } from "./error.js";
import { type CreateGuildApplicationCommandOptions } from "oceanic.js";
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
    private static _resolveLock: (() => void) | null = null;
    private static lockKey: string | null;
    static processing = false;
    static readWaiting = new Array<() => void>();
    static writeQueue: Array<{ func(cache: ICache): ICache | Promise<ICache>; resolve(): void; }> = [];
    private static flushReads() {
        console.log("flushReads");
        for (const resolve of this.readWaiting) {
            resolve();
        }
        this.readWaiting = [];
    }
    private static async processQueue() {
        console.log("processQueue:", this.processing);
        if (this.processing) {
            return;
        }

        const r = this.writeQueue.shift();
        if (r) {
            const cache = await r.func(await this.read(true));
            await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(cache, null, 2));
            r.resolve();
            void this.processQueue();
        } else {
            this.processing = false;
            this.flushReads();
            if (this._resolveLock !== null) {
                this._resolveLock();
                this._resolveLock = null;
            }
        }
    }

    static async lock() {
        console.log("lock:", this.lockKey, this.processing);
        if (this.lockKey !== null) {
            throw new Error("Attempted to lock cache while already locked");
        }

        if (this.processing) {
            await new Promise<void>(resolve => this._resolveLock = resolve);
        }

        this.lockKey = randomBytes(16).toString("hex");
        this.processing = true;
        return this.lockKey;
    }

    static async read(bypass = false) {
        console.log("read:", this.processing);
        if (bypass === false && this.processing) {
            await new Promise<void>(resolve => {
                this.readWaiting.push(resolve);
            });
        }

        if (await exists(`${Config.dataDir}/cache.json`)) {
            try {
                return JSON.parse(await readFile(`${Config.dataDir}/cache.json`, "utf8")) as ICache;
            } catch (err) {
                await handleError("Failed To Load Cache", err as Error);
                throw err; // rethrow so we don't accidentally delete the file or something dumb
            }
        }

        return { commands: [], commandIDs: {}, commit: null, connections: {}, pulls: [], snipes: [] } satisfies ICache;
    }

    static async unlock(key: string) {
        console.log("unlock:", this.lockKey, key, this.processing);
        if (this.lockKey !== key) {
            throw new Error("Attempted to unlock cache with invalid key");
        }

        this.lockKey = null;
        this.processing = false;
        void this.processQueue();
    }

    static async write(func: (cache: ICache) => ICache | Promise<ICache>) {
        console.log("write:", this.processing);
        return new Promise<void>(resolve => {
            this.writeQueue.push({ func, resolve });
            void this.processQueue();
        });
    }

    static async writeUnsafe(key: string, cache: ICache) {
        console.log("writeUnsafe:", this.lockKey, key, this.processing);
        if (this.lockKey !== key) {
            throw new Error("Attempted to write cache with invalid key");
        }

        await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(cache, null, 2));
    }
}

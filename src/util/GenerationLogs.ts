import GenerationQueue from "./GenerationQueue.js";
import { discordLog } from "./util.js";
import type { File } from "oceanic.js";

export default class GenerationLogs {
    private static logs = new Map<string, Array<string>>();

    static add(version: string, message: string) {
        this.logs.set(version, [...(this.logs.get(version) ?? []), message]);
        return true;
    }

    static addCurrent(message: string, throwIfNull = false) {
        const version = GenerationQueue.getCurrent();
        if (version === null) {
            if (throwIfNull) {
                throw new Error(message);
            } else {
                return false;
            }
        }

        return this.add(version, message);
    }

    static get(version: string, remove = true) {
        const logs = this.logs.get(version);
        if (remove) {
            this.logs.delete(version);
        }
        return logs ?? [];
    }

    static async save(version: string) {
        const logs = this.get(version);
        let content = `Generation Logs For ${version}`;
        const files: Array<File> = [];
        if (logs.length === 0) {
            content = `Generation for **${version}** completed with no logs.`;
        } else {
            content = `Generation for **${version}** completed with ${logs.length} log${logs.length === 1 ? "" : "s"}.`;
            files.push({
                contents: Buffer.from(logs.join("\n")),
                name:     "logs.txt"
            });
        }
        await discordLog({
            content,
            files
        });
    }
}

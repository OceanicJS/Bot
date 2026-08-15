import Logger from "@uwu-codes/logger";
import { ActivityTypes, RoleConnectionMetadataTypes, type Client } from "oceanic.js";

import Commands from "../util/Commands.js";
import runGit from "../util/git.js";
import { Config } from "../util/util.js";

let firstReady = false;
export default async function readyEvent(this: Client): Promise<void> {
    Logger.info("Ready As %s", this.user.tag);
    if (firstReady) {
        Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
        return;
    }
    firstReady = true;
    await Commands.load();
    await Commands.register(this);
    await this.application.updateRoleConnectionsMetadata([
        {
            type: RoleConnectionMetadataTypes.INTEGER_GREATER_THAN_OR_EQUAL,
            key: "commits",
            name: "Github Commits",
            description: "Must Have Made A Commit In https://github.com/OceanicJS/Oceanic",
        },
    ]);

    setInterval(() => {
        void this.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" }]);
    }, 6e4);
    if (!Config.skipGit) {
        await runGit.call(this);
        setInterval(() => {
            const d = new Date();
            if ((d.getMinutes() % 15) === 0 && d.getSeconds() === 0) {
                void runGit.call(this);
            }
        }, 1e3);
    }
}

import runGit from "../util/git.js";
import Commands from "../util/Commands.js";
import { Config } from "../util/util.js";
import { ActivityTypes, RoleConnectionMetadataTypes, type Client } from "oceanic.js";
import Logger from "@uwu-codes/logger";

let firstReady = false;
export default async function readyEvent(this: Client) {
    Logger.info("Ready As %s", this.user.tag);
    if (firstReady === true) {
        return Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
    }
    firstReady = true;
    await Commands.load();
    await Commands.register(this);
    await this.application.updateRoleConnectionsMetadata([
        {
            type:        RoleConnectionMetadataTypes.INTEGER_GREATER_THAN_OR_EQUAL,
            key:         "commits",
            name:        "Github Commits",
            description: "Must Have Made A Commit In https://github.com/OceanicJS/Oceanic"
        }
    ]);

    setInterval(() => {
        void this.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ]);
    }, 6e4);
    if (!Config.skipGit) {
        await runGit.call(this);
        setInterval(async() => {
            const d = new Date();
            if ((d.getMinutes() % 15) === 0 && d.getSeconds() === 0) {
                await runGit.call(this);
            }
        }, 1e3);
    }
}

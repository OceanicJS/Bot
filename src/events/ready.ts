import runGit from "../util/git.js";
import Commands from "../util/Commands.js";
import { Config } from "../util/util.js";
import { ActivityTypes, RoleConnectionMetadataTypes, type Client } from "oceanic.js";

export default async function readyEvent(this: Client) {
    console.log("Ready As", this.user.tag);
    await Commands.load();
    await Commands.register(this);
    await this.application.updateRoleConnectionsMetata([
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
            if (d.getMinutes() === 0 && d.getSeconds() === 0) {
                await runGit.call(this);
            }
        }, 1e3);
    }
}

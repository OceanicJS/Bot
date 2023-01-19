import runGit from "../util/git.js";
import Commands from "../util/Commands.js";
import { Config } from "../util/util.js";
import { ActivityTypes, type Client } from "oceanic.js";

export default async function readyEvent(this: Client) {
    console.log("Ready As", this.user.tag);
    await Commands.load();
    await Commands.register(this);

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

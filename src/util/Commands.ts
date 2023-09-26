import type Command from "./Command.js";
import { Config } from "./util.js";
import type { EmptyCommand } from "./Command.js";
import Cache from "./Cache.js";
import { type Client, type CommandInteraction, MessageFlags } from "oceanic.js";
import { readdir } from "node:fs/promises";

const commandDir = new URL("../commands", import.meta.url).pathname;


export default class Commands {
    static commandMap = new Map<string, Command>();
    static commands: Array<Command> = [];

    static async handle(client: Client, interaction: CommandInteraction) {
        const command = this.commandMap.get(interaction.data.name);
        await (command ? command.run.call(client, interaction) : interaction.createMessage({ content: "I couldn't figure out how to execute that command.", flags: MessageFlags.EPHEMERAL }));
    }
    static async load() {
        const files = await readdir(commandDir, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile()) {
                const command = new ((await import(`${commandDir}/${file.name}`) as { default: typeof EmptyCommand; }).default)();
                this.commandMap.set(command.name, command);
                this.commands.push(command);
            }
        }
    }

    static async register(client: Client) {
        const commands = this.toJSON();
        const cache = await Cache.read();
        if (JSON.stringify(commands) !== JSON.stringify(cache.commands)) {
            let ids: Record<string, string>;
            try {
                ids = Object.fromEntries((await client.application.bulkEditGuildCommands(Config.guild, commands)).map(b => [b.name, b.id]));
            } catch (err) {
                console.log("Command registration error, index list:");
                console.log(commands.map((c, i) => `${i}: ${c.name}`).join("\n"));
                throw err;
            }
            await Cache.write(c => {
                c.commands = commands;
                c.commandIDs = ids;
                return c;
            });
        }
    }

    static toJSON() {
        return this.commands.map(command => command.toJSON());
    }
}

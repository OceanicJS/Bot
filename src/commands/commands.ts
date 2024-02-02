import Cache from "../util/Cache.js";
import Command from "../util/Command.js";
import { ApplicationCommandTypes, type Client, type CommandInteraction, MessageFlags } from "oceanic.js";

export default class CommandsCommand extends Command {
    override description = "List my usable commands.";
    override name = "commands";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        const cache = await Cache.read();
        return interaction.reply({
            embeds: [
                {
                    title:       "Commands",
                    description: [
                        "-- Documentation --",
                        "Latest Version:",
                        `</docs class:${cache.commandIDs.docs}>`,
                        `</docs method:${cache.commandIDs.docs}>`,
                        `</docs event:${cache.commandIDs.docs}>`,
                        `</docs type:${cache.commandIDs.docs}>`,
                        `</docs property class:${cache.commandIDs.docs}>`,
                        `</docs property interface:${cache.commandIDs.docs}>`,
                        "Version Specific:",
                        `</vdocs class:${cache.commandIDs.vdocs}>`,
                        `</vdocs method:${cache.commandIDs.vdocs}>`,
                        `</vdocs event:${cache.commandIDs.vdocs}>`,
                        `</vdocs type:${cache.commandIDs.vdocs}>`,
                        `</vdocs property class:${cache.commandIDs.vdocs}>`,
                        `</vdocs property interface:${cache.commandIDs.vdocs}>`
                    ].join("\n"),
                    color: 0x2A5099
                }
            ],
            flags: MessageFlags.EPHEMERAL
        });
    }
}

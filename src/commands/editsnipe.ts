import Command from "../util/Command.js";
import { filter, getSnipe } from "../util/util.js";
import type { ApplicationCommandBuilder } from "@oceanicjs/builders";
import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    ChannelTypes,
    type Client,
    type CommandInteraction,
    MessageFlags
} from "oceanic.js";

export default class EditSnipeCommand extends Command {
    override description = "Get the last edited message in a channel.";
    override name = "editsnipe";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        const channel = interaction.data.options.getChannelOption("channel")?.value || interaction.channelID;
        const snipe = await getSnipe(channel, "edit");
        if (!snipe) {
            return interaction.createMessage({
                content: "No snipes found.",
                flags:   MessageFlags.EPHEMERAL
            });
        }
        return interaction.createMessage({
            embeds: [
                {
                    title:  "Edit Snipe",
                    author: {
                        name:    snipe.author.tag,
                        iconURL: snipe.author.avatarURL
                    },
                    color:  0xFFD700,
                    fields: [
                        {
                            name:  "New Content",
                            value: filter(snipe.content || "[No content]").slice(0, 1024)
                        },
                        {
                            name:  "Old Content",
                            value: filter(snipe.oldContent || "[No content]").slice(0, 1024)
                        }
                    ],
                    timestamp: new Date(snipe.timestamp).toISOString(),
                    footer:    {
                        text: "Edited at"
                    }
                }
            ]
        });
    }

    override setOptions(command: ApplicationCommandBuilder) {
        command
            .addOption("channel", ApplicationCommandOptionTypes.CHANNEL, option => {
                option.setDescription("The channel to snipe. Defaults to the current channel.")
                    .setChannelTypes([ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT, ChannelTypes.GUILD_VOICE, ChannelTypes.ANNOUNCEMENT_THREAD, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD]);
            });
    }
}

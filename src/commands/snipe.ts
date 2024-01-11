import Command from "../util/Command.js";
import { filter, getSnipe } from "../util/util.js";
import EncryptionHandler from "../util/EncryptionHandler.js";
import { type Snipe } from "../util/Cache.js";
import {
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    ChannelTypes,
    type Client,
    type CommandInteraction,
    MessageFlags
} from "oceanic.js";
import type { ApplicationCommandBuilder } from "@oceanicjs/builders";

export default class SnipeCommand extends Command {
    override description = "Get the last deleted message in a channel.";
    override name = "snipe";
    override type = ApplicationCommandTypes.CHAT_INPUT;
    override async run(this: Client, interaction: CommandInteraction) {
        const channel = interaction.data.options.getChannelOption("channel")?.value || interaction.channelID;
        let snipe: Snipe | null;
        try {
            snipe = await getSnipe(channel, "delete");
        } catch (e) {
            const err = e as Error;
            return interaction.createMessage({
                content: `Failed to fetch snipe: **${err.name}: ${err.message}**`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
        if (!snipe) {
            return interaction.createMessage({
                content: "No snipes found.",
                flags:   MessageFlags.EPHEMERAL
            });
        }
        return interaction.createMessage({
            embeds: [
                {
                    title:  "Delete Snipe",
                    author: {
                        name:    snipe.author.tag,
                        iconURL: snipe.author.avatarURL
                    },
                    color:  0xC61A09,
                    fields: [
                        {
                            name:  "Content",
                            value: filter(EncryptionHandler.decrypt(snipe.content) || "[No content]").slice(0, 1024)
                        }
                    ],
                    timestamp: new Date(snipe.timestamp).toISOString(),
                    footer:    {
                        text: "Deleted at"
                    }
                }
            ]
        });
    }

    override setOptions(command: ApplicationCommandBuilder) {
        command
            .addOption("channel", ApplicationCommandOptionTypes.CHANNEL, option => {
                option.setDescription("The channel to snipe. Defaults to the current channel.")
                    .setChannelTypes([ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT, ChannelTypes.GUILD_VOICE, ChannelTypes.ANNOUNCEMENT_THREAD, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD])
                    .setRequired(false);
            });
    }
}

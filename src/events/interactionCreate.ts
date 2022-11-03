import { handleAutocomplete, handleDocsCommand, handleVersionedDocsCommand } from "../cmd/docs";
import { defaultVersion, filter, getSnipe, readCache } from "../util";
import runGit from "../util/git";
import { AnyInteractionGateway, Client, InteractionTypes, MessageFlags } from "oceanic.js";

export default async function interactionCreateEvent(this: Client, interaction: AnyInteractionGateway) {
    if (interaction.type === InteractionTypes.APPLICATION_COMMAND) {
        console.log(`[${new Date().toISOString()}][command/${interaction.data.name}]: ${interaction.user.tag} (${interaction.user.id})`);
        switch (interaction.data.name) {
            case "editsnipe": {
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

            case "snipe": {
                const channel = interaction.data.options.getChannelOption("channel")?.value || interaction.channelID;
                const snipe = await getSnipe(channel, "delete");
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
                                    value: filter(snipe.content || "[No content]").slice(0, 1024)
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

            case "eval": {
                // eslint-disable-next-line unicorn/prefer-ternary
                if (interaction.user.id !== "242843345402069002") {
                    return interaction.createMessage({ content: "Sike" });
                } else {
                    return interaction.createMessage({
                        embeds: [
                            {
                                title:       "Eval Result",
                                // eslint-disable-next-line no-eval, @typescript-eslint/restrict-template-expressions
                                description: `\`\`\`js\n${eval(interaction.data.options.getString("code", true))}\`\`\``
                            }
                        ]
                    });
                }
            }

            case "check-git": {
                if (interaction.user.id !== "242843345402069002") {
                    return interaction.createMessage({ content: "Sike" });
                } else {
                    await interaction.defer(MessageFlags.EPHEMERAL);
                    await runGit.call(this);
                    await interaction.createFollowup({ content: "Done" });
                }
                break;
            }

            case "docs": {
                return handleDocsCommand.call(this, interaction);
            }

            case "vdocs": {
                return handleVersionedDocsCommand.call(this, interaction);
            }

            case "commands": {
                const cache = await readCache();
                return interaction.createMessage({
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
    }

    if (interaction.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) {
        console.log(`[${new Date().toISOString()}][autocomplete/${interaction.data.name}]: ${interaction.user.tag} (${interaction.user.id})`);
        switch (interaction.data.name) {
            case "docs":
            case "vdocs": {
                return handleAutocomplete.call(this, interaction, defaultVersion);
            }
        }
    }
}

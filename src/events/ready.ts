import { readCache, writeCache } from "../util";
import config from "../../config.json" assert { type: "json" };
import runGit from "../util/git";
import {
    ActivityTypes,
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    ChannelTypes,
    Client,
    CreateGuildApplicationCommandOptions
} from "oceanic.js";

export default async function readyEvent(this: Client) {
    const cache = await readCache();
    console.log("Ready As", this.user.tag);
    const commands: Array<CreateGuildApplicationCommandOptions> = [
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "snipe",
            description: "Get the last deleted message in a channel.",
            options:     [
                {
                    type:         ApplicationCommandOptionTypes.CHANNEL,
                    name:         "channel",
                    description:  "The channel to snipe. Defaults to the current channel.",
                    channelTypes: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT, ChannelTypes.GUILD_VOICE, ChannelTypes.ANNOUNCEMENT_THREAD, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD],
                    required:     false
                }
            ]
        },
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "editsnipe",
            description: "Get the last edited message in a channel.",
            options:     [
                {
                    type:         ApplicationCommandOptionTypes.CHANNEL,
                    name:         "channel",
                    description:  "The channel to snipe. Defaults to the current channel.",
                    channelTypes: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_ANNOUNCEMENT, ChannelTypes.GUILD_VOICE, ChannelTypes.ANNOUNCEMENT_THREAD, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD],
                    required:     false
                }
            ]
        },
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "eval",
            description: "Evaluate some code",
            options:     [
                {
                    type:        ApplicationCommandOptionTypes.STRING,
                    name:        "code",
                    description: "The code to evaluate",
                    required:    true
                }
            ],
            defaultMemberPermissions: "8"
        },
        {
            type:                     ApplicationCommandTypes.CHAT_INPUT,
            name:                     "check-git",
            description:              "Check Discord's github for updates.",
            defaultMemberPermissions: "8"
        },
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "docs",
            description: "Get documentation for Oceanic.",
            options:     [
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "class",
                    description: "Get documentation for a class.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "event",
                    description: "Get documentation for an event.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get event information from.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "event",
                            description:  "The name of the event to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                    name:        "property",
                    description: "Get documentation for a property.",
                    options:     [
                        {
                            type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                            name:        "class",
                            description: "Get documentation for a class property.",
                            options:     [
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "class",
                                    description:  "The name of the class to get property information from.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "property",
                                    description:  "The name of the property to get information about.",
                                    required:     true,
                                    autocomplete: true
                                }
                            ]
                        },
                        {
                            type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                            name:        "interface",
                            description: "Get documentation for an interface property.",
                            options:     [
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "interface",
                                    description:  "The name of the interface to get property information from.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "property",
                                    description:  "The name of the property to get information about.",
                                    required:     true,
                                    autocomplete: true
                                }
                            ]
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "method",
                    description: "Get documentation for a method.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get method information from.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "method",
                            description:  "The name of the method to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "type",
                    description: "Get documentation for a type.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "type",
                            description:  "The name of the type to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                }
            ]
        },
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "vdocs",
            description: "Get version specific documentation for Oceanic.",
            options:     [
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "class",
                    description: "Get documentation for a class.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "version",
                            description:  "The version of Oceanic to get documentation for.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "event",
                    description: "Get documentation for an event.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "version",
                            description:  "The version of Oceanic to get documentation for.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get event information from.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "event",
                            description:  "The name of the event to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                    name:        "property",
                    description: "Get documentation for a property.",
                    options:     [
                        {
                            type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                            name:        "class",
                            description: "Get documentation for a class property.",
                            options:     [
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "version",
                                    description:  "The version of Oceanic to get documentation for.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "class",
                                    description:  "The name of the class to get property information from.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "property",
                                    description:  "The name of the property to get information about.",
                                    required:     true,
                                    autocomplete: true
                                }
                            ]
                        },
                        {
                            type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                            name:        "interface",
                            description: "Get documentation for an interface property.",
                            options:     [
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "version",
                                    description:  "The version of Oceanic to get documentation for.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "interface",
                                    description:  "The name of the interface to get property information from.",
                                    required:     true,
                                    autocomplete: true
                                },
                                {
                                    type:         ApplicationCommandOptionTypes.STRING,
                                    name:         "property",
                                    description:  "The name of the property to get information about.",
                                    required:     true,
                                    autocomplete: true
                                }
                            ]
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "method",
                    description: "Get documentation for a method.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "version",
                            description:  "The version of Oceanic to get documentation for.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "class",
                            description:  "The name of the class to get method information from.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "method",
                            description:  "The name of the method to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                },
                {
                    type:        ApplicationCommandOptionTypes.SUB_COMMAND,
                    name:        "type",
                    description: "Get documentation for a type.",
                    options:     [
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "version",
                            description:  "The version of Oceanic to get documentation for.",
                            required:     true,
                            autocomplete: true
                        },
                        {
                            type:         ApplicationCommandOptionTypes.STRING,
                            name:         "type",
                            description:  "The name of the type to get information about.",
                            required:     true,
                            autocomplete: true
                        }
                    ]
                }
            ]
        },
        {
            type:        ApplicationCommandTypes.CHAT_INPUT,
            name:        "commands",
            description: "List my usable commands."
        }
    ];
    if (JSON.stringify(commands) !== JSON.stringify(cache.commands)) {
        const ids = Object.fromEntries((await this.application.bulkEditGuildCommands(config.guild, commands)).map(b => [b.name, b.id]));
        cache.commands = commands;
        cache.commandIDs = ids;
        await writeCache(cache);
    }

    setInterval(() => {
        void this.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ]);
    }, 6e4);
    if (!config.skipGit) {
        await runGit.call(this);
        setInterval(async() => {
            const d = new Date();
            if (d.getMinutes() === 0 && d.getSeconds() === 0) {
                await runGit.call(this);
            }
        }, 1e3);
    }
}

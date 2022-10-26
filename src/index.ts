import {
    defaultVersion,
    filter,
    readCache,
    truncate,
    truncateWords,
    writeCache
} from "./util";
import { handleDocsCommand, handleVersionedDocsCommand, handleAutocomplete } from "./cmd/docs";
import config from "../config.json" assert { type: "json" };
import type { CreateGuildApplicationCommandOptions, User } from "oceanic.js";
import {
    DiscordHTTPError,
    ActivityTypes,
    MessageFlags,
    ApplicationCommandOptionTypes,
    ApplicationCommandTypes,
    ChannelTypes,
    InteractionTypes,
    Message,
    Client
} from "oceanic.js";
import { Octokit } from "@octokit/rest";
import { mkdir } from "node:fs/promises";

await mkdir(`${config.dataDir}/docs`, { recursive: true });

const cache = await readCache();
const client = new Client({
    auth:    config.token,
    gateway: {
        intents:  ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT", "GUILD_MEMBERS"],
        presence: {
            activities: [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ],
            status:     "online"
        }
    }
});
const octo = new Octokit({
    auth: config.git
});

client.once("ready", async() => {
    console.log("Ready As", client.user.tag);
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
        const ids = Object.fromEntries((await client.application.bulkEditGuildCommands(config.guild, commands)).map(b => [b.name, b.id]));
        cache.commands = commands;
        cache.commandIDs = ids;
        await writeCache(cache);
    }

    setInterval(() => {
        void client.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ]);
    }, 6e4);
    await checkGit();
    setInterval(async() => {
        const d = new Date();
        if (d.getMinutes() === 0 && d.getSeconds() === 0) {
            await checkGit();
        }
    }, 1e3);
});

async function getSnipe(channel: string, type: "delete" | "edit") {
    const snipe = cache.snipes.sort((a,b) => b.timestamp - a.timestamp).find(sn => sn.channel === channel && sn.type === type);
    if (!snipe) {
        return null;
    }
    cache.snipes.splice(cache.snipes.indexOf(snipe), 1);
    await writeCache(cache);
    return snipe;
}

async function saveSnipe(author: User, channel: string, content: string, oldContent: string | null, type: "delete" | "edit") {
    const index = cache.snipes.unshift({ author: { id: author.id, tag: author.tag, avatarURL: author.avatarURL() }, channel, content, oldContent, timestamp: Date.now(), type });
    await writeCache(cache);
    return cache.snipes[index];
}

async function checkGit() {
    const commits = await octo.repos.listCommits({
        owner:    "discord",
        repo:     "discord-api-docs",
        per_page: 100
    });
    const previous = cache.commit;
    cache.commit = commits.data[0].sha;
    await writeCache(cache);
    if (previous === null) {
        console.log("No cached commit, not logging anything");
    } else {
        const prevIndex = commits.data.findIndex(commit => commit.sha === previous);
        const newCommits = commits.data.slice(0, prevIndex === -1 ? 100 : prevIndex);
        if (newCommits.length !== 0) {
            let log = "";
            for (const commit of newCommits) {
                const newLog = `[\`${commit.sha.slice(0, 7)}\`](${commit.html_url}) ${truncate(commit.commit.message.split("\n")[0], 50)}${commit.author ? ` - ${commit.author.name || commit.author.login}` : ""}\n`;
                if (log.length + newLog.length >= 4096) {
                    break;
                }
                log += newLog;
            }
            await client.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
                embeds: [
                    {
                        color:  7506394,
                        title:  `[discord-api-docs:main] ${newCommits.length} new commit${newCommits.length === 1 ? "" : "s"}`,
                        author: {
                            name:    "Discord",
                            iconURL: "https://avatars.githubusercontent.com/u/1965106?v=4"
                        },
                        description: log || "No Log",
                        url:         commits.data[0].html_url
                    }
                ]
            });
        }
    }

    const { data: pulls } = await octo.pulls.list({
        owner:    "discord",
        repo:     "discord-api-docs",
        per_page: 100,
        state:    "all"
    });

    const num = cache.pulls.reduce((a, [id]) => a.concat(id), [] as Array<number>);
    const temp: Array<[number, string]> = [];
    for (const pull of pulls.reverse()) {
        let state: "open" | "closed" | undefined;
        if (!num.includes(pull.number)) {
            temp.push([pull.number, pull.state]);
            console.log("New PR:", pull.number, pull.state);
            state = pull.state as "open" | "closed";
        } else {
            const oldState = cache.pulls.find(([id]) => id === pull.number)![1];
            if (pull.state !== oldState) {
                console.log("PR state changed:", pull.id, oldState, pull.state);
                cache.pulls.find(([id]) => id === pull.number)![1] = pull.state;
                state = pull.state as "open" | "closed";
            } else {
                continue;
            }
        }

        if (state && num.length !== 0) {
            try {
                switch (state) {
                    case "open": {
                        await client.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
                            embeds: [
                                {
                                    color:  38912,
                                    title:  `[discord/discord-api-docs] Pull request opened: #${pull.number} ${truncateWords(pull.title, 256)}`,
                                    author: {
                                        name:    pull.user?.name || pull.user?.login || "Discord",
                                        iconURL: pull.user?.avatar_url || "https://avatars.githubusercontent.com/u/1965106?v=4"
                                    },
                                    description: truncateWords(pull.body || "", 4096),
                                    url:         pull.html_url
                                }
                            ]
                        });
                        break;
                    }

                    case "closed": {
                        await client.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
                            embeds: [
                                {
                                    title:  `[discord/discord-api-docs] Pull request closed: #${pull.number} ${truncateWords(pull.title, 256)}`,
                                    author: {
                                        name:    pull.user?.name || pull.user?.login || "Discord",
                                        iconURL: pull.user?.avatar_url || "https://avatars.githubusercontent.com/u/1965106?v=4"
                                    },
                                    url: pull.html_url
                                }
                            ]
                        });
                        break;
                    }
                }
            } catch (err) {
                if (err instanceof DiscordHTTPError) {
                    console.log("Error sending webhook:", err.message, err.resBody);
                } else {
                    console.error(err);
                }
            }
        }
    }
    cache.pulls = [...temp.reverse(), ...cache.pulls];
    await writeCache(cache);
}

client.on("messageDelete", async message => {
    if (!(message instanceof Message)) {
        return console.log("Got Uncached Delete:", message);
    }
    await saveSnipe(message.author, message.channelID, message.content, null, "delete");
});

client.on("messageUpdate", async(message, oldMessage) => {
    await saveSnipe(message.author, message.channelID, message.content, oldMessage?.content || null, "edit");
});

client.on("guildMemberAdd", async member => {
    if (member.guild.id === "1005489770278953112") {
        await client.rest.channels.createMessage("1005489770849382442", {
            embeds: [
                {
                    title:       "Welcome",
                    description: [
                        `Welcome to Oceanic ${member.mention}.`,
                        //                 rules                   faq                      community-resources               updates
                        "Make sure to read <#1005495702706716834>, <#1005497609198252064> & <#1020781903634256023> and follow <#1005493296887500880> in your server for instant updates.",
                        "",//                                                                      amogus
                        `For documentation, you can visit https://docs.oceanic.ws, or view it via commands in <#1005493250641121392>. To see these commands, use </commands:${cache.commandIDs.commands}>`
                    ].join("\n"),
                    color: 0x2A5099
                }
            ]
        });
    }
});

client.on("interactionCreate", async interaction => {
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
                    await checkGit();
                    await interaction.createFollowup({ content: "Done" });
                }
                break;
            }

            case "docs": {
                return handleDocsCommand.call(client, interaction);
            }

            case "vdocs": {
                return handleVersionedDocsCommand.call(client, interaction);
            }

            case "commands": {
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
                return handleAutocomplete.call(client, interaction, defaultVersion);
            }
        }
    }
});

client.on("debug", (info, id) => {
    console.debug(`[Debug${id === undefined ? "" : `/${id}`}]:`, info);
});

await client.connect();

process.on("unhandledRejection", (err, promise) => {
    console.error("Unhandled Rejection:", err, promise);
})
    .on("uncaughtException", err => {
        console.error("Uncaught Exception:", err);
    });

import {
	filter,
	readCache,
	truncate,
	truncateWords,
	writeCache
} from "./util";
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

const cache = await readCache();
const client = new Client({
	auth:    config.token,
	gateway: {
		intents:  ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"],
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
		}
	];
	if (JSON.stringify(commands) !== JSON.stringify(cache.commands)) {
		await client.application.bulkEditGuildCommands(config.guild, commands);
		cache.commands = commands;
		await writeCache(cache);
	}

	setInterval(() => {
		void client.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.ws" } ]);
	}, 6e4);
	await checkGit();
	setInterval(async() => {
		const d = new Date();
		if (d.getMinutes() === 0 && d.getSeconds() === 0) await checkGit();
	}, 1e3);
});

async function getSnipe(channel: string, type: "delete" | "edit") {
	const snipe = cache.snipes.sort((a,b) => b.timestamp - a.timestamp).find(sn => sn.channel === channel && sn.type === type);
	if (!snipe) return null;
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
		if (newCommits.length > 0) {
			let log = "";
			for (const commit of newCommits) {
				const newLog = `[\`${commit.sha.slice(0, 7)}\`](${commit.html_url}) ${truncate(commit.commit.message.split("\n")[0], 50)}${commit.author ? ` - ${commit.author.name || commit.author.login}` : ""}\n`;
				if (log.length + newLog.length >= 4096) break;
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
			} else continue;
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
				} else console.error(err);
			}
		}
	}
	cache.pulls = [...temp.reverse(), ...cache.pulls];
	await writeCache(cache);
}

client.on("messageDelete", async(message) => {
	if (!(message instanceof Message)) return console.log("Got Uncached Delete:", message);
	await saveSnipe(message.author, message.channelID, message.content, null, "delete");
});

client.on("messageUpdate", async(message, oldMessage) => {
	await saveSnipe(message.author, message.channelID, message.content, oldMessage?.content || null, "edit");
});

client.on("interactionCreate", async(interacton) => {
	if (interacton.type === InteractionTypes.APPLICATION_COMMAND) {
		switch (interacton.data.name) {
			case "editsnipe": {
				const channel = interacton.data.options.getChannelOption("channel")?.value || interacton.channelID;
				const snipe = await getSnipe(channel, "edit");
				if (!snipe) return interacton.createMessage({
					content: "No snipes found.",
					flags:   MessageFlags.EPHEMERAL
				});
				return interacton.createMessage({
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
				const channel = interacton.data.options.getChannelOption("channel")?.value || interacton.channelID;
				const snipe = await getSnipe(channel, "delete");
				if (!snipe) return interacton.createMessage({
					content: "No snipes found.",
					flags:   MessageFlags.EPHEMERAL
				});
				return interacton.createMessage({
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
				if (interacton.user.id !== "242843345402069002") return interacton.createMessage({ content: "Sike" });
				else {
					return interacton.createMessage({
						embeds: [
							{
								title:       "Eval Result",
								// eslint-disable-next-line no-eval, @typescript-eslint/restrict-template-expressions
								description: `\`\`\`js\n${eval(interacton.data.options.getString("code", true))}\`\`\``
							}
						]
					});
				}
			}

			case "check-git": {
				if (interacton.user.id !== "242843345402069002") return interacton.createMessage({ content: "Sike" });
				else {
					await interacton.defer(MessageFlags.EPHEMERAL);
					await checkGit();
					await interacton.createFollowup({ content: "Done" });
				}
				break;
			}
		}
	}
});

client.on("debug", (info, id) => {
	console.debug(`[Debug${id === undefined ? "" : `/${id}`}]:`, info);
});

await client.connect();

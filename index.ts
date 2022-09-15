import config from "./config.json" assert { type: "json" };
import type { CreateGuildApplicationCommandOptions, User } from "oceanic.js";
import {
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
import { access, readFile, writeFile } from "node:fs/promises";
import type { PathLike } from "node:fs";

function filter(str: string) { return str.replace(/\[/g, "\\[").replace(/\]/g, "\\]"); }

const exists = (path: PathLike) => access(path).then(() => true).catch(() => false);
const client = new Client({
	auth:    config.token,
	gateway: {
		intents:  ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"],
		presence: {
			activities: [{ type: ActivityTypes.WATCHING, name: "https://oceanic.owo-whats-this.dev" } ],
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
		}
	];
	const cache = await exists(new URL("command-cache.json", config.dataDir)) ? (await readFile(new URL("command-cache.json", config.dataDir))).toString() : "[]";
	if (JSON.stringify(commands) !== cache) {
		await client.application.bulkEditGuildCommands(config.guild, commands);
		await writeFile(new URL("command-cache.json", config.dataDir), JSON.stringify(commands));
	}

	setInterval(() => {
		void client.editStatus("online", [{ type: ActivityTypes.WATCHING, name: "https://oceanic.owo-whats-this.dev" } ]);
	}, 6e4);
	await checkGit();
	setInterval(async() => {
		const d = new Date();
		if (d.getMinutes() === 0 && d.getSeconds() === 0) await checkGit();
	}, 1e3);
});

interface Snipe {
	author: Record<"id" | "tag" | "avatarURL", string>;
	channel: string;
	content: string;
	oldContent: string | null;
	timestamp: number;
	type: "delete" | "edit";
}

async function getSnipe(channel: string, type: "delete" | "edit") {
	const list = await exists(new URL("snipes.json", config.dataDir)) ? JSON.parse((await readFile(new URL("snipes.json", config.dataDir))).toString()) as Array<Snipe> : [];
	const snipe = list.sort((a,b) => b.timestamp - a.timestamp).find(sn => sn.channel === channel && sn.type === type);
	if (!snipe) return null;
	list.splice(list.indexOf(snipe), 1);
	await writeFile(new URL("snipes.json", config.dataDir), JSON.stringify(list));
	return snipe;
}

async function saveSnipe(author: User, channel: string, content: string, oldContent: string | null, type: "delete" | "edit") {
	const list = await exists(new URL("snipes.json", config.dataDir)) ? JSON.parse((await readFile(new URL("snipes.json", config.dataDir))).toString()) as Array<Snipe> : [];
	const index = list.unshift({ author: { id: author.id, tag: author.tag, avatarURL: author.avatarURL() }, channel, content, oldContent, timestamp: Date.now(), type } as Snipe);
	await writeFile(new URL("snipes.json", config.dataDir), JSON.stringify(list));
	return list[index];
}

async function checkGit() {
	const commits = await octo.repos.listCommits({
		owner:    "discord",
		repo:     "discord-api-docs",
		per_page: 100
	});
	const previous = await exists(new URL("latest-commit", config.dataDir)) ? (await readFile(new URL("latest-commit", config.dataDir))).toString() : null;
	await writeFile(new URL("latest-commit", config.dataDir), commits.data[0].sha);
	if (previous === null) {
		console.log("No cached commit, not logging anything");
		return;
	} else {
		const prevIndex = commits.data.findIndex(commit => commit.sha === previous.replace(/(\r?\n?)+/g, ""));
		const newCommits = commits.data.slice(0, prevIndex === -1 ? 100 : prevIndex);
		if (newCommits.length === 0) return;
		const commitMessage = (str: string) => ((str = str.split("\n")[0], str.length > 50 ? `${str.slice(0, 47)}...` : str));
		let log = "";
		for (const commit of newCommits) {
			const newLog = `[\`${commit.sha.slice(0, 7)}\`](${commit.html_url}) ${commitMessage(commit.commit.message)}${commit.author ? ` - ${commit.author.name || commit.author.login}` : ""}\n`;
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
				break;
			}
		}
	}
});

client.on("debug", (info, id) => {
	console.debug(`[Debug${id === undefined ? "" : `/${id}`}]:`, info);
});

await client.connect();

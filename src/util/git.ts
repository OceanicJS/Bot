import { readCache, truncate, truncateWords, writeCache } from "./util.js";
import config from "../../config.json" assert { type: "json" };
import { Octokit } from "@octokit/rest";
import { Client, DiscordHTTPError } from "oceanic.js";
const octo = new Octokit({
    auth: config.git
});

export default async function runGit(this: Client) {
    const cache = await readCache();
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
            await this.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
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
                        await this.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
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
                        await this.rest.webhooks.execute(config.docsWebhook.id, config.docsWebhook.token, {
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

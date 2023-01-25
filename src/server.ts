import { Config, getCommitCount, readCache, writeCache } from "./util/util.js";
import express from "express";
import morgan from "morgan";
import { Client, OAuthHelper, OAuthScopes } from "oceanic.js";
import cookieParser from "cookie-parser";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { randomBytes } from "node:crypto";

const client = new Client({
    auth: Config.client.token
});


const hook = new Webhooks({
    secret: Config.gitSecret
});

hook.on("push", async ({ payload: data }) => {
    if (data.ref === "refs/heads/dev") {
        const cache = await readCache();
        const counts: Record<string, number> = {};
        const users: Array<string> = [];
        for (const commit of data.commits) {
            const name = commit.author.username ?? commit.author.name;
            if (cache.connections[name.toLowerCase()]) {
                counts[name] = (counts[name.toLowerCase()] || 0) + 1;
                if (!users.includes(name)) {
                    users.push(name);
                }
            }
        }

        let modified = false;
        for (const user of users) {
            const conn = cache.connections[user.toLowerCase()];
            if (conn) {
                const helper = client.rest.oauth.getHelper(`Bearer ${conn.token}`);
                try {
                    await helper.updateRoleConnection(Config.client.id, {
                        metadata: {
                            commits: String(conn.commits + counts[user])
                        },
                        platformName:     "Github",
                        platformUsername: user
                    });
                    cache.connections[user.toLowerCase()].commits += counts[user];
                } catch {
                    delete cache.connections[user.toLowerCase()];
                }
                modified = true;
            }
        }

        if (modified) {
            await writeCache(cache);
        }
    }
});


const app = express()
    .use(morgan("dev"))
    .use(cookieParser(Config.cookieSecret))
    .get("/", async(req, res) => {
        const state = randomBytes(32).toString("hex");
        res.cookie("oceanic-satate", state, { maxAge: 1000 * 60 * 5, signed: true });
        return res.redirect(OAuthHelper.constructURL({
            clientID:    Config.client.id,
            scopes:      [OAuthScopes.IDENTIFY, "role_connections.write", OAuthScopes.CONNECTIONS],
            state,
            redirectURI: Config.client.redirectURI,
            prompt:      "none"
        }));
    })
    .get("/callback", async(req, res) => {
        if (!req.query.code) {
            return res.status(400).send("Invalid Code");
        }
        if ((req.signedCookies as Record<string, string>)["oceanic-satate"] !== req.query.state) {
            return res.status(400).send("Invalid state");
        }
        const token = await client.rest.oauth.exchangeCode({
            clientID:     Config.client.id,
            clientSecret: Config.client.secret,
            code:         String(req.query.code),
            redirectURI:  Config.client.redirectURI
        }).catch(() => null);
        if (token === null) {
            return res.status(400).send("Invalid Code");
        }
        const helper = client.rest.oauth.getHelper(`Bearer ${token.accessToken}`);
        const conn = await helper.getCurrentConnections();
        const gh = conn.filter(c => c.type === "github" && c.verified);
        let verified = false, name: string | undefined, commitCount = 0;
        for (const { name: gitName } of gh) {
            commitCount = await getCommitCount(gitName);
            if (commitCount !== 0) {
                verified = true;
                name = gitName;
                break;
            }
        }

        if (name && verified) {
            await helper.updateRoleConnection(Config.client.id, {
                metadata: {
                    commits: String(commitCount)
                },
                platformName:     "Github",
                platformUsername: name
            });
            const cache = await readCache();
            cache.connections[name.toLowerCase()] = {
                token:   token.accessToken,
                commits: commitCount
            };
            await writeCache(cache);
            return res.status(200).end(`Successfully linked via @${name}`);
        } else {
            return res.status(400).end("You have not contributed. Please make sure your github account is linked to your Discord account before attempting this.");
        }
    })
    .use("/github", createNodeMiddleware(hook, { path: "/" }));

app.listen(8080, "0.0.0.0");

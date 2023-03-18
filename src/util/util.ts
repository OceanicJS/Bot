import run from "../docs/run.js";
import type { Root } from "../docs/types.js";
import type { AutocompleteChoice, CreateGuildApplicationCommandOptions, User } from "oceanic.js";
import { fetch } from "undici";
import type { JSONOutput } from "typedoc";
import { gte } from "semver";
import { parse } from "jsonc-parser";
import { Octokit } from "@octokit/rest";
import type { PathLike } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

export interface IConfig {
    client: {
        id: string;
        redirectURI: string;
        secret: string;
        token: string;
    };
    cookieSecret: string;
    dataDir: string;
    docsWebhook: {
        id: string;
        token: string;
    };
    encryptionKey: string;
    encryptionSalt: string;
    git: string;
    gitSecret: string;
    guild: string;
    skipGit: boolean;
}

export interface Cache {
    commandIDs: Record<string, string>;
    commands: Array<CreateGuildApplicationCommandOptions>;
    commit: string | null;
    connections: Record<string, { accessToken: string; commits: number; }>;
    pulls: Array<[id: number, state: string]>;
    snipes: Array<Snipe>;
}

interface Snipe {
    author: Record<"id" | "tag" | "avatarURL", string>;
    channel: string;
    content: string;
    oldContent: string | null;
    timestamp: number;
    type: "delete" | "edit";
}

export const isDocker = await access("/.dockerenv").then(() => true, () => false) || await readFile("/proc/1/cgroup", "utf8").then(contents => contents.includes("docker"));
export const Config = parse(await readFile(new URL("../../config.jsonc", import.meta.url), "utf8")) as IConfig;

export const filter = (str: string) => str.replace(/\[/g, "\\[").replace(/]/g, "\\]");
export const exists = (path: PathLike) => access(path).then(() => true, () => false);
export const truncateWords = (str: string, maxLen: number) => {
    if (str.length <= maxLen) {
        return str;
    }
    let result = "";
    for (const part of str.split(" ")) {
        if (result.length + part.length + 3 > maxLen) {
            break;
        }
        result += `${part} `;
    }
    return `${result}...`;
};
export const truncate = (str: string, maxLen: number) => {
    if (str.length <= maxLen) {
        return str;
    }
    return `${str.slice(0, maxLen - 3)}...`;
};
export async function readCache() {
    return (await exists(`${Config.dataDir}/cache.json`)) ? JSON.parse(await readFile(`${Config.dataDir}/cache.json`, "utf8")) as Cache : { commands: [], commandIDs: {}, commit: null, connections: {}, pulls: [], snipes: [] };
}
export async function writeCache(cache: Cache) {
    await writeFile(`${Config.dataDir}/cache.json`, JSON.stringify(cache, null, 2));
}


export let defaultVersion: string;
export let versions: Array<string>;
const minSupport = "1.0.0";
export function refreshVersions() {
    defaultVersion = execSync("npm show oceanic.js version").toString().slice(0, -1);
    versions = (JSON.parse(execSync("npm show oceanic.js versions --json").toString()) as Array<string>).filter(v => !v.includes("-") && gte(v, minSupport));

}
setInterval(refreshVersions.bind(null), 6e5);
refreshVersions();

export async function checkVersion(version: string): Promise<boolean> {
    if (await exists(`${Config.dataDir}/docs/${version}.json`)) {
        return true;
    } else {
        void getVersion(version);
        return false;
    }
}
export async function getVersion(version: string): Promise<Root | null> {
    if (!versions.includes(version)) {
        return null;
    }

    if (!await exists(`${Config.dataDir}/docs/${version}.json`)) {
        const data = await fetch(`https://docs.oceanic.ws/v${version}/docs.json`).then(res => res.json() as Promise<JSONOutput.ProjectReflection>);
        await run(data, version);
        return getVersion(version);
    }

    return JSON.parse(await readFile(`${Config.dataDir}/docs/${version}.json`, "utf8")) as Root;
}

export function docsURL(version: string, type: "class" | "interface" | "enum" | "typeAlias", module: string, name: string, otherName?: string) {
    let typeName: string;
    switch (type) {
        case "class": {
            typeName = "classes";
            break;
        }

        case "interface": {
            typeName = "interfaces";
            break;
        }

        case "enum": {
            typeName = "enums";
            break;
        }

        case "typeAlias": {
            typeName = "types";
            break;
        }

        default: {
            return `https://docs.oceanic.ws/v${version}#type=${type as string}&module=${module}&name=${name}&otherName=${otherName || "undefined"}`;
        }
    }
    return `https://docs.oceanic.ws/v${version}/${typeName}/${module.replace(/\//g, "_")}.${name}.html${otherName ? `#${otherName}` : ""}`;
}

export async function find(version: string, name: string) {
    const root = await getVersion(version);
    const clazz = root?.classes.find(c => c.name === name);
    const enm = root?.enums.find(c => c.name === name);
    const iface = root?.interfaces.find(c => c.name === name);
    const typeAlias = root?.typeAliases.find(c => c.name === name);

    if (clazz) {
        return {
            type:  "class" as const,
            value: clazz
        };
    }

    if (enm) {
        return {
            type:  "enum" as const,
            value: enm
        };
    }

    if (iface) {
        return {
            type:  "interface" as const,
            value: iface
        };
    }

    if (typeAlias) {
        return {
            type:  "typeAlias" as const,
            value: typeAlias
        };
    }

    return null;
}

const intrinsic = {
    string:    "[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)",
    number:    "[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)",
    boolean:   "[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)",
    any:       "[any](https://www.typescriptlang.org/docs/handbook/2/functions.html#any)",
    void:      "[void](https://www.typescriptlang.org/docs/handbook/2/functions.html#void)",
    undefined: "[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)",
    null:      "[null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null)",
    never:     "[never](https://www.typescriptlang.org/docs/handbook/2/functions.html#never)",
    unknown:   "[unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)",
    object:    "[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)",
    symbol:    "[Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)",
    Buffer:    "[Buffer](https://nodejs.org/api/buffer.html)",
    BigInt:    "[BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)",
    Date:      "[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)",
    Promise:   "[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)",
    Error:     "[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)",
    Array:     "[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)",
    Map:       "[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)",
    Set:       "[Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)",
    Function:  "[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)"

};
export async function linkType(version: string, text: string) {
    const root = await getVersion(version);
    if (root === null) {
        return text;
    }
    const classNames = root.classes.map(c => c.name);
    const enumNames = root.enums.map(c => c.name);
    const interfaceNames = root.interfaces.map(c => c.name);
    const typeAliasNames = root.typeAliases.map(c => c.name);

    const classMatches = text.match(new RegExp(`\\b(${classNames.join("|")})\\b`, "g")) ?? [];
    const enumMatches = text.match(new RegExp(`\\b(${enumNames.join("|")})\\b`, "g")) ?? [];
    const interfaceMatches = text.match(new RegExp(`\\b(${interfaceNames.join("|")})\\b`, "g")) ?? [];
    const typeAliasMatches = text.match(new RegExp(`\\b(${typeAliasNames.join("|")})\\b`, "g")) ?? [];
    const intrinsicMatches = text.match(/\b(string|number|boolean|any|void|undefined|null|never|unknown|object|symbol|buffer)\b/gi) ?? [];

    for (const match of classMatches) {
        const clazz = root.classes.find(c => c.name === match);
        if (clazz) {
            text = text.replace(new RegExp(`\\b(${match})\\b`, "g"), `[${match}](${docsURL(version, "class", clazz.module, clazz.name)})`);
        }
    }
    for (const match of enumMatches) {
        const enm = root.enums.find(c => c.name === match);
        if (enm) {
            text = text.replace(new RegExp(`\\b(${match})\\b`, "g"), `[${match}](${docsURL(version, "enum", enm.module, enm.name)})`);
        }
    }
    for (const match of interfaceMatches) {
        const iface = root.interfaces.find(c => c.name === match);
        if (iface) {
            text = text.replace(new RegExp(`\\b(${match})\\b`, "g"), `[${match}](${docsURL(version, "interface", iface.module, iface.name)})`);
        }
    }
    for (const match of typeAliasMatches) {
        const typeAlias = root.typeAliases.find(c => c.name === match);
        if (typeAlias) {
            text = text.replace(new RegExp(`\\b(${match})\\b`, "g"), `[${match}](${docsURL(version, "typeAlias", typeAlias.module, typeAlias.name)})`);
        }
    }
    for (const match of intrinsicMatches) {
        text = text.replace(new RegExp(`\\b(${match})\\b`, "g"), intrinsic[match as keyof typeof intrinsic]);
    }

    return text.replace(/(<|>)/g, "\\$1");
}


export function truncateChoices(values: Array<AutocompleteChoice>) {
    return values.length < 25 ? values : [
        ...values.slice(0, 25 - 1),
        {
            name:  `(And ${values.length - 24} More)`,
            value: "more_count"
        }
    ];
}


export async function getSnipe(channel: string, type: "delete" | "edit") {
    const cache = await readCache();
    const snipe = cache.snipes.sort((a,b) => b.timestamp - a.timestamp).find(sn => sn.channel === channel && sn.type === type);
    if (!snipe) {
        return null;
    }
    cache.snipes.splice(cache.snipes.indexOf(snipe), 1);
    await writeCache(cache);
    return snipe;
}

export async function saveSnipe(author: User, channel: string, content: string, oldContent: string | null, type: "delete" | "edit") {
    const cache = await readCache();
    cache.snipes = cache.snipes.slice(0, 10);
    const index = cache.snipes.unshift({ author: { id: author.id, tag: author.tag, avatarURL: author.avatarURL() }, channel, content, oldContent, timestamp: Date.now(), type });
    await writeCache(cache);
    return cache.snipes[index];
}

export const octo = new Octokit({
    auth: Config.git
});

export async function getCommitCount(author: string, page = 1): Promise<number> {
    const { data } = await octo.repos.listCommits({
        owner:    "OceanicJS",
        repo:     "Oceanic",
        author,
        per_page: 100,
        page
    });

    return data.length === 100 ? 100 + await getCommitCount(author, page + 1) : data.length;
}

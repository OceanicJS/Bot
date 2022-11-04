import type { Class } from "./types.js";
import FuzzySearch from "fuzzy-search";
import { readFile } from "node:fs/promises";
const data = JSON.parse(await readFile(new URL("classes.json", import.meta.url), "utf8")) as Array<Class>;
const search = new FuzzySearch(data, ["name", "properties.name", "accessors.name", "methods.name"]);
const s = search.search("Guild");

for (const d of s) {
    const search2 = new FuzzySearch([...d.properties, ...d.accessors, ...d.methods], ["name"]).search("Guild");
    console.log(search2);
}

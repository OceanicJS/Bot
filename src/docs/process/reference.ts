import { getName } from "../idToName.js";
import type { Reference } from "../types.js";
import type { JSONOutput } from "typedoc";

export default function processReference(data: JSONOutput.ReferenceReflection) {
    const ref: Reference = {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:    data.name,
        text:    getName(data.target)
    };
    return ref;
}

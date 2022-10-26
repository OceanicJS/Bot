import { getName } from "../idToName";
import type { Reference } from "../types";
import type { JSONOutput } from "typedoc";

export default function processReference(data: JSONOutput.ReferenceReflection) {
    const ref: Reference = {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:    data.name,
        text:    getName(data.target)
    };
    return ref;
}

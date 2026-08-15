import { type JSONOutput, ReflectionKind } from "typedoc";

import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";

import type { Enum } from "../types.js";

export default function processEnum(data: JSONOutput.DeclarationReflection, module: string): Enum {
    const p: Enum = {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name: data.name,
        module,
        members: [],
    };
    if (data.children) {
        for (const child of data.children) {
            if (child.kind !== ReflectionKind.EnumMember) {
                GenerationLogs.addCurrent(`Unexpected reflection kind ${formatReflection(child)} when processing ${formatReflection(data)}, exected ${formatReflection(ReflectionKind.EnumMember)}`);
                continue;
            }
            p.members.push({
                comment: child.comment?.summary.reduce((a, b) => a + b.text, ""),
                name: child.name,
                text: convertType(child.type as JSONOutput.LiteralType),
            });
        }
    }
    return p;
}

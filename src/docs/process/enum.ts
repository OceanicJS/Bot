import type { Enum } from "../types.js";
import convertType from "../convertType.js";
import { JSONOutput, ReflectionKind } from "typedoc";

export default function processEnum(data: JSONOutput.DeclarationReflection, module: string) {
    const p: Enum = {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:    data.name,
        module,
        members: []
    };
    if (data.children) {
        for (const child of data.children) {
            if (child.kind !== ReflectionKind.EnumMember) {
                continue;
            }
            p.members.push({
                comment: child.comment?.summary.reduce((a, b) => a + b.text, ""),
                name:    child.name,
                text:    convertType(child.type as JSONOutput.LiteralType)
            });
        }
    }
    return p;
}

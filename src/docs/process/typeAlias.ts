import convertType from "../convertType.js";
import type { TypeAlias } from "../types.js";
import type { JSONOutput } from "typedoc";

export default function processTypeAlias(data: JSONOutput.DeclarationReflection, module: string) {
    if (!data.type) {
        return;
    }
    const typeAlias: TypeAlias = {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:    data.name,
        module,
        text:    convertType(data.type)
    };
    return typeAlias;
}

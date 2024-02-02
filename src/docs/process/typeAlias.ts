import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";
import type { TypeAlias } from "../types.js";
import type { JSONOutput } from "typedoc";

export default function processTypeAlias(data: JSONOutput.DeclarationReflection, module: string) {
    if (!data.type) {
        GenerationLogs.addCurrent(`Attempted to parse reflection ${formatReflection(data)} with no type: ${JSON.stringify(data)}`);
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

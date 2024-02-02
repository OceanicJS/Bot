import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";
import { getName } from "../idToName.js";
import type { JSONOutput } from "typedoc";

export default function processAccessor(data: JSONOutput.DeclarationReflection) {
    if (!data.getSignature?.type) {
        GenerationLogs.addCurrent(`Attempted to parse reflection ${formatReflection(data)} with no signature type: ${JSON.stringify(data)}`);
        return;
    }
    if (data.getSignature.type && "name" in data.getSignature.type && data.getSignature.type.name === "default" && "id" in data.getSignature.type && data.getSignature.type.id !== undefined) {
        data.getSignature.type.name = getName((data.getSignature.type as { id: number; }).id);
    }
    return {
        comment: data.getSignature.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:    data.name,
        static:  data.flags.isStatic ?? false,
        text:    convertType(data.getSignature.type)
    };
}

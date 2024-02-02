import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";
import { getName } from "../idToName.js";
import type { Property } from "../types.js";
import type { JSONOutput } from "typedoc";

export default function processProperty(data: JSONOutput.DeclarationReflection) {
    if (!data.type) {
        GenerationLogs.addCurrent(`Attempted to parse reflection ${formatReflection(data)} with no type: ${JSON.stringify(data)}`);
        return;
    }
    if (data.type && "name" in data.type && data.type.name === "default" && "id" in data.type && data.type.id !== undefined) {
        data.type.name = getName((data.type as { id: number; }).id);
    }
    const prop: Property = {
        comment:  data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:     data.name,
        optional: data.flags.isOptional ?? false,
        readonly: data.flags.isReadonly ?? false,
        static:   data.flags.isStatic ?? false,
        text:     convertType(data.type)
    };
    return prop;
}

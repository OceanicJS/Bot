import convertType from "../convertType";
import { getName } from "../idToName";
import type { Property } from "../types";
import type { JSONOutput } from "typedoc";

export default function processProperty(data: JSONOutput.DeclarationReflection) {
    if (!data.type) {
        return;
    }
    if (data.type && "name" in data.type && data.type.name === "default" && "id" in data.type && data.type.id !== undefined) {
        data.type.name = getName(data.type.id);
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

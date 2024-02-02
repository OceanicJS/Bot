import processProperty from "./property.js";
import type { Interface } from "../types.js";
import convertType from "../convertType.js";
import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import { type JSONOutput, ReflectionKind } from "typedoc";

export default function processInterface(data: JSONOutput.DeclarationReflection, module: string) {
    const iface: Interface = {
        name:       data.name,
        comment:    data.comment?.summary.reduce((a, b) => a + b.text, ""),
        extends:    data.extendedTypes ? convertType(data.extendedTypes[0]) : undefined,
        module,
        properties: []
    };

    if (data.children) {
        for (const child of data.children) {
            switch (child.kind) {
                case ReflectionKind.Property: {
                    const prop = processProperty(child);
                    if (prop) {
                        iface.properties.push(prop);
                    }
                    break;
                }

                case ReflectionKind.Method: break; // ignore

                default: {
                    GenerationLogs.addCurrent(`Unhandled reflection kind ${formatReflection(child)} when processing ${formatReflection(data)}`);
                }
            }
        }
    }

    return iface;
}

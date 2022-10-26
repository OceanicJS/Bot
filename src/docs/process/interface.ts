import processProperty from "./property";
import type { Interface } from "../types";
import convertType from "../convertType";
import { JSONOutput, ReflectionKind } from "typedoc";

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
            }
        }
    }

    return iface;
}

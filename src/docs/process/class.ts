import { type JSONOutput, ReflectionKind } from "typedoc";

import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";

import processAccessor from "./accessor.js";
import processConstructor from "./constructor.js";
import processMethod from "./method.js";
import processProperty from "./property.js";

import type { Class } from "../types.js";

export default function processClass(data: JSONOutput.DeclarationReflection, module: string): Class {
    const clazz: Class = {
        abstract: data.flags.isAbstract ?? false,
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name: data.name,
        module,
        constructor: {
            parameters: [],
        },
        extends: data.extendedTypes ? convertType(data.extendedTypes[0]) : undefined,
        properties: [],
        accessors: [],
        methods: [],
        typeParameters: [],
        // these are done later
        events: [],
    };

    if (data.typeParameters) {
        for (const type of data.typeParameters) {
            clazz.typeParameters.push({
                name: type.name,
                default: type.default ? convertType(type.default) : undefined,
                extends: type.type ? convertType(type.type) : undefined,
            });
        }
    }

    if (data.children) {
        for (const child of data.children) {
            switch (child.kind) {
                case ReflectionKind.Constructor: {
                    clazz.constructor = processConstructor(child);
                    break;
                }

                case ReflectionKind.Property: {
                    const prop = processProperty(child);
                    if (prop) {
                        clazz.properties.push(prop);
                    }
                    break;
                }

                case ReflectionKind.Accessor: {
                    const accessor = processAccessor(child);
                    if (accessor) {
                        clazz.accessors.push(accessor);
                    }
                    break;
                }

                case ReflectionKind.Method: {
                    const method = processMethod(child);
                    clazz.methods.push(method);
                    break;
                }

                default: {
                    GenerationLogs.addCurrent(`Unexpected reflection kind ${formatReflection(child)} when processing ${formatReflection(data)}`);
                }
            }
        }
    }

    return clazz;
}

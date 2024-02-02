import saveNames from "./saveNames.js";
import processClass from "./process/class.js";
import type { Overload, Parameter, Root } from "./types.js";
import { resetNames } from "./idToName.js";
import processInterface from "./process/interface.js";
import processEnum from "./process/enum.js";
import processTypeAlias from "./process/typeAlias.js";
import processVariable from "./process/variable.js";
import processFunction from "./process/function.js";
import processReference from "./process/reference.js";
import { Config, formatReflection } from "../util/util.js";
import GenerationLogs from "../util/GenerationLogs.js";
import { type JSONOutput, ReflectionKind } from "typedoc";
import { writeFile } from "node:fs/promises";

export default async function run(data: JSONOutput.ProjectReflection, version: string) {
    resetNames();
    saveNames(data);

    const root: Root = {
        classes:     [],
        enums:       [],
        interfaces:  [],
        typeAliases: [],
        variables:   [],
        functions:   [],
        references:  []
    };
    if (data.children) {
        for (const child of data.children) {
            if (child.kind !== ReflectionKind.Module) {
                switch (child.kind) {
                    case ReflectionKind.Class: {
                        const clazz = processClass(child, child.name);
                        root.classes.push(clazz);
                        break;
                    }

                    case ReflectionKind.Interface: {
                        const iface = processInterface(child, child.name);
                        root.interfaces.push(iface);
                        break;
                    }

                    case ReflectionKind.TypeAlias: {
                        const typeAlias = processTypeAlias(child, child.name);
                        if (typeAlias) {
                            root.typeAliases.push(typeAlias);
                        }
                        break;
                    }

                    default: {
                        GenerationLogs.addCurrent(`Unexpected reflection kind ${formatReflection(child)}`, true);
                    }
                }
                continue;
            }

            if (!child.children) {
                continue;
            }

            for (const child2 of child.children) {
                switch (child2.kind) {
                    case ReflectionKind.Class: {
                        const clazz = processClass(child2, child.name);
                        root.classes.push(clazz);
                        break;
                    }

                    case ReflectionKind.Interface: {
                        const iface = processInterface(child2, child.name);
                        root.interfaces.push(iface);
                        break;
                    }

                    case ReflectionKind.Enum: {
                        const en = processEnum(child2, child.name);
                        root.enums.push(en);
                        break;
                    }

                    case ReflectionKind.TypeAlias: {
                        const typeAlias = processTypeAlias(child2, child.name);
                        if (typeAlias) {
                            root.typeAliases.push(typeAlias);
                        }
                        break;
                    }

                    case ReflectionKind.Variable: {
                        const variable = processVariable(child2, child.name);
                        if (variable) {
                            root.variables.push(variable);
                        }
                        break;
                    }

                    case ReflectionKind.Function: {
                        const func = processFunction(child2, child.name);
                        if (func) {
                            root.functions.push(func);
                        }
                        break;
                    }

                    case ReflectionKind.Reference: {
                        if (child2.variant !== "reference") {
                            GenerationLogs.addCurrent(`Skipping non-reference (${child.variant}) reflection ${formatReflection(child2)}`);
                            continue;
                        }
                        const ref = processReference(child2 as JSONOutput.ReferenceReflection);
                        root.references.push(ref);
                        break;
                    }


                    // I can't be bothered to handle this right now
                    case ReflectionKind.Namespace: {
                        GenerationLogs.addCurrent(`Skipping ${formatReflection(child2)}`);
                        break;
                    }

                    default: {
                        GenerationLogs.addCurrent(`Unexpected reflection kind ${formatReflection(child2)}`, true);
                    }
                }
            }
        }
    }

    for (const iface of root.interfaces) {
        if (!/(?:[A-Z][a-z]*)+Events/.test(iface.name)) {
            continue;
        }

        const clazz = root.classes.find(claz => claz.name === iface.name.slice(0, -6));
        if (!clazz) {
            GenerationLogs.addCurrent(`No class found for assumed events interface ${iface.name}`);
            continue;
        }

        console.log(`Processing events interface ${iface.name} for class ${clazz.name}`);
        for (const property of iface.properties) {
            const overloads: Array<Overload> = [];
            if (property.text === "[]") {
                overloads.push({
                    parameters:     [],
                    typeParameters: []
                });
            } else {
                const p = (property.text.replaceAll(/\s/g, "").replaceAll("[]", "%ARRAY%").match(/\[.*?]/g) ?? []).map(m => m.replaceAll("%ARRAY%", "[]"));
                for (const sig of p) {
                    const parameters: Array<Parameter> = [];
                    const pr = sig.slice(1, -1).replaceAll(/(<.*?(?:,.*?)+>)/g, (_m, p1: string) => p1.replaceAll(",", "%COMMA%")).replaceAll(/(<.*?(?:\|.*?)+>)/g, (_m, p1: string) => p1.replaceAll("|", "%PIPE%")).split(",");
                    for (const param of pr) {
                        const [name, type] = param.split(":");
                        parameters.push({
                            name:     name.endsWith("?") ? name.slice(0, -1) : name,
                            optional: name.endsWith("?"),
                            text:     type.split("|").join(" | ").replaceAll("%COMMA%", ", ").replaceAll("%PIPE%", " | ")
                        });
                    }

                    overloads.push({
                        parameters,
                        typeParameters: []
                    });
                }
            }
            root.classes[root.classes.indexOf(clazz)].events.push({
                comment:   property.comment,
                interface: iface.name,
                name:      property.name,
                module:    iface.module,
                overloads
            });
        }
    }

    await writeFile(`${Config.dataDir}/docs/${version}.json`, JSON.stringify(root));
}

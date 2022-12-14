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
import config from "../../config.json" assert { type: "json" };
import { JSONOutput, ReflectionKind } from "typedoc";
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
                throw new Error(`Expected ${ReflectionKind[ReflectionKind.Module]} (${ReflectionKind.Module}), got ${ReflectionKind[child.kind]} (${child.kind}) for ${child.name} (${child.id})`);
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
                        const ref = processReference(child2 as JSONOutput.ReferenceReflection);
                        root.references.push(ref);
                        break;
                    }

                    default: {
                        throw new Error(`Unexpected kind ${ReflectionKind[child2.kind]} (${child2.kind}) for ${child2.name} (${child2.id})`);
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
            console.debug(`No class found for assumed events interface ${iface.name}`);
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
                const p = (property.text.replace(/\s/g, "").replace(/\[]/g, "%ARRAY%").match(/\[.*?]/g) ?? []).map(m => m.replace(/%ARRAY%/g, "[]"));
                for (const sig of p) {
                    const parameters: Array<Parameter> = [];
                    const pr = sig.slice(1, -1).replace(/(<.*?(?:,.*?)+>)/g, (m, p1: string) => p1.replace(/,/g, "%COMMA%")).replace(/(<.*?(?:\|.*?)+>)/g, (m, p1: string) => p1.replace(/\|/g, "%PIPE%")).split(",");
                    for (const param of pr) {
                        const [name, type] = param.split(":");
                        parameters.push({
                            name:     name.endsWith("?") ? name.slice(0, -1) : name,
                            optional: name.endsWith("?"),
                            text:     type.split("|").join(" | ").replace(/%COMMA%/g, ", ").replace(/%PIPE%/g, " | ")
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

    await writeFile(`${config.dataDir}/docs/${version}.json`, JSON.stringify(root));
}

// await run(JSON.parse(await readFile("/home/donovan/Downloads/v1.3.0.json", "utf8")) as JSONOutput.ProjectReflection, "1.2.1");

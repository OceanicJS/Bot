import { writeFile } from "node:fs/promises";

import { type JSONOutput, ReflectionKind } from "typedoc";

import GenerationLogs from "../util/GenerationLogs.js";
import { Config, formatReflection } from "../util/util.js";

import convertType from "./convertType.js";
import { resetNames } from "./idToName.js";
import processClass from "./process/class.js";
import processEnum from "./process/enum.js";
import processFunction from "./process/function.js";
import processInterface from "./process/interface.js";
import processReference from "./process/reference.js";
import processTypeAlias from "./process/typeAlias.js";
import processVariable from "./process/variable.js";
import saveNames from "./saveNames.js";

import type { Overload, Parameter, Root } from "./types.js";

// event properties are typed as a tuple of their parameters (one overload) or a union of
// such tuples (multiple overloads), e.g. `[user: User]` or `[user: User] | [user: Uncached]`
function eventOverloadsFromType(label: string, type: JSONOutput.SomeType | undefined): Array<Overload> {
    if (!type) {
        GenerationLogs.addCurrent(`Event "${label}" has no type`);
        return [];
    }

    const tupleTypes = type.type === "union" ? type.types : [type];
    return tupleTypes.map((tupleType) => {
        if (tupleType.type !== "tuple") {
            GenerationLogs.addCurrent(`Unexpected non-tuple overload type "${tupleType.type}" for event "${label}"`);
            return { parameters: [], typeParameters: [] };
        }

        const parameters: Array<Parameter> = (tupleType.elements ?? []).map((element) => {
            if (element.type !== "namedTupleMember") {
                GenerationLogs.addCurrent(`Unexpected non-named tuple element "${element.type}" for event "${label}"`);
                return { name: "", optional: false, text: convertType(element) };
            }

            return {
                name: element.name,
                optional: element.isOptional,
                text: convertType(element.element),
            };
        });

        return { parameters, typeParameters: [] };
    });
}

// handles a single reflection, attributing it to the given module name; namespaces recurse
// into their own children (attributed to the same module) rather than being processed themselves
function processReflectionChild(child: JSONOutput.DeclarationReflection, module: string, root: Root, rawInterfaces: Map<string, JSONOutput.DeclarationReflection>): void {
    switch (child.kind) {
        case ReflectionKind.Class: {
            const clazz = processClass(child, module);
            root.classes.push(clazz);
            break;
        }

        case ReflectionKind.Interface: {
            const iface = processInterface(child, module);
            root.interfaces.push(iface);
            rawInterfaces.set(iface.name, child);
            break;
        }

        case ReflectionKind.TypeAlias: {
            const typeAlias = processTypeAlias(child, module);
            if (typeAlias) {
                root.typeAliases.push(typeAlias);
            }
            break;
        }

        case ReflectionKind.Enum: {
            const en = processEnum(child, module);
            root.enums.push(en);
            break;
        }

        case ReflectionKind.Variable: {
            const variable = processVariable(child, module);
            if (variable) {
                root.variables.push(variable);
            }
            break;
        }

        case ReflectionKind.Function: {
            const func = processFunction(child, module);
            root.functions.push(func);
            break;
        }

        case ReflectionKind.Reference: {
            if (child.variant !== "reference") {
                GenerationLogs.addCurrent(`Skipping non-reference (${child.variant}) reflection ${formatReflection(child)}`);
                return;
            }
            const ref = processReference(child as JSONOutput.ReferenceReflection);
            root.references.push(ref);
            break;
        }

        case ReflectionKind.Namespace: {
            for (const nested of child.children ?? []) {
                processReflectionChild(nested, module, root, rawInterfaces);
            }
            break;
        }

        default: {
            GenerationLogs.addCurrent(`Unexpected reflection kind ${formatReflection(child)}`, true);
        }
    }
}

export default async function run(data: JSONOutput.ProjectReflection, version: string): Promise<void> {
    resetNames();
    saveNames(data);

    const root: Root = {
        classes: [],
        enums: [],
        interfaces: [],
        typeAliases: [],
        variables: [],
        functions: [],
        references: [],
    };
    // keeps the raw (structured) reflections for interfaces around so events can be derived
    // from their actual signature types instead of re-parsing the stringified property text
    const rawInterfaces = new Map<string, JSONOutput.DeclarationReflection>();
    if (data.children) {
        for (const child of data.children) {
            if (child.kind !== ReflectionKind.Module) {
                processReflectionChild(child, child.name, root, rawInterfaces);
                continue;
            }

            for (const child2 of child.children ?? []) {
                processReflectionChild(child2, child.name, root, rawInterfaces);
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

        const rawIface = rawInterfaces.get(iface.name);

        console.log(`Processing events interface ${iface.name} for class ${clazz.name}`);
        for (const property of iface.properties) {
            const rawProperty = rawIface?.children?.find(c => c.name === property.name);
            const overloads = eventOverloadsFromType(`${iface.name}#${property.name}`, rawProperty?.type);
            root.classes[root.classes.indexOf(clazz)].events.push({
                comment: property.comment,
                interface: iface.name,
                name: property.name,
                module: iface.module,
                overloads,
            });
        }
    }

    await writeFile(`${Config.dataDir}/docs/${version}.json`, JSON.stringify(root));
}

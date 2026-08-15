import { type JSONOutput, ReflectionKind } from "typedoc";

import GenerationLogs from "../util/GenerationLogs.js";
import { formatReflection } from "../util/util.js";

import { getMap, setName } from "./idToName.js";

export default function saveNames(project: JSONOutput.ProjectReflection): void {
    if (project.children) {
        for (const child of project.children) {
            if (![ReflectionKind.Module, ReflectionKind.Class, ReflectionKind.Interface].includes(child.kind)) {
                GenerationLogs.addCurrent(`Unexpected reflection type at root: ${formatReflection(child)}`, true);
                continue;
            }

            setName(child.id, child.name);
            if (!child.children) {
                continue;
            }

            for (const child2 of child.children) {
                switch (child2.kind) {
                    case ReflectionKind.Class:
                    case ReflectionKind.Interface:
                    case ReflectionKind.Enum:
                    case ReflectionKind.TypeAlias:
                    case ReflectionKind.Variable:
                    case ReflectionKind.Reference: {
                        setName(child2.id, child2.name);
                        break;
                    }

                    default: {
                        // GenerationLogs.addCurrent(`Unexpected reflection ${formatReflection(child2)} on ${formatReflection(child)}`, true);
                    }
                }
            }
        }
    }

    console.log(`Saved ${getMap().size} names`);
}

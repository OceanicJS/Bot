import { getMap, setName } from "./idToName.js";
import { type JSONOutput, ReflectionKind } from "typedoc";

export default function saveNames(project: JSONOutput.ProjectReflection) {
    if (project.children) {
        for (const child of project.children) {
            if (![ReflectionKind.Module, ReflectionKind.Class, ReflectionKind.Interface].includes(child.kind)) {
                console.error(`Unexpected reflection type at root: ${ReflectionKind[child.kind]} (${child.kind}) for ${child.name} (${child.id})`);
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
                        console.warn(`Unexpected child type ${ReflectionKind[child2.kind]} (${child2.kind}) for ${child2.name} (${child2.id}) on root ${ReflectionKind[child.kind]} (${child.kind}) for ${child.name} (${child.id})`);
                    }
                }
            }
        }
    }

    console.log(`Saved ${getMap().size} names`);
}

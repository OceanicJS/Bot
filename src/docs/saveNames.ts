import { getMap, setName } from "./idToName.js";
import { JSONOutput, ReflectionKind } from "typedoc";

export default function saveNames(project: JSONOutput.ProjectReflection) {
    if (project.children) {
        for (const child of project.children) {
            if (child.kind !== ReflectionKind.Module) {
                throw new Error(`Expected ${ReflectionKind[ReflectionKind.Module]} (${ReflectionKind.Module}), got ${ReflectionKind[child.kind]} (${child.kind}) for ${child.name} (${child.id})`);
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
                    }
                }
            }
        }
    }

    console.log(`Saved ${getMap().size} names`);
}

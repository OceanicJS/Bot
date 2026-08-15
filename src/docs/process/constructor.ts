import { type JSONOutput, ReflectionKind } from "typedoc";

import GenerationLogs from "../../util/GenerationLogs.js";
import { formatReflection } from "../../util/util.js";
import convertType from "../convertType.js";
import { getName } from "../idToName.js";

import type { Constructor } from "../types.js";

export default function processConstructor(data: JSONOutput.DeclarationReflection): Constructor {
    const construct: Constructor = {
        parameters: [],
    };

    // use the last signature
    const signature = data.signatures?.filter(s => s.kind === ReflectionKind.ConstructorSignature).at(-1);
    if (signature === undefined) {
        GenerationLogs.addCurrent(`Unexpected zero signatures for reflection ${formatReflection(data)}`);
    } else {
        if (signature.parameters) {
            for (const param of signature.parameters) {
                if (!param.type) {
                    continue;
                }
                if ("name" in param.type && param.type.name === "default" && "id" in param.type && param.type.id !== undefined) {
                    param.type.name = getName((param.type as { id: number }).id);
                }
                construct.parameters.push({
                    name: param.name,
                    text: convertType(param.type),
                    optional: param.flags.isOptional ?? false,
                });
            }
        }
    }

    return construct;
}

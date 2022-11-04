import convertType from "../convertType.js";
import type { Constructor } from "../types.js";
import { getName } from "../idToName.js";
import { JSONOutput, ReflectionKind } from "typedoc";

export default function processConstructor(data: JSONOutput.DeclarationReflection) {
    const construct: Constructor = {
        parameters: []
    };

    // use the last signature
    const signature = data.signatures?.filter(s => s.kind === ReflectionKind.ConstructorSignature).at(-1);
    if (signature?.parameters) {
        for (const param of signature.parameters) {
            if (!param.type) {
                continue;
            }
            if (param.type && "name" in param.type && param.type.name === "default" && "id" in param.type && param.type.id !== undefined) {
                param.type.name = getName(param.type.id);
            }
            construct.parameters.push({
                name:     param.name,
                text:     convertType(param.type),
                optional: param.flags.isOptional ?? false
            });
        }
    }

    return construct;
}

import convertType from "../convertType.js";
import type { Function } from "../types.js";
import { getName } from "../idToName.js";
import { JSONOutput, ReflectionKind } from "typedoc";

export default function processFunction(data: JSONOutput.DeclarationReflection, module: string) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const func: Function = {
        comment:        data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:           data.name,
        module,
        parameters:     [],
        typeParameters: []
    };

    // use the last signature
    const signature = data.signatures?.filter(s => s.kind === ReflectionKind.CallSignature).at(-1);
    if (signature?.parameters) {
        for (const param of signature.parameters) {
            if (!param.type) {
                continue;
            }
            if (param.type && "name" in param.type && param.type.name === "default" && "id" in param.type && param.type.id !== undefined) {
                param.type.name = getName(param.type.id);
            }
            func.parameters.push({
                name:     param.name,
                text:     convertType(param.type),
                optional: param.flags.isOptional ?? false
            });
        }
    }

    if (signature?.typeParameter) {
        for (const type of signature.typeParameter) {
            func.typeParameters.push({
                name:    type.name,
                default: type.default ? convertType(type.default) : undefined,
                extends: type.type ? convertType(type.type) : undefined
            });
        }
    }

    return func;
}

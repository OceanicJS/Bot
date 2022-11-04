import convertType from "../convertType.js";
import type { Method, Overload } from "../types.js";
import { getName } from "../idToName.js";
import { JSONOutput, ReflectionKind } from "typedoc";

export default function processMethod(data: JSONOutput.DeclarationReflection) {
    const method: Method = {
        comment:   data.comment?.summary.reduce((a, b) => a + b.text, ""),
        name:      data.name,
        static:    data.flags.isStatic ?? false,
        overloads: []
    };

    if (data.signatures) {
        for (const signature of data.signatures.filter(s => s.kind === ReflectionKind.CallSignature)) {
            const overload: Overload = {
                parameters:     [],
                typeParameters: [],
                return:         signature.type ? convertType(signature.type) : undefined
            };
            if (signature.parameters) {
                for (const param of signature.parameters) {
                    if (!param.type) {
                        continue;
                    }
                    if (param.type && "name" in param.type && param.type.name === "default" && "id" in param.type && param.type.id !== undefined) {
                        param.type.name = getName(param.type.id);
                    }
                    overload.parameters.push({
                        name:     param.name,
                        text:     convertType(param.type),
                        optional: param.flags.isOptional ?? false
                    });
                }
            }

            if (signature.typeParameter) {
                for (const type of signature.typeParameter) {
                    overload.typeParameters.push({
                        name:    type.name,
                        default: type.default ? convertType(type.default) : undefined,
                        extends: type.type ? convertType(type.type) : undefined
                    });
                }
            }

            method.overloads.push(overload);
        }
    }

    return method;
}

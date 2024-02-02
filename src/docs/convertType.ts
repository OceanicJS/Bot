import { getName } from "./idToName.js";
import type { JSONOutput } from "typedoc";
function resolveArrayType(type: JSONOutput.ArrayType, level = 1): { level: number; type: string; } {
    return type.elementType.type === "array" ? resolveArrayType(type.elementType, level++) : { type: convertType(type.elementType), level };
}

export default function convertType(type: JSONOutput.SomeType): string {
    if ("name" in type && type.name === "default" && "id" in type && type.id !== undefined) {
        type.name = getName((type as {id: number; }).id);
    }
    switch (type.type) {
        case "array": {
            const { type: elementType, level } = resolveArrayType(type);
            return `${elementType}${"[]".repeat(level)}`;
        }

        case "conditional": {
            const { checkType, extendsType, trueType, falseType } = type;
            return `${convertType(checkType)} extends ${convertType(extendsType)} ? ${convertType(trueType)} : ${convertType(falseType)}`;
        }

        case "indexedAccess": {
            const { objectType, indexType } = type;
            return `${convertType(objectType)}[${convertType(indexType)}]`;
        }

        case "inferred": {
            return `infer ${type.name}`;
        }

        case "intersection": {
            return type.types.map(convertType).join(" & ");
        }

        case "intrinsic": {
            return type.name;
        }

        case "literal": {
            if (type.value === null) {
                return "null";
            }
            if (typeof type.value === "object") {
                return `${type.value.negative ? "-" : ""}${type.value.value}`;
            }
            return typeof type.value === "string" ? `"${type.value}"` : String(type.value);
        }

        case "mapped": {
            const { nameType, optionalModifier, parameter, parameterType, readonlyModifier, templateType } = type;
            return `{ [${readonlyModifier ? "readonly " : ""}${nameType ? `${convertType(nameType)} in ` : ""}${parameter}${optionalModifier ? "?" : ""}: ${convertType(parameterType)}]${templateType ? ` extends ${convertType(templateType)}` : ""} }`;
        }

        case "namedTupleMember": {
            const { name, isOptional, element } = type;
            return `${name}${isOptional ? "?" : ""}: ${convertType(element)}`;
        }

        case "optional": {
            return `${convertType(type.elementType)}?`;
        }

        case "predicate": {
            const { asserts, name, targetType } = type;
            if (asserts) {
                return `asserts ${name}`;
            } else if (targetType) {
                return `${name} is ${convertType(targetType)}`;
            } else {
                return name;
            }
        }

        case "query": {
            const { queryType } = type;
            return `typeof ${convertType(queryType)}`;
        }

        case "reference": {
            if ("name" in type && type.name === "default" && "target" in type && type.target !== undefined) {
                type.name = typeof type.target === "object" ? (type.target as { qualifiedName: string; }).qualifiedName : getName(type.target! as number);
            }
            const { name, typeArguments } = type;
            return `${name}${typeArguments ? `<${typeArguments.map(convertType).join(", ")}>` : ""}`;
        }

        case "reflection": {
            const { declaration } = type;
            /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
            const obj: Record<string, any> = {};
            function walk(ref: Record<string, any>, tree: JSONOutput.DeclarationReflection) {
                if (tree.children) {
                    ref[tree.name] = {};
                    for (const child of tree.children) {
                        walk(obj[tree.name], child);
                    }
                } else {
                    if (tree.type) {
                        ref[tree.name] = convertType(tree.type);
                    }
                }
            }
            /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
            if (declaration?.children) {
                for (const child of declaration.children) {
                    walk(obj, child);
                }
            }
            return `{ ${Object.entries(obj).map(([key, value]) => `${key}: ${value as string}; `).join("")}}`;
        }

        case "rest": {
            return `...${convertType(type.elementType)}`;
        }

        case "templateLiteral": {
            const { head, tail } = type;
            return `\`${head}${tail.map(([t, literal]) => `\${${convertType(t)}}${literal}`).join("")}\``;
        }

        case "tuple": {
            return `[${(type.elements ?? []).map(convertType).join(", ")}]`;
        }

        case "typeOperator": {
            const { operator, target } = type;
            return `${operator} ${convertType(target)}`;
        }

        case "union": {
            return type.types.map(convertType).join(" | ");
        }

        case "unknown": {
            return "unknown";
        }

        default: {
            console.log(`TODO Type: ${(type as { type: string; }).type}`);
            return `TODO: ${(type as { type: string; }).type}`;
        }
    }
}

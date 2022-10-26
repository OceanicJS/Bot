import convertType from "../convertType";
import type { Variable } from "../types";
import type { JSONOutput } from "typedoc";

export default function processVariable(data: JSONOutput.DeclarationReflection, module: string) {
    if (!data.type) {
        return;
    }
    const variable: Variable =  {
        comment: data.comment?.summary.reduce((a, b) => a + b.text, ""),
        const:   data.flags.isConst ?? false,
        name:    data.name,
        module,
        text:    convertType(data.type)
    };
    return variable;
}

import config from "@uwu-codes/eslint-config";
import { defineConfig } from "eslint/config";

export default defineConfig(config, {
    rules: {
        "unicorn/switch-case-braces": "off",
    },
});

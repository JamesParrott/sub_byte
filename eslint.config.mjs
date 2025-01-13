import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { languageOptions: { globals: globals.browser, ecmaVersion: "latest" } },
  pluginJs.configs.recommended,
  {
    rules: {
      camelcase: "error",
    },
  },
];

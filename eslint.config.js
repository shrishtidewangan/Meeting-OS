// export default [
//   {
//     ignores: ["node_modules/**", "dist/**", "coverage/**"]
//   }
// ];

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  { ignores: ["node_modules/**", "dist/**", "coverage/**", "**/.turbo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Relaxed from "error" since this codebase intentionally uses `any`
      // in several places (LangGraph node return types, model-client
      // results) where LangGraph's own types are hard to satisfy exactly.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["apps/web/**/*.tsx", "apps/web/**/*.ts"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
    },
  }
);
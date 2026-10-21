import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build/", "temp/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Resolver signatures use `{}` for "no args", which is the Apollo convention.
      "@typescript-eslint/no-empty-object-type": "off"
    }
  }
);

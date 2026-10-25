import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // React Three Fiber scenes animate by mutating three.js objects (camera, materials,
    // transforms) inside useFrame — imperative render-loop code that runs outside React
    // rendering. The React Compiler immutability rule does not model this, so it is
    // disabled for the 3D scene modules only.
    files: ["src/three/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
);

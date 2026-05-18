import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "bin/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        TextDecoder: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

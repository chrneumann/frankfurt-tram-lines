import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  reactRecommended,
];

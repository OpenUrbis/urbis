/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@open-urbis/eslint-config/index.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ]
  }
};

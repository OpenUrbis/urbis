/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@open-urbis/map-eslint-config/index.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
        "require-await": "off",
      },
    ],
  },
};

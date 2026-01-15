/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: false,
  extends: ["../../eslintrc.js", "@open-urbis/eslint-config/index.js"],
  plugins: [["module:@preact/signals-react-transform"]],
};

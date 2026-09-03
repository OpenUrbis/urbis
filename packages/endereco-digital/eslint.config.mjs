import { config as sharedConfig } from "@open-urbis/map-eslint-config";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...sharedConfig,
  {
    settings: {
      react: {
        version: "999.999.999",
      },
    },
  },
];

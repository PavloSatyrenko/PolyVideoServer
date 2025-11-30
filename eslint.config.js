const { config, configs: tsConfigs } = require("typescript-eslint");
const esLintConfigs = require("@eslint/js");

module.exports = config({
    files: ["src/**/*.ts"],
    extends: [esLintConfigs.configs.recommended, ...tsConfigs.recommended, ...tsConfigs.stylistic],
    rules: {
        "@typescript-eslint/consistent-type-definitions": "off",
        quotes: ["error", "double"],
    },
});

module.exports = {
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      experimentalObjectSpread: true,
    },
  },
  settings: {
    "import/resolver": {
      meteor: {
        extensions: [".js", ".ts", ".jsx", ".tsx"],
        moduleDirectory: ["node_modules", "imports"],
      },
    },
  },
  parser: "@typescript-eslint/parser",
  plugins: ["meteor"],
  extends: [ "plugin:meteor/recommended"],
  rules: {
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "internal",
          "external",
          "parent",
          "sibling",
          "index",
        ],
        pathGroups: [
          {
            pattern: "^meteor/**",
            group: "internal",
          },
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
};

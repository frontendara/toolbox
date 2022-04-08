module.exports = {
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      experimentalObjectSpread: true,
    },
  },
  ignorePatterns: ["bin/"],

  settings: {
    react: {
      version: "detect",
    },
  },
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "no-only-tests",
    "testing-library",
    "jsx-a11y",
  ],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:import/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "no-only-tests/no-only-tests": "error",
    "testing-library/no-debug": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "h" }],
    curly: ["error", "all"],
    "react/prop-types": "off",
    // TODO: rethink if we need to enable this
    "react/display-name": "off",
    // TODO: rethink if we need to enable this
    "react/react-in-jsx-scope": "off",
    "no-return-await": "error",
    "arrow-parens": ["error", "always"],
  },
};

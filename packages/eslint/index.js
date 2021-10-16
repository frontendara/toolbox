module.exports = {
  "parserOptions": {
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
      "experimentalObjectSpread": true
    }
  },
  "ignorePatterns": ["bin/"],

  "settings": {
    "import/resolver": {
      "meteor": {
        "extensions": [".js", ".ts", ".jsx", ".tsx"],
        "moduleDirectory": ["node_modules", "imports"]
      }
    }
  },
  "parser": "@typescript-eslint/parser",
  "plugins": ["meteor", "@typescript-eslint", "no-only-tests","testing-library",
  "jsx-a11y"],
  "extends": [
    "plugin:meteor/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:import/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "no-only-tests/no-only-tests": "error",
    "testing-library/no-debug": "error",
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "varsIgnorePattern": "h" }],
    "curly": ["error", "all"],
    "react/prop-types": "off",
    // TODO: rethink if we need to enable this
    "react/display-name": "off",
    // TODO: rethink if we need to enable this
    "react/react-in-jsx-scope": "off"
  }
}

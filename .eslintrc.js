module.exports = {
  parser: "babel-eslint",
  plugins: ["react", "prettier", "chai-friendly"],
  extends: [
    "standard",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
    "plugin:chai-friendly/recommended",
  ],
  rules: {
    "linebreak-style": ["error", "unix"],
    "react/jsx-filename-extension": [
      1,
      {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
      },
    ],
    // "class-methods-use-this": ["warn"],
    "standard/computed-property-even-spacing": ["off"],
    "react/prop-types": ["off"],
    "react/display-name": ["off"],
    "prettier/prettier": [
      "error",
      {
        trailingComma: "es5",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      extends: ["plugin:@typescript-eslint/recommended"],
      parserOptions: { loggerFn: false },
      rules: {
        "prefer-const": ["warn"],
        "@typescript-eslint/indent": ["off"],
        "@typescript-eslint/interface-name-prefix": ["error", "always"],
        "@typescript-eslint/no-unused-vars": ["warn"],
        "@typescript-eslint/prefer-interface": ["off"],
        "@typescript-eslint/explicit-member-accessibility": ["off"],
        "@typescript-eslint/no-explicit-any": ["off"],
        "no-unused-vars": ["off"],
        "promise/param-names": ["off"],
      },
    },
    {
      files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
      env: {
        mocha: true,
      },
    },
  ],
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: "module",
  },
  settings: {
    react: { version: "detect" },
  },
};

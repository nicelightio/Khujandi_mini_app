module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/backend", "<rootDir>/frontend/src/tests"],
  testMatch: [
    "<rootDir>/tests/slices/catalog/*.spec.ts",
    "<rootDir>/tests/slices/checkout-payment/*.spec.ts",
    "<rootDir>/tests/slices/delivery-assignment/*.spec.ts",
    "<rootDir>/tests/slices/delivery-tracking/*.spec.ts",
    "<rootDir>/frontend/src/tests/admin/*.spec.ts",
    "<rootDir>/frontend/src/tests/admin/*.spec.tsx",
    "<rootDir>/frontend/src/tests/slices/catalog/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/catalog/*.spec.tsx",
    "<rootDir>/frontend/src/tests/slices/checkout-payment/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/checkout-payment/*.spec.tsx",
    "<rootDir>/frontend/src/tests/slices/order-tracking/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/order-tracking/*.spec.tsx",
    "<rootDir>/frontend/src/tests/shared/**/*.spec.ts",
    "<rootDir>/frontend/src/tests/shared/**/*.spec.tsx",
    "<rootDir>/frontend/src/tests/app/*.spec.tsx"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
        diagnostics: false
      }
    ]
  }
};

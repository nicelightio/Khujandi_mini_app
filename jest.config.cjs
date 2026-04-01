module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/backend", "<rootDir>/frontend/src/tests"],
  testMatch: [
    "<rootDir>/tests/slices/catalog/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/catalog/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/catalog/*.spec.tsx"
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

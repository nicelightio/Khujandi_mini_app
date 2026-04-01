module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/backend", "<rootDir>/frontend/src/tests"],
  testMatch: [
    "<rootDir>/tests/slices/catalog/*.spec.ts",
    "<rootDir>/frontend/src/tests/slices/catalog/*.spec.ts"
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
        diagnostics: false
      }
    ]
  }
};

module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  moduleFileExtensions: ["js", "json"],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/sqlite3"]
};

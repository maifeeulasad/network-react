module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    testTimeout: 90000,
  };
  
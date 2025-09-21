module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^react-native$': 'react-native-web',
    '^expo-notifications$': '<rootDir>/tests/__mocks__/expo-notifications.js',
    '^expo-sqlite$': '<rootDir>/tests/__mocks__/expo-sqlite.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|react-native|@react-native|expo-notifications|expo-sqlite)/)'
  ],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
};
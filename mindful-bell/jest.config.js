module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^react-native$': 'react-native-web',
    '^expo-notifications$': '<rootDir>/tests/__mocks__/expo-notifications.js',
    '^expo-sqlite$': '<rootDir>/tests/__mocks__/expo-sqlite.js',
    '^expo-router$': '<rootDir>/tests/__mocks__/expo-router.js',
    '^@react-navigation/native$': '<rootDir>/tests/__mocks__/react-navigation.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|react-native|@react-native|expo-notifications|expo-sqlite|expo-router)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
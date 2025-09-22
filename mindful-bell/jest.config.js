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
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
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
    '^expo-task-manager$': '<rootDir>/tests/__mocks__/expo-task-manager.js',
    '^expo-background-fetch$': '<rootDir>/tests/__mocks__/expo-background-fetch.js',
    '^@react-navigation/native$': '<rootDir>/tests/__mocks__/react-navigation.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|react-native|@react-native|expo-notifications|expo-sqlite|expo-router|expo-task-manager|expo-background-fetch|expo-modules-core)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
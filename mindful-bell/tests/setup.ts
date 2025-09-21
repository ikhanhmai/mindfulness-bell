// Mock react-native modules
jest.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
  },
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: () => null,
}));

// Global test setup
global.console = {
  ...console,
  warn: jest.fn(),
};

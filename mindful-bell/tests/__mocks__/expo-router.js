module.exports = {
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  Stack: {
    Screen: jest.fn(),
  },
  Tabs: {
    Screen: jest.fn(),
  },
};

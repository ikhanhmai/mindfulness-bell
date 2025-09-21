module.exports = {
  DarkTheme: { colors: { background: '#000' } },
  DefaultTheme: { colors: { background: '#fff' } },
  ThemeProvider: ({ children }) => children,
  useFocusEffect: jest.fn(),
};

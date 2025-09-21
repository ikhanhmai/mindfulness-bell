# Contributing to Mindful Bell

Thank you for your interest in contributing to Mindful Bell! 🙏 This project aims to help people cultivate mindfulness through gentle, random reminders and reflective journaling. We welcome contributions from developers, designers, mindfulness practitioners, and anyone passionate about mental well-being.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
- Search existing issues before creating a new one
- Use the bug report template when available
- Include device/platform information (iOS/Android version)
- Provide steps to reproduce the issue
- Include screenshots or screen recordings when helpful

### 💡 Feature Requests
- Check if the feature aligns with our [lean canvas](mindful-bell/specs/001-lean-canvas/spec.md)
- Describe the problem the feature would solve
- Consider how it fits with our offline-first, privacy-focused approach
- Provide mockups or wireframes if you have them

### 🎨 Design Contributions
- UI/UX improvements for better user experience
- New bell sounds or notification tones
- Icon and visual design enhancements
- Accessibility improvements
- Dark mode refinements

### 💻 Code Contributions
- Bug fixes
- Performance improvements
- New features (please discuss in an issue first)
- Test coverage improvements
- Documentation updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/mindfulness-bell.git
   cd mindfulness-bell/mindful-bell
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   npm run ios     # For iOS
   npm run android # For Android
   ```

### Project Structure

```
mindful-bell/
├── app/                    # Expo Router screens
├── components/            # Reusable UI components
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── specs/                 # Feature specifications
└── templates/             # Documentation templates
```

## 📋 Development Process

### Before You Start
1. **Check existing issues** - someone might already be working on it
2. **Create an issue** for new features to discuss the approach
3. **Comment on the issue** to let others know you're working on it

### Code Standards
- **TypeScript**: Use TypeScript for all new code
- **Linting**: Run `npm run lint` before committing
- **Formatting**: Use Prettier for consistent code formatting
- **Testing**: Add tests for new functionality when applicable

### Commit Guidelines
We follow conventional commits for clear, readable commit history:

```
feat: add bell sound customization
fix: resolve notification scheduling on iOS
docs: update installation instructions
style: improve entry form accessibility
refactor: simplify database service layer
test: add unit tests for random bell algorithm
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run lint        # Check code style
   npm run lint:md     # Check markdown
   npm test           # Run tests (when available)
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes you made and why
   - Include screenshots for UI changes

### Pull Request Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated if needed
- [ ] No merge conflicts
- [ ] Tested on both iOS and Android (when applicable)

## 🎯 Development Guidelines

### Mindfulness & Privacy First
- **Offline-first**: All features should work without internet
- **Privacy-focused**: No user tracking or data collection
- **Non-judgmental**: Use supportive, non-judgmental language
- **Accessible**: Follow accessibility best practices

### Technical Guidelines
- **Performance**: Keep cold start times under 2 seconds
- **Battery**: Minimize background processing impact
- **Storage**: Use SQLite efficiently, avoid data bloat
- **Notifications**: Respect iOS limits and user preferences

### Feature Development
Before implementing new features, consider:
- Does it align with the core mindfulness purpose?
- Can it work completely offline?
- Does it maintain user privacy?
- Is the UX simple and non-intrusive?

## 🧪 Testing

### Manual Testing
- Test on both iOS and Android when possible
- Verify notifications work correctly
- Test database operations (create, read, update, delete)
- Check accessibility with screen readers
- Test with different time zones and device settings

### Automated Testing
We're building out our test suite. Contributions welcome for:
- Unit tests for utility functions
- Component testing for UI elements
- End-to-end testing for critical user flows

## 📚 Documentation

### Code Documentation
- Use JSDoc comments for functions and components
- Include examples for complex APIs
- Document any non-obvious business logic

### User Documentation
- Update README.md for new features
- Add to specs/ for significant features
- Include screenshots for UI changes

## 🤝 Community Guidelines

### Be Respectful
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Focus on constructive feedback
- Remember we're all here to help people practice mindfulness

### Communication
- **Issues**: For bug reports and feature requests
- **Discussions**: For general questions and ideas
- **Pull Requests**: For code review and collaboration

## 🎉 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- Project documentation

## ❓ Questions?

- **General questions**: Start a [discussion](https://github.com/ikhanhmai/mindfulness-bell/discussions)
- **Bug reports**: Create an [issue](https://github.com/ikhanhmai/mindfulness-bell/issues)
- **Feature ideas**: Create an [issue](https://github.com/ikhanhmai/mindfulness-bell/issues) with the "enhancement" label

## 📄 License

By contributing to Mindful Bell, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

**Thank you for helping make mindfulness more accessible! 🙏**

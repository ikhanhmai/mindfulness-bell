# 🔔 Mindful Bell

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://expo.dev)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020.svg?style=flat&logo=expo)](https://expo.dev)

> A simple, offline-first mindfulness bell that rings at random times, helping you return to the present moment and capture reflections on your inner states.

## ✨ Features

### 🔔 Random Bell Notifications
- **Unexpected mindfulness cues** during your active hours
- **Customizable time windows** - set when you want to receive bells
- **Quiet hours support** - no disturbance during sleep or meetings
- **Adjustable density** - low (~4/day), medium (~8/day), or high (~12/day)
- **Fully offline** - works without internet connection

### 📝 Inner State Observations
Capture and reflect on your mental patterns:
- **Desires** - Notice what you're craving or wanting
- **Fears** - Acknowledge what makes you anxious or worried
- **Afflictions** - Recognize sources of suffering or discomfort
- **Lessons** - Record insights and learnings from your practice

### 📊 Practice Statistics
- Track bells acknowledged per day
- Monitor entries created per week
- View your mindfulness practice progress over time

### ⚙️ Flexible Configuration
- Set active time windows for bell notifications
- Configure quiet hours when you don't want to be disturbed
- Choose bell sounds and vibration preferences
- Adjust notification density to fit your lifestyle

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mindfulness-bell.git
   cd mindfulness-bell
   ```

2. **Install dependencies**
   ```bash
   cd mindful-bell
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## 🏗️ Architecture

Built with modern React Native technologies:

- **Framework**: [Expo](https://expo.dev) - for streamlined development and deployment
- **Navigation**: React Navigation with bottom tabs
- **Database**: SQLite with expo-sqlite for local storage
- **Notifications**: expo-notifications for local scheduling
- **Background Jobs**: expo-background-fetch + expo-task-manager
- **Security**: expo-secure-store for encryption keys

### Data Structure
The app uses three main SQLite tables:
- `entries` - User observations (desires, fears, afflictions, lessons)
- `bell_events` - Scheduled and fired bell notifications
- `settings` - User preferences and configuration

## 📱 Usage

### First Time Setup
1. Grant notification permissions when prompted
2. Set your active time windows (when you want bells)
3. Configure quiet hours (when you don't want interruptions)
4. Choose your preferred bell density

### Daily Practice
1. **Receive random bells** during your active hours
2. **Acknowledge bells** to track your practice
3. **Add quick observations** when prompted by your inner state
4. **Review statistics** to see your progress over time
5. **Create lessons** to capture insights from your observations

## 🛠️ Development

### Project Structure
```
mindful-bell/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── constants/             # App constants and configuration
├── hooks/                 # Custom React hooks
├── specs/                 # Feature specifications
│   ├── 010-core-app/     # Core app specification
│   ├── 011-random-bell/  # Bell notification system
│   ├── 012-observations/ # Observation capture
│   └── 013-lessons/      # Lesson recording
└── templates/             # Documentation templates
```

### Development Scripts
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
npm run lint:md    # Lint markdown files
```

### Building Tasks
The development is organized into atomic tasks (≤3 hours each):

1. Database Layer Setup
2. Data Models & Types
3. Database Service Layer
4. Settings Management
5. Notification Permission & Setup
6. Random Bell Scheduling Logic
7. Background Job Setup
8. Bell Notification System
9. Entry Management UI
10. Home Screen & Navigation
11. Statistics Screen
12. Onboarding Flow

See [specs/010-core-app/tasks.md](mindful-bell/specs/010-core-app/tasks.md) for detailed task breakdown.

## 🎯 User Stories

- **Mindfulness Practice**: "I want to hear random bells during my day so I can return to the present moment unexpectedly"
- **Inner Awareness**: "I want to capture my desires, fears, and afflictions so I can become more aware of my mental patterns"
- **Progress Tracking**: "I want to see statistics of my practice so I can stay motivated"
- **Customization**: "I want to configure when bells ring so they fit my daily routine"

## 🔒 Privacy & Offline-First

- **No login required** - start using immediately
- **Fully offline** - all data stored locally on your device
- **No tracking** - your reflections stay private
- **Secure storage** - sensitive data encrypted locally
- **No internet dependency** - works anywhere, anytime

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas where we'd love help:
- 🎨 UI/UX improvements
- 🔧 Additional bell sounds and notification options
- 📊 Enhanced statistics and insights
- 🌐 Internationalization
- 🧪 Testing and quality assurance
- 📚 Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by mindfulness and meditation practices
- Built with the amazing [Expo](https://expo.dev) framework
- Icons and design elements from [Expo Vector Icons](https://icons.expo.fyi)

## 📞 Support

- 🐛 [Report bugs](https://github.com/your-username/mindfulness-bell/issues)
- 💡 [Request features](https://github.com/your-username/mindfulness-bell/issues)
- 💬 [Join discussions](https://github.com/your-username/mindfulness-bell/discussions)

---

**Made with ❤️ for mindfulness practitioners everywhere**

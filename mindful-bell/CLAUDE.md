# Claude Code Context

## Project Overview
Mindfulness bell mobile application built with React Native/Expo, featuring meditation timers, mindful notifications, and reflection notes.

## Recent Features

### App Store Publishing with EAS (002-create-the-specification)
- **Status**: Planning phase complete
- **Purpose**: Automated iOS app publishing pipeline using Expo Application Services
- **Key Technologies**: EAS Build, App Store Connect API, React Native/Expo
- **Branch**: `002-create-the-specification`

**Configuration**:
- Build profiles: development, preview, production
- Authentication: App Store Connect API Key (JWT)
- Optimization: Tree-shaking, bundle analysis with Expo Atlas
- Compliance: Wellness app guidelines, privacy manifest required

**Implementation Files**:
- `specs/002-create-the-specification/spec.md` - Feature specification
- `specs/002-create-the-specification/plan.md` - Implementation plan
- `specs/002-create-the-specification/research.md` - Technical research
- `specs/002-create-the-specification/data-model.md` - Entity definitions
- `specs/002-create-the-specification/contracts/` - API contracts
- `specs/002-create-the-specification/quickstart.md` - Validation guide

## Project Structure
```
src/
├── components/     # React Native components
├── screens/       # Screen components
├── services/      # Business logic and API calls
├── utils/         # Helper functions
└── types/         # TypeScript definitions

assets/           # Images, sounds, and static resources
ios/             # iOS-specific configuration
android/         # Android-specific configuration
```

## Development Workflow
1. Feature specification (`/specify` command)
2. Implementation planning (`/plan` command)
3. Task generation (`/tasks` command)
4. Implementation and testing

## Key Dependencies
- React Native/Expo SDK 54
- TypeScript for type safety
- AsyncStorage for local persistence
- Expo Notifications for mindfulness reminders
- Expo Audio for meditation sounds

## Constitutional Principles
- Mindfulness-first design (calm, focused UI)
- Offline-first architecture (local data storage)
- Privacy by design (no external data sharing)
- Simplicity and focus (minimal cognitive load)
- Reliable notifications (core bell functionality)

## Testing Strategy
- Jest for unit testing
- Expo development builds for device testing
- EAS Build for production testing
- Manual testing with meditation practitioners

## Build & Deployment
- Development: Expo development builds
- Preview: EAS preview builds for TestFlight
- Production: EAS production builds → App Store Connect
- CI/CD: Automated builds and submissions via EAS

---
*Last updated: 2025-09-27*
*Active features: App Store publishing pipeline*
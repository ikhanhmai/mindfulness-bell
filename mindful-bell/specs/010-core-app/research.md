# Core App Research

## React Native/Expo Technology Stack

**Decision**: Use Expo with React Native for cross-platform mobile development
**Rationale**:
- Faster development cycle with hot reload and OTA updates
- Strong ecosystem for notifications, local storage, and offline functionality
- Built-in support for SQLite through expo-sqlite
- Simplified deployment to both iOS and Android app stores

**Alternatives Considered**:
- Native iOS/Android development (rejected: too much duplication)
- Flutter (rejected: team has stronger React/TypeScript experience)
- React Native CLI (rejected: Expo provides better DX for this use case)

## Local Storage Solution

**Decision**: SQLite with expo-sqlite
**Rationale**:
- Proven offline-first solution for mobile apps
- Excellent performance for the expected data volumes (<10k entries)
- Built-in encryption support for sensitive data
- Strong React Native/Expo integration

**Alternatives Considered**:
- AsyncStorage (rejected: limited query capabilities)
- Realm (rejected: overkill for simple data model)
- WatermelonDB (rejected: unnecessary complexity)

## Background Notifications

**Decision**: Expo Notifications API with local scheduling
**Rationale**:
- Native notification scheduling without server dependencies
- Handles iOS/Android platform differences automatically
- Supports rich notification content and custom sounds
- Works reliably in background states

**Alternatives Considered**:
- Firebase Cloud Messaging (rejected: requires internet connectivity)
- React Native Push Notification (rejected: more complex setup)
- Custom native modules (rejected: maintenance overhead)

## State Management

**Decision**: React Context API with custom hooks
**Rationale**:
- Sufficient complexity for the app's scope
- No external dependencies required
- Good TypeScript integration
- Easy to test and debug

**Alternatives Considered**:
- Redux Toolkit (rejected: overkill for this app size)
- Zustand (rejected: unnecessary third-party dependency)
- MobX (rejected: team preference for simpler patterns)

## UI Framework

**Decision**: React Native Elements with custom styling
**Rationale**:
- Comprehensive component library with good defaults
- Consistent cross-platform appearance
- Good accessibility support out of the box
- Easy to customize for the calm, mindful aesthetic

**Alternatives Considered**:
- NativeBase (rejected: heavier bundle size)
- UI Kitten (rejected: less mature ecosystem)
- Custom components only (rejected: too much initial work)

## Audio Management

**Decision**: expo-av for bell sounds
**Rationale**:
- Simple API for playing short audio clips
- Good performance for notification sounds
- Supports custom sound files
- Reliable across iOS/Android

**Alternatives Considered**:
- react-native-sound (rejected: additional native setup required)
- Built-in platform sounds only (rejected: limited customization)

## Development Tools

**Decision**:
- TypeScript for type safety
- Jest + React Native Testing Library for testing
- ESLint + Prettier for code quality
- Expo CLI for development workflow

**Rationale**:
- Strong type safety prevents common React Native errors
- Comprehensive testing setup for business logic
- Consistent code formatting across team
- Streamlined development and deployment process

**Alternatives Considered**:
- JavaScript only (rejected: lack of type safety)
- Detox for E2E testing (rejected: complex setup for scope)
- Manual linting (rejected: team productivity impact)

## Architecture Patterns

**Decision**: Feature-based folder structure with service layer
**Rationale**:
- Clear separation between UI components and business logic
- Easy to locate files related to specific features
- Supports future modularization if needed
- Good testability boundaries

**Structure**:
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen-level components
├── services/       # Business logic and data access
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

**Alternatives Considered**:
- Domain-driven design (rejected: overkill for app complexity)
- Flat file structure (rejected: doesn't scale well)
- Screen-based grouping (rejected: creates code duplication)

## Security Considerations

**Decision**: Local encryption for sensitive data using expo-secure-store
**Rationale**:
- Protects user's personal observations from device compromise
- Simple API that works across platforms
- Minimal performance impact for the data volumes
- Aligns with privacy-first constitution principle

**Implementation**:
- Encrypt observation content before SQLite storage
- Use device keychain/keystore for encryption keys
- No analytics or telemetry collection
- All data remains on device unless explicitly exported

**Alternatives Considered**:
- Plain text storage (rejected: privacy concerns)
- Custom encryption (rejected: security implementation risk)
- Server-side encryption (rejected: offline-first requirement)
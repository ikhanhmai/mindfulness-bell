# Implementation Plan: Core App

**Branch**: `010-core-app` | **Date**: 2025-09-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-core-app/spec.md`

## Summary
Core App provides the foundation for the Mindful Bell application with offline-first architecture. React Native/Expo implementation supports random bell notifications, observation entry management, and basic statistics. All data stored locally with SQLite, no login required, privacy-first design with optional encryption.

## Technical Context
**Language/Version**: TypeScript with React Native (Latest LTS)
**Primary Dependencies**: Expo SDK 50+, expo-sqlite, expo-notifications, expo-background-fetch
**Storage**: SQLite with expo-sqlite, expo-secure-store for encryption keys
**Testing**: Jest + React Native Testing Library, manual notification testing
**Target Platform**: iOS 15+, Android API 26+
**Project Type**: mobile - React Native app structure
**Performance Goals**: <2s cold start, 60fps UI, <200ms local operations
**Constraints**: Offline-capable, <100MB storage, reliable notifications
**Scale/Scope**: Single user, ~10k observations, 50+ bell events/day

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **I. Mindfulness-First Design**: Bell notifications support present-moment awareness, no engagement metrics or addictive patterns
✅ **II. Offline-First Architecture**: All core features work without internet, local SQLite storage
✅ **III. Privacy by Design**: No data leaves device, optional encryption, no analytics
✅ **IV. Simplicity and Focus**: Each screen single purpose, ≤3 taps navigation, calm aesthetics
✅ **V. Reliable Bell System**: Notifications prioritized over battery optimization, configurable quiet hours
✅ **Development Standards**: React Native/Expo best practices, TypeScript, simple state management
✅ **Quality Assurance**: User testing with meditation practitioners, performance on older devices

## Project Structure

### Documentation (this feature)
```
specs/010-core-app/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
│   └── bell-api.yaml
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
# Option 3: Mobile + API structure
src/
├── components/          # Reusable UI components
├── screens/             # Screen-level components
├── services/            # Business logic and data access
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
└── navigation/          # Navigation configuration

tests/
├── contract/            # API contract tests
├── integration/         # Feature integration tests
└── unit/                # Component and service unit tests
```

**Structure Decision**: Option 3 (Mobile) - React Native app with local services layer

## Phase 0: Research Complete ✅
Research.md covers:
- React Native/Expo technology stack decisions
- Local storage with SQLite and encryption
- Background notifications strategy
- State management with Context API
- UI framework selection (React Native Elements)
- Security considerations with expo-secure-store

## Phase 1: Design Complete ✅
- **Data Model**: SQLite schema with encryption support ✅
- **API Contracts**: Local service layer contracts ✅
- **Quickstart**: Setup and validation guide ✅
- **Architecture**: Component and service layer design ✅

## Phase 2: Task Planning Approach

**Task Generation Strategy**:
- Load task template and generate from design artifacts
- Create tasks for core services (BellScheduler, NotificationManager, DatabaseService)
- Generate UI component tasks (HomeScreen, SettingsScreen, StatsScreen, ObservationsScreen)
- Include notification setup and background processing tasks
- Add testing tasks for critical paths (bell scheduling, notification delivery)

**Ordering Strategy**:
- Foundation: Database setup, core services, navigation
- Core Features: Bell scheduling, notification system, observation CRUD
- UI Components: Screen components and user flows
- Integration: Background processing, notification handling
- Testing: Unit tests, integration tests, manual validation

**Estimated Output**: 35-40 numbered, ordered tasks covering full implementation

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach defined (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All technical unknowns resolved
- [x] Architecture aligns with constitutional principles

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
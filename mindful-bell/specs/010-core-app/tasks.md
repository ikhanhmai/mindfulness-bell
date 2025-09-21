# Tasks: Core App

**Input**: Design documents from `/specs/010-core-app/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Phase 3.1: Setup
- [x] T001 Create React Native project structure per implementation plan at repository root
- [x] T002 Initialize TypeScript React Native project with Expo SDK 50+ dependencies
- [x] T003 [P] Configure ESLint, Prettier, and TypeScript configuration files
- [x] T004 [P] Set up navigation structure with React Navigation and bottom tabs
- [x] T005 [P] Configure expo-sqlite, expo-notifications, expo-background-fetch dependencies

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T006 [P] Contract test bell schedule generation in tests/contract/test_bell_scheduler.test.ts
- [x] T007 [P] Contract test observation CRUD in tests/contract/test_observations.test.ts
- [x] T008 [P] Contract test settings management in tests/contract/test_settings.test.ts
- [x] T009 [P] Contract test statistics queries in tests/contract/test_stats.test.ts
- [x] T010 [P] Integration test notification scheduling in tests/integration/test_notifications.test.ts
- [x] T011 [P] Integration test database initialization in tests/integration/test_database.test.ts
- [x] T012 [P] Integration test bell acknowledgment flow in tests/integration/test_bell_flow.test.ts
- [x] T013 [P] Integration test observation creation from bell in tests/integration/test_observation_flow.test.ts

## Phase 3.3: Core Services (ONLY after tests are failing)
- [x] T014 [P] DatabaseService with SQLite setup and migrations in src/services/DatabaseService.ts
- [ ] T015 [P] EncryptionService with expo-secure-store integration in src/services/EncryptionService.ts
- [x] T016 [P] BellSchedulerService with random time generation in src/services/BellSchedulerService.ts
- [x] T017 [P] NotificationManager with expo-notifications setup in src/services/NotificationManager.ts
- [x] T018 [P] ObservationService with CRUD operations in src/services/ObservationService.ts
- [x] T019 [P] SettingsService with user preferences in src/services/SettingsService.ts
- [x] T020 [P] StatsService with analytics queries in src/services/StatsService.ts

## Phase 3.4: Data Models and Types
- [x] T021 [P] TypeScript types for core entities in src/types/index.ts
- [ ] T022 [P] Observation model with validation in src/models/Observation.ts
- [ ] T023 [P] BellEvent model with scheduling data in src/models/BellEvent.ts
- [ ] T024 [P] Settings model with user preferences in src/models/Settings.ts
- [ ] T025 [P] Stats model with aggregation types in src/models/Stats.ts

## Phase 3.5: React Context and State Management
- [x] T026 [P] DatabaseContext with service providers in src/hooks/DatabaseContext.tsx
- [x] T027 [P] SettingsContext with user preferences in src/hooks/SettingsContext.tsx
- [x] T028 [P] NotificationContext with permission handling in src/hooks/NotificationContext.tsx
- [x] T029 [P] Custom hooks for observations in src/hooks/useObservations.ts
- [x] T030 [P] Custom hooks for bell events in src/hooks/useBellEvents.ts

## Phase 3.6: UI Components
- [x] T031 [P] HomeScreen with next bell and quick capture in src/screens/HomeScreen.tsx
- [x] T032 [P] SettingsScreen with time windows and preferences in src/screens/SettingsScreen.tsx
- [x] T033 [P] ObservationsScreen with list and filters in src/screens/ObservationsScreen.tsx
- [x] T034 [P] StatsScreen with practice statistics in src/screens/StatsScreen.tsx
- [x] T035 [P] BellAcknowledgmentModal for notification response in src/components/BellAcknowledgmentModal.tsx
- [x] T036 [P] ObservationForm for entry creation/editing in src/components/ObservationForm.tsx
- [x] T037 [P] TimeWindowPicker for settings configuration in src/components/TimeWindowPicker.tsx
- [x] T038 [P] StatsChart for practice visualization in src/components/StatsChart.tsx

## Phase 3.7: Background Processing and Notifications
- [x] T039 Background task registration with expo-task-manager in src/services/BackgroundTasks.ts
- [x] T040 Daily bell schedule generation task implementation
- [ ] T041 Notification permission request and handling
- [ ] T042 Bell notification delivery and acknowledgment tracking
- [ ] T043 iOS notification limit management (64 notification cap)
- [ ] T044 Android notification channel and priority configuration

## Phase 3.8: Integration and App Assembly
- [x] T045 App.tsx with navigation and context providers
- [x] T046 Database initialization and migration handling on app start
- [x] T047 Notification permission request flow on first launch
- [x] T048 Default settings configuration and onboarding
- [x] T049 Deep linking for notification responses
- [x] T050 Error boundary and crash handling

## Phase 3.9: Platform-Specific Features
- [ ] T051 [P] iOS background processing permissions and configuration
- [ ] T052 [P] Android background processing and battery optimization handling
- [ ] T053 [P] iOS notification sound and vibration configuration
- [ ] T054 [P] Android notification sound and vibration configuration

## Phase 3.10: Testing and Validation
- [ ] T055 [P] Unit tests for BellSchedulerService algorithm in tests/unit/BellScheduler.test.ts
- [ ] T056 [P] Unit tests for encryption service in tests/unit/EncryptionService.test.ts
- [ ] T057 [P] Unit tests for observation validation in tests/unit/ObservationValidation.test.ts
- [ ] T058 [P] Component tests for HomeScreen in tests/unit/HomeScreen.test.tsx
- [ ] T059 [P] Component tests for SettingsScreen in tests/unit/SettingsScreen.test.tsx
- [ ] T060 Manual testing on iOS device following quickstart.md validation steps
- [ ] T061 Manual testing on Android device following quickstart.md validation steps
- [ ] T062 Performance testing for <2s cold start requirement
- [ ] T063 Battery usage testing with continuous bell scheduling

## Phase 3.11: Polish and Documentation
- [ ] T064 [P] Code cleanup and remove debugging code
- [ ] T065 [P] Add accessibility labels and screen reader support
- [ ] T066 [P] Optimize images and assets for app bundle size
- [ ] T067 [P] Update app.json with proper metadata and permissions
- [ ] T068 [P] Create build configuration for development and production
- [ ] T069 Validate all acceptance criteria from spec.md
- [ ] T070 Create developer documentation for future features

## Dependencies
- Setup (T001-T005) before all other phases
- Tests (T006-T013) before implementation (T014-T070)
- Core services (T014-T020) before UI components (T031-T038)
- Models/Types (T021-T025) before UI and integration
- Context/State (T026-T030) before UI components
- Background processing (T039-T044) after core services
- Integration (T045-T050) after UI components
- Platform features (T051-T054) after integration
- Testing (T055-T063) throughout implementation
- Polish (T064-T070) after all implementation complete

## Parallel Execution Examples
```bash
# Phase 3.2: Contract Tests (can run simultaneously)
T006: "Contract test bell schedule generation"
T007: "Contract test observation CRUD"
T008: "Contract test settings management"
T009: "Contract test statistics queries"

# Phase 3.3: Core Services (different files, no dependencies)
T014: "DatabaseService implementation"
T015: "EncryptionService implementation"
T016: "BellSchedulerService implementation"
T017: "NotificationManager implementation"

# Phase 3.6: UI Components (different screen files)
T031: "HomeScreen implementation"
T032: "SettingsScreen implementation"
T033: "ObservationsScreen implementation"
T034: "StatsScreen implementation"
```

## Critical Success Criteria
- All tests must FAIL before writing implementation code (TDD enforcement)
- Bell notifications must trigger reliably across iOS/Android
- App must function completely offline
- Performance targets: <2s cold start, <200ms local operations
- No user data leaves device without explicit consent
- Navigation requires ≤3 taps to reach any feature
# Implementation Plan – Core App

## Architecture
- **Framework**: Expo React Native.
- **Navigation**: React Navigation with bottom tabs (Home, Entries, Stats, Settings).
- **Notifications**: expo-notifications for local scheduling.
- **Background jobs**: expo-background-fetch + expo-task-manager for daily refill (~00:05).
- **Database**: expo-sqlite for structured local storage.
- **Secure storage**: expo-secure-store to keep encryption key for SQLite.
- **Future extension**: Optional cloud sync API (Spec #020).

## Data Flow
1. Onboarding asks for notification permission and sets initial windows/density.
2. Background job calculates random times and schedules notifications.
3. When a bell fires:
   - User acknowledges → event logged to `bell_events`.
   - User may add quick note → saved to `entries`.
4. Entries CRUD via SQLite.
5. Stats screen queries entries and bell events for charts.

## Risks & Mitigations
- **iOS background restrictions**: BackgroundFetch may not run exactly at 00:05 → fallback “Refill now” button in Settings.
- **Pending notification limit on iOS (64)**: Split schedules into AM and PM batches.
- **Notification fatigue**: Provide density control and quiet hours.

## Migration Strategy
- Maintain `schema_version` in SQLite.
- On app start, run migration script if version differs.
- Add new fields via ALTER TABLE with default values.

## Testing Strategy
- Unit tests for random time generation utility.
- Manual smoke test: shorten windows to 1–2h to validate random bells.
- Acceptance tests map to spec.md checklist.

# Implementation Plan – Observations

## Architecture
- **Database**: store Observations in `entries` table (type = desire | fear | affliction).
- **UI**:
  - Quick capture sheet on Home screen.
  - Capture flow when acknowledging a bell notification.
  - Observations list view with search and filters.
  - Observation detail + edit screen.
- **State Management**: use React Context or Zustand for in-memory state synced with SQLite.
- **Offline-first**: all CRUD operations work offline and sync (Spec #020) can be added later.

## Data Flow
1. User taps "Add Observation" → opens capture sheet → entry saved in SQLite and added to in-memory state.
2. User acknowledges a bell notification → optional quick note → saved as Observation entry.
3. Observations listed with search/filter → query SQLite with LIKE/tag filter.
4. Edit or soft-delete → mark `deletedAt` in DB, provide undo option for 5 seconds.
5. Empty/error states handled in UI components.

## Libraries & APIs
- expo-sqlite for persistence.
- react-native-paper or custom components for list & modal sheet.
- Optional: debounce search for performance.

## Risks & Mitigations
- **Large number of entries**: add indexes on `createdAt` and `type` fields.
- **Undo delete**: implement simple queue with timer to rollback delete if user taps undo.

## Testing Strategy
- Unit test: CRUD hooks with SQLite.
- Manual test: quick capture from Home and from Bell ack.
- Verify search returns within 200ms for 1k+ entries.
- Acceptance tests aligned with spec.md checklist.

# Tasks (ordered, ≤3h each)

1. **Database Layer Setup** — Acceptance: SQLite database initialized with `entries`, `bell_events`, and `settings` tables. Schema migration system in place with version tracking. Database connection utilities created and tested.

2. **Data Models & Types** — Acceptance: TypeScript interfaces defined for all data models (Entry, BellEvent, Settings). Enums created for entry types and density levels. Type definitions align with data-model.md specification.

3. **Database Service Layer** — Acceptance: Complete CRUD operations implemented for all three tables. Database service classes with proper error handling. Unit tests covering basic operations (create, read, update, delete).

4. **Settings Management** — Acceptance: Settings screen with UI controls for active windows, quiet hours, bell density, sound selection, and vibration toggle. Settings persist to database. Form validation and user-friendly time pickers.

5. **Notification Permission & Setup** — Acceptance: Notification permission request on app launch. Permission status tracking. expo-notifications properly configured with proper error handling for denied permissions.

6. **Random Bell Scheduling Logic** — Acceptance: Algorithm generates random bell times within active windows, excluding quiet hours. Supports low/medium/high density (3-5, 8-12, 15-20 bells per day respectively). Times are properly distributed and avoid clustering.

7. **Background Job Setup** — Acceptance: expo-background-fetch and expo-task-manager configured. Daily background job (target ~00:05) that refills bell schedule. Fallback "Refill now" button in settings. Background job runs reliably when app is backgrounded.

8. **Bell Notification System** — Acceptance: Scheduled notifications fire at correct times. Bell acknowledgment flow captures user response. Bell events logged to database with fired and acknowledged timestamps. Proper handling of iOS 64-notification limit with AM/PM batching.

9. **Entry Management UI** — Acceptance: Screens for creating, editing, and deleting entries. Support for all four types (Desire, Fear, Affliction, Lesson). Text input with 2000 character limit. Optional tags functionality. Entry list view with filtering by type and date.

10. **Home Screen & Navigation** — Acceptance: Bottom tab navigation (Home, Entries, Stats, Settings). Home screen shows recent bell events and quick entry creation. Navigation between all major screens. Proper tab icons and labels.

11. **Statistics Screen** — Acceptance: Charts showing bells acknowledged per day (last 7 days). Entry creation count per week (last 4 weeks). Basic statistics like total bells, total entries. Simple, readable data visualization.

12. **Onboarding Flow** — Acceptance: First-launch onboarding requesting notification permission. Initial setup of active windows and density preference. Skip option for advanced users. Onboarding completion tracked to prevent re-showing.
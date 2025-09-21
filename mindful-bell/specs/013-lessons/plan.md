# Implementation Plan – Lessons

## Architecture
- **Database**: store Lessons in new `lessons` table.
- **UI**:
  - Lesson creation screen (title optional, body required).
  - Option to create Lesson from selected Observations (multi-select).
  - Lesson list and detail views.
- **Linking**:
  - Many-to-many relationship between Lessons and Observations.
  - Implement through join table `lesson_observations`.

## Data Flow
1. User creates Lesson → save record in `lessons` table.
2. If linked Observations → insert rows into `lesson_observations` join table.
3. Lesson list shows items in reverse chronological order.
4. Detail view fetches linked Observations and displays context.
5. Edit/delete Lessons → cascade updates to join table.

## Database Schema
- `lessons` table:
  - id: UUID
  - title: string (optional)
  - body: string (required, up to 2000 chars)
  - createdAt: datetime
- `lesson_observations` table:
  - lessonId: FK to lessons.id
  - observationId: FK to entries.id
  - createdAt: datetime

## Libraries & APIs
- expo-sqlite for persistence.
- React Navigation for navigating between list, detail, create/edit screens.

## Risks & Mitigations
- **Observation deleted**: keep Lesson valid; show "observation deleted" placeholder.
- **Linking UX**: multi-select might be confusing → provide clear UI with checkboxes/toggles.

## Testing Strategy
- Unit test: creating Lesson and linking Observations.
- Integration test: fetch Lesson with linked Observations.
- Acceptance tests follow spec.md checklist.

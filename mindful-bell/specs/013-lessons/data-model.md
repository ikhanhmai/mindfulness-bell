# Data Model – Lessons

## Table: lessons
- id: UUID
- title: string (optional, max 200 chars)
- body: string (required, max 2000 chars)
- createdAt: datetime (ISO8601)
- updatedAt: datetime (ISO8601)
- deletedAt: datetime? (null if active)

## Table: lesson_observations
- lessonId: UUID (FK to lessons.id)
- observationId: UUID (FK to entries.id, type ∈ {desire, fear, affliction})
- createdAt: datetime

## Notes
- A Lesson can be linked to multiple Observations.
- If an Observation is deleted, the link remains but should display "Observation deleted" in the UI.
- Indexes:
  - idx_lessons_createdAt (for sorting)
  - idx_lesson_observations_lessonId
  - idx_lesson_observations_observationId

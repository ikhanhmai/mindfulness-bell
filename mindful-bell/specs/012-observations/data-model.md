# Data Model – Observations

## Table: entries
(Shared with Core App, reused for Observations and Lessons references)

- id: UUID
- type: enum('desire', 'fear', 'affliction', 'lesson')
- text: string (max 2000 chars)
- tags: string[] (optional, comma-separated)
- createdAt: datetime (ISO8601)
- updatedAt: datetime (ISO8601)
- deletedAt: datetime? (null if active)

## Notes
- Observations use `entries.type` = 'desire' | 'fear' | 'affliction'.
- Soft-delete implemented by setting `deletedAt`.
- Indexes:
  - idx_entries_type_createdAt (type, createdAt)
  - idx_entries_tags (for faster search/filter)

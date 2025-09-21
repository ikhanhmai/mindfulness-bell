# Data Model – Core App

## Table: entries
- id: UUID
- type: enum('desire', 'fear', 'affliction', 'lesson')
- text: string (max 2000 chars)
- tags: string[] (optional)
- createdAt: datetime (ISO8601)

## Table: bell_events
- id: UUID
- scheduledAt: datetime
- firedAt: datetime? (null until fired)
- acknowledgedAt: datetime? (null until acknowledged)

## Table: settings
- id: UUID
- activeWindows: array<timeRange>  // e.g. [{"start":"08:00","end":"11:30"}]
- quietHours: array<timeRange>
- density: enum('low','med','high')
- sounds: array<string>
- vibration: boolean
- updatedAt: datetime

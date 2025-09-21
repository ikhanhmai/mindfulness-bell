# Implementation Plan – Random Bell

## Algorithm
1. At ~00:05 daily, BackgroundFetch job runs.
2. Generate N random times within user-defined active windows.
   - N depends on density (low/med/high).
   - Ensure each time ≥ minGapMin apart (default 45 minutes).
   - Exclude quiet hours completely.
3. Split into batches if iOS pending notifications > 64.
   - Morning batch (e.g. 00:05 schedules 08:00–14:00).
   - Afternoon batch (e.g. 12:00 schedules 14:00–21:00).
4. For each generated time:
   - Call `Notifications.scheduleNotificationAsync`.
   - Insert BellEvent row (scheduledAt).

## Trigger Handling
- When notification fires:
  - Log `firedAt` for the event.
  - Show acknowledge prompt.
  - If acknowledged, set `acknowledgedAt`.
  - If note added, create new `entry` with type (desire/fear/affliction).

## Libraries & APIs
- `expo-notifications`: schedule/cancel local notifications.
- `expo-background-fetch` + `expo-task-manager`: run daily job.
- Local DB: `expo-sqlite` for persisting BellEvents.

## Risks & Mitigations
- **Background job not guaranteed**: Provide manual “Refill schedule now” button in Settings.
- **iOS notification cap**: Always check pending count before scheduling; batch as needed.
- **User annoyance**: Density presets + Quiet Hours reduce fatigue.

## Testing Strategy
- Unit test: random time generator produces correct count and spacing.
- Manual test: shrink active windows (e.g. 1h) to simulate multiple bells.
- Acceptance tests linked to spec.md checklist.

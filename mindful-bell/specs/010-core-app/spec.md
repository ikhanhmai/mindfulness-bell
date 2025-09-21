# Core App – Mindful Bell

## Overview
The Core App provides the foundation for the Mindful Bell application.
It works fully offline, without requiring login or internet connection.
The app enables users to receive random mindfulness bell notifications,
record observations (Desires, Fears, Afflictions, Lessons), and review
basic statistics.

## User Stories
- As a user, I want to hear random mindfulness bells during my waking hours, so that I can return to the present moment unexpectedly.
- As a user, I want to record observations (Desire, Fear, Affliction, Lesson), so that I can reflect on my inner state.
- As a user, I want to see simple statistics of bells acknowledged and entries created, so that I can track my practice progress.
- As a user, I want to configure active windows, quiet hours, bell density, and sounds, so that the notifications fit my daily routine.

## Functional Requirements
- Local storage (SQLite) for entries, bell events, and settings.
- Random bell scheduling:
  - Works only within user-defined active windows.
  - Excludes quiet hours.
  - Supports low/medium/high density options.
- Background job to refill bell schedule daily.
- Notification permission request and management.
- Entry management (CRUD) for four observation types.
- Settings screen for time windows, density, sound, vibration.
- Stats screen showing bells per day and entries per week.

## Non-Functional Requirements
- App must run fully offline.
- Average cold start < 2s on mid-range devices.
- Support iOS and Android (latest 2 major versions).
- Secure storage of sensitive data (encryption key).

## Acceptance Checklist
- [ ] App runs completely offline, no login required.
- [ ] User can create/edit/delete an entry in ≤ 3 steps.
- [ ] ≥95% of scheduled bells trigger within active windows.
- [ ] No bells during quiet hours.
- [ ] Database contains 3 main tables: `entries`, `bell_events`, `settings`.
- [ ] iOS does not exceed pending notification limits.

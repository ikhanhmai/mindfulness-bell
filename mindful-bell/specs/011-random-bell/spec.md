# Random Bell – Mindful Bell App

## Overview
The Random Bell feature schedules and triggers unexpected bell notifications
during user-defined active windows. This helps users return to mindfulness
at random times, while respecting quiet hours and user preferences.

## User Stories
- As a user, I want bells to ring randomly within my active windows, so that I can practice mindfulness unexpectedly.
- As a user, I want no bells during my quiet hours (e.g. sleep time), so that the app does not disturb me.
- As a user, I want to adjust bell density (low/med/high), so that I can control how often bells occur.
- As a user, I want to acknowledge a bell and optionally add a quick note, so that I can capture my state of mind at that moment.

## Functional Requirements
- User defines active windows (e.g. 08:00–11:30, 13:30–21:00).
- User defines quiet hours (e.g. 23:00–07:00).
- Density presets: low (≈4/day), medium (≈8/day), high (≈12/day).
- Random generation algorithm:
  - Uniform distribution across windows.
  - Minimum interval between bells (configurable, default 45min).
- Notifications must not cluster too close.
- Notifications are scheduled daily.
- On trigger:
  - Log firedAt in `bell_events`.
  - Allow user to acknowledge and optionally add quick note (saved as `entry` of type observation).
- Handle iOS notification limit (max 64 pending).

## Non-Functional Requirements
- Notifications should feel natural and not overwhelming.
- Battery impact must be minimal.
- Works offline, no server dependency.

## Acceptance Checklist
- [ ] ≥95% of bells ring within defined active windows.
- [ ] 0 bells during quiet hours.
- [ ] Density setting changes reflected on the next day’s schedule.
- [ ] Notifications spaced at least min interval apart.
- [ ] iOS never exceeds pending notification limit.
- [ ] Acknowledge + quick note flow works on both iOS and Android.

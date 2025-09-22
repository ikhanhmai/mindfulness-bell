# Core App – Mindful Bell

## Overview
The Core App provides the foundation for the Mindful Bell application.
It works fully offline, without requiring login or internet connection.
The app enables users to receive random mindfulness bell notifications,
record observations (Desires, Fears, Afflictions, Lessons), and review
basic statistics.

## User Stories

### Bell Notifications
- As a user, I want to hear random mindfulness bells during my waking hours, so that I can return to the present moment unexpectedly.
- As a user, I want bells to ring randomly within my active windows, so that I can practice mindfulness unexpectedly.
- As a user, I want no bells during my quiet hours (e.g. sleep time), so that the app does not disturb me.
- As a user, I want to adjust bell density (low/med/high), so that I can control how often bells occur.
- As a user, I want to acknowledge a bell and optionally add a quick note, so that I can capture my state of mind at that moment.

### Observations
- As a user, I want to quickly capture a Desire, Fear, or Affliction, so that I can become aware of my inner state.
- As a user, I want to edit or delete past observations, so that my log remains accurate and relevant.
- As a user, I want to search or filter observations by tags or text, so that I can review patterns in my thoughts.
- As a user, I want to see category counts in filter buttons (e.g., "Desires (5)", "Fears (2)"), so that I can quickly see how many observations I have of each type.
- As a user, I want to see an empty state message when I have no observations, so that the app still feels supportive.

### Lessons
- As a user, I want to create a Lesson that summarizes my insight, so that I can remember what I have learned.
- As a user, I want to link a Lesson to one or more observations, so that I have context for my insight.
- As a user, I want to browse and re-read Lessons, so that I can revisit my past learnings.
- As a user, I want to see a supportive empty state when I have no Lessons yet.

### General
- As a user, I want to see simple statistics of bells acknowledged and entries created, so that I can track my practice progress.
- As a user, I want to configure active windows, quiet hours, bell density, and sounds, so that the notifications fit my daily routine.

## Functional Requirements

### Random Bell System
- **Cross-Platform Storage**: SQLite for native platforms, mock storage for web
- **Web Compatibility**: Full functionality with graceful fallbacks for web browsers
- Random bell scheduling:
  - User defines active windows (e.g. 08:00–11:30, 13:30–21:00)
  - User defines quiet hours (e.g. 23:00–07:00)
  - Density presets: low (≈4/day), medium (≈8/day), high (≈12/day)
  - Random generation algorithm with uniform distribution across windows
  - Minimum interval between bells (configurable, default 45min)
  - Notifications must not cluster too close together
  - Web fallback: No notifications, but full UI functionality
- Background job to refill bell schedule daily (native only)
- Notification permission request and management (with web fallbacks)
- Handle iOS notification limit (max 64 pending)
- On trigger: Log firedAt in bell_events, allow acknowledgment with optional note

### Observation Management
- Quick capture sheet on Home screen (≤3 taps to create)
- Option to add observation when acknowledging a bell
- Entry type must be one of: desire, fear, affliction
- Support tagging and free text notes with hashtag auto-extraction
- List view with search and filters (results in <200ms)
- **Category counts in filter buttons**: Display real-time counts for each observation type (e.g., "All (12)", "Desires (5)", "Fears (3)", "Afflictions (2)", "Lessons (2)")
- Edit and soft delete with 5-second undo option
- Empty state and error state UX with supportive, non-judgmental text
- Cross-platform CRUD operations

### Lessons System (New Feature)
- Create Lesson from scratch or from selected observations
- Each Lesson has title (optional) and body (required, max 2000 characters)
- Link to related observations (one-to-many relationship)
- List of Lessons with detail view in reverse chronological order
- Edit and delete Lessons with soft delete
- Lesson detail view shows linked observations
- Empty and error states with supportive messaging
- Lessons stored locally, accessible offline
- Linking must not break even if observations are later deleted

### UI and Navigation
- Settings screen for time windows, density, sound, vibration
- Stats screen showing bells per day and entries per week
- **Navigation**: Auto-navigation after observation save with fallback options
- **TDD Coverage**: Comprehensive test suite ensuring reliability

## Non-Functional Requirements
- **Multi-Platform**: iOS, Android, and Web browser support
- App must run fully offline (native) or with local storage (web)
- Average cold start < 2s on mid-range devices
- Support iOS and Android (latest 2 major versions) + modern web browsers
- Secure storage of sensitive data (encryption key on native, secure local storage on web)
- **Web Fallbacks**: Graceful degradation when native APIs unavailable
- **Test Coverage**: >95% code coverage with TDD methodology
- **Routing Reliability**: Robust navigation system with error handling
- **Performance Requirements**:
  - Operations must complete offline in <200ms
  - Search returns matching entries within 200ms
  - Undo option available for 5s after delete
- **UX Requirements**:
  - UI text must be non-judgmental and supportive
  - Notifications should feel natural and not overwhelming
  - Battery impact must be minimal
  - Lesson text fields support at least 2000 characters

## Acceptance Checklist

### Core System (Implemented ✅)
- [x] App runs completely offline (native) and locally (web), no login required
- [x] User can create/edit/delete an entry in ≤ 3 steps
- [x] Cross-platform data persistence (SQLite native, mock storage web)
- [x] Web compatibility with graceful notification fallbacks
- [x] Auto-navigation after observation save with fallback options
- [x] Comprehensive TDD test coverage (30+ integration tests passing)
- [x] Database contains 3 main tables: `entries`, `bell_events`, `settings`
- [x] Routing system works reliably across all platforms
- [x] Web fallbacks handle missing native APIs gracefully

### Bell System (Partially Implemented ⚠️)
- [ ] ≥95% of scheduled bells trigger within active windows (native only)
- [ ] No bells during quiet hours (native only)
- [ ] iOS does not exceed pending notification limits
- [ ] Density setting changes reflected on the next day's schedule
- [ ] Notifications spaced at least min interval apart
- [ ] Acknowledge + quick note flow works on both iOS and Android

### Observation System (Mostly Implemented ⚠️)
- [x] User can create an observation in ≤ 3 taps
- [ ] User can edit and soft-delete an observation (currently hard delete)
- [ ] Search returns matching entries within 200ms
- [ ] **Category counts displayed in filter buttons** showing real-time observation counts by type
- [x] Empty state message is displayed when no observations exist
- [x] Observations captured from a bell acknowledgement are saved correctly

### Lessons System (Not Implemented ❌)
- [ ] User can create a Lesson with body text
- [ ] User can link a Lesson to ≥1 observations
- [ ] Lessons are listed in reverse chronological order
- [ ] Lesson detail view shows linked observations
- [ ] Empty state shown when no Lessons exist
- [ ] Database includes `lessons` table with observation relationships

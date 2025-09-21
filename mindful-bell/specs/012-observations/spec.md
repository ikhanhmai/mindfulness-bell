# Observations – Mindful Bell App

## Overview
The Observations feature allows users to capture their inner states in the
form of Desires, Fears, or Afflictions. Each entry is stored locally and can
be reviewed later. Observations can be created directly from the Home screen
or in response to a bell notification.

## User Stories
- As a user, I want to quickly capture a Desire, Fear, or Affliction, so that I can become aware of my inner state.
- As a user, I want to edit or delete past observations, so that my log remains accurate and relevant.
- As a user, I want to search or filter observations by tags or text, so that I can review patterns in my thoughts.
- As a user, I want to see an empty state message when I have no observations, so that the app still feels supportive.

## Functional Requirements
- Quick capture sheet on Home screen.
- Option to add observation when acknowledging a bell.
- Entry type must be one of: desire, fear, affliction.
- Support tagging and free text notes.
- List view with search and filters.
- Edit and delete (soft delete with undo).
- Empty state and error state UX.

## Non-Functional Requirements
- Operations must complete offline in <200ms.
- Undo option available for 5s after delete.
- UI text must be non-judgmental and supportive.

## Acceptance Checklist
- [ ] User can create an observation in ≤ 3 taps.
- [ ] User can edit and soft-delete an observation.
- [ ] Search returns matching entries within 200ms.
- [ ] Empty state message is displayed when no observations exist.
- [ ] Observations captured from a bell acknowledgement are saved correctly.

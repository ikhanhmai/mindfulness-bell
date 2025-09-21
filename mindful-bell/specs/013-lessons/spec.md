# Lessons – Mindful Bell App

## Overview
The Lessons feature enables users to record insights and reflections derived
from their observations. Lessons can be linked back to specific observations
for context. This helps users consolidate learning from their practice.

## User Stories
- As a user, I want to create a Lesson that summarizes my insight, so that I can remember what I have learned.
- As a user, I want to link a Lesson to one or more observations, so that I have context for my insight.
- As a user, I want to browse and re-read Lessons, so that I can revisit my past learnings.
- As a user, I want to see a supportive empty state when I have no Lessons yet.

## Functional Requirements
- Create Lesson from scratch or from selected observations.
- Each Lesson has title (optional) and body (required).
- Link to related observations (one-to-many).
- List of Lessons with detail view.
- Edit and delete Lessons.
- Empty and error states.

## Non-Functional Requirements
- Lessons stored locally, accessible offline.
- Text field supports at least 2000 characters.
- Linking to observations must not break even if observations are later deleted.

## Acceptance Checklist
- [ ] User can create a Lesson with body text.
- [ ] User can link a Lesson to ≥1 observations.
- [ ] Lessons are listed in reverse chronological order.
- [ ] Lesson detail view shows linked observations.
- [ ] Empty state shown when no Lessons exist.

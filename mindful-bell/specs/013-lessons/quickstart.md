# Lessons Quickstart Guide

## Quick Setup

### 1. Database Schema Setup
```sql
-- Create lessons table
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  encrypted_content BLOB,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL
);

-- Create lesson-observation linking table
CREATE TABLE lesson_observations (
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  observation_id TEXT REFERENCES observations(id) ON DELETE CASCADE,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (lesson_id, observation_id)
);

-- Create FTS table for lesson search
CREATE VIRTUAL TABLE lessons_fts USING fts5(
  title, content,
  content='lessons',
  content_rowid='rowid'
);

-- Performance indexes
CREATE INDEX idx_lessons_created_at ON lessons(created_at);
CREATE INDEX idx_lessons_deleted_at ON lessons(deleted_at);
CREATE INDEX idx_lesson_observations_lesson_id ON lesson_observations(lesson_id);
CREATE INDEX idx_lesson_observations_observation_id ON lesson_observations(observation_id);
```

### 2. Test Data Setup
```typescript
// Create sample observations to link to lessons
const sampleObservations = [
  { id: 'obs1', type: 'fear', content: 'Anxious about presentation tomorrow #work' },
  { id: 'obs2', type: 'desire', content: 'Want to be more confident #confidence' },
  { id: 'obs3', type: 'affliction', content: 'Feeling overwhelmed by workload #stress #work' }
];

// Create test lesson with links
const testLesson = {
  title: 'Learning to Manage Work Anxiety',
  content: 'I notice that my work anxiety often peaks before presentations. The pattern is: fear about performance, desire for confidence, then feeling overwhelmed. I\'m learning that preparation helps, but also accepting that some nervousness is normal.',
  observationIds: ['obs1', 'obs2', 'obs3']
};
```

## Core Functionality Validation

### 1. Lesson Creation Workflows

**From Observation Detail**:
- [ ] Open specific observation
- [ ] Tap "Create Lesson" button
- [ ] Verify observation is pre-linked
- [ ] Title auto-suggested from observation content
- [ ] Save lesson and verify link persists

**From Multiple Observations**:
- [ ] Select 2-3 related observations in list view
- [ ] Tap "Create Lesson from Selected"
- [ ] Verify all observations pre-linked
- [ ] Write synthesis lesson content
- [ ] Check all links maintained after save

**Standalone Creation**:
- [ ] Navigate to Lessons tab
- [ ] Tap "+" to create new lesson
- [ ] Write lesson content with insights
- [ ] Use search to find and link relevant observations
- [ ] Verify search finds observations by content and tags

**From Bell Acknowledgment**:
- [ ] Acknowledge test bell
- [ ] Select "I learned something" option
- [ ] Create lesson directly from bell context
- [ ] Verify bell event context preserved

### 2. Content Management

**Basic CRUD Operations**:
```typescript
// Create lesson
const lesson = await createLesson({
  title: 'Mindfulness Insight',
  content: 'Today I realized that my fear of failure is often worse than actual failure itself.',
  observationIds: ['obs1', 'obs2']
});

// Update lesson
await updateLesson(lesson.id, {
  content: lesson.content + ' This understanding helps me take more risks.'
});

// Verify observation links persist through updates
const updated = await getLesson(lesson.id, { includeObservations: true });
assert(updated.linkedObservations.length === 2);
```

**Soft Delete and Restore**:
- [ ] Delete lesson (soft delete)
- [ ] Verify appears in "Recently Deleted"
- [ ] Restore within timeout period
- [ ] Check all observation links restored
- [ ] Test permanent deletion after timeout

### 3. Observation Linking System

**Link Management**:
- [ ] Create lesson with initial observations linked
- [ ] Add more observations via lesson edit screen
- [ ] Remove specific observation links
- [ ] Verify broken links handled gracefully when observation deleted

**Link Resilience**:
```typescript
// Test link behavior when observation deleted
const lesson = await createLesson({
  content: 'Test lesson',
  observationIds: ['obs1', 'obs2']
});

// Delete one linked observation
await deleteObservation('obs1', { permanent: true });

// Verify lesson still shows remaining links
const updated = await getLesson(lesson.id);
assert(updated.linkedObservations.length === 1);
assert(updated.brokenLinks.length === 1);
assert(updated.brokenLinks[0].reason === 'deleted');
```

**Smart Suggestions**:
- [ ] Write lesson content about anxiety
- [ ] Check API suggests relevant observations with anxiety tags
- [ ] Verify suggestions ranked by relevance and recency
- [ ] Test semantic similarity (anxiety → stress → worry)

### 4. Search and Discovery

**Full-Text Search**:
- [ ] Search lesson content: "anxiety presentation"
- [ ] Search lesson titles: "work stress"
- [ ] Search across linked observation content
- [ ] Verify results ranked by relevance and recency

**Filtering Options**:
```typescript
const filterTests = [
  {
    filter: { observationType: ['fear'] },
    description: 'Lessons linked to fear observations'
  },
  {
    filter: { dateFrom: '2025-01-01', dateTo: '2025-01-31' },
    description: 'Lessons from January'
  },
  {
    filter: { linkedToObservation: 'obs1' },
    description: 'Lessons linked to specific observation'
  }
];

for (const test of filterTests) {
  const results = await listLessons(test.filter);
  // Verify filtering works correctly
}
```

**Discovery Features**:
- [ ] "Related Lessons" suggestions based on content similarity
- [ ] "From Similar Observations" recommendations
- [ ] "Lessons Like This" when viewing lesson details
- [ ] Anniversary reminders for meaningful lessons

### 5. AI-Assisted Features

**Pattern Recognition**:
```typescript
// Test pattern detection across observations
const suggestions = await getLessonSuggestions({
  observationIds: ['obs1', 'obs2', 'obs3']
});

// Verify useful patterns detected
assert(suggestions.patterns.some(p => p.type === 'temporal'));
assert(suggestions.patterns.some(p => p.type === 'thematic'));
assert(suggestions.titleSuggestions.length > 0);
assert(suggestions.writingPrompts.length > 0);
```

**Smart Suggestions**:
- [ ] Title generation from lesson content
- [ ] Writing prompts for deeper reflection
- [ ] Related observation suggestions while writing
- [ ] Theme extraction across multiple lessons

**Privacy Validation**:
- [ ] Verify all AI processing happens locally
- [ ] Check no content sent to external services
- [ ] Test AI features can be disabled
- [ ] Confirm transparent pattern explanations

### 6. Export and Sharing

**Export Formats**:
```typescript
const exportTests = [
  {
    format: 'pdf',
    options: { templateStyle: 'journal', includeObservations: true },
    expectedFeatures: ['elegant formatting', 'linked observations', 'metadata']
  },
  {
    format: 'txt',
    options: { anonymize: true },
    expectedFeatures: ['plain text', 'removed personal details']
  },
  {
    format: 'json',
    options: { includeMetadata: true },
    expectedFeatures: ['complete data', 'relationships preserved']
  },
  {
    format: 'epub',
    options: { templateStyle: 'formal' },
    expectedFeatures: ['e-reader compatible', 'chapters by date']
  }
];
```

**Privacy Controls**:
- [ ] Export requires user authentication
- [ ] Anonymization removes personal identifiers
- [ ] Export files auto-delete after timeout
- [ ] Clear warnings about unencrypted formats

## Performance and Scale Testing

### Large Dataset Performance
```typescript
// Create realistic lesson dataset
const generateTestLessons = async (count = 100) => {
  const lessons = [];
  for (let i = 0; i < count; i++) {
    lessons.push(await createLesson({
      title: `Lesson ${i}: Test Insight`,
      content: `This is test lesson content ${i} with various insights about mindfulness and awareness. ${Math.random() > 0.5 ? '#anxiety' : '#peace'} ${Math.random() > 0.5 ? '#work' : '#home'}`,
      observationIds: getRandomObservationIds(2, 5)
    }));
  }
  return lessons;
};

// Performance benchmarks
const benchmarks = {
  search: 'Full-text search < 200ms',
  list: 'List with pagination < 100ms',
  create: 'Lesson creation < 50ms',
  link: 'Observation linking < 30ms',
  export: 'PDF export < 2s for 100 lessons'
};
```

### Memory Management
- [ ] Monitor memory during large lesson operations
- [ ] Verify no memory leaks during navigation
- [ ] Check encryption/decryption doesn't accumulate plaintext
- [ ] Test with 500+ lessons and 1000+ observation links

### UI Responsiveness
- [ ] List scrolling smooth with 100+ lessons
- [ ] Search results appear as user types
- [ ] Lesson detail view loads quickly
- [ ] Observation linking interface responsive

## Real-World Usage Scenarios

### Week 1: Basic Usage
- [ ] Create 3-5 lessons from observations
- [ ] Practice linking observations to lessons
- [ ] Use search to find previous lessons
- [ ] Test export for backup

### Month 1: Pattern Recognition
- [ ] Accumulate 20+ lessons
- [ ] Review AI-suggested patterns
- [ ] Use anniversary reminders
- [ ] Create lessons from observation groups

### Quarter 1: Advanced Features
- [ ] Build lesson collection of 50+ entries
- [ ] Test performance with realistic data volume
- [ ] Use export for sharing with therapist/coach
- [ ] Validate long-term data integrity

## Edge Cases and Error Handling

### Data Integrity
```typescript
const edgeCases = [
  {
    case: 'Empty content',
    input: { content: '' },
    expectedError: 'Content required'
  },
  {
    case: 'Content too long',
    input: { content: 'x'.repeat(5001) },
    expectedError: 'Content exceeds maximum length'
  },
  {
    case: 'Invalid observation IDs',
    input: { observationIds: ['invalid-id'] },
    expectedBehavior: 'Ignore invalid IDs, proceed with valid ones'
  },
  {
    case: 'Circular references',
    input: { lessonId: 'lesson1', observationIds: ['obs1'] },
    note: 'Lesson links to observation, observation created from lesson'
  }
];
```

### Database Corruption
- [ ] Test recovery from corrupted lesson data
- [ ] Verify graceful handling of broken observation links
- [ ] Check app behavior with missing FTS index
- [ ] Test backup/restore procedures

### Device Limitations
- [ ] Test on device with limited storage
- [ ] Verify behavior when encryption key unavailable
- [ ] Check handling of very long lessons (5000 chars)
- [ ] Test app kill during lesson save

## Success Criteria

✅ **Lessons feature is successful when**:
- Users can create meaningful lessons from their observations
- Linking system helps users see patterns across their practice
- Search enables discovery of past insights and wisdom
- AI assistance provides value without being intrusive
- Export functionality supports sharing and backup needs
- Performance remains excellent with realistic data volumes
- Privacy controls ensure user data remains secure
- Interface supports contemplative writing and reflection

This validates the lessons system helps users synthesize insights from their mindfulness practice, creating a valuable repository of personal wisdom and growth.
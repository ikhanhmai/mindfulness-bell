# Observations Quickstart Guide

## Quick Setup

### 1. Enable Observation Features
```typescript
// App configuration
const observationConfig = {
  enableEncryption: true,
  maxContentLength: 2000,
  enableTags: true,
  enableSearch: true,
  softDeleteTimeoutSeconds: 300, // 5 minutes undo window
};
```

### 2. Initialize Database Schema
```sql
-- Create observations table with encryption support
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('desire', 'fear', 'affliction')),
  content TEXT NOT NULL,
  encrypted_content BLOB,
  tags TEXT, -- JSON array
  bell_event_id TEXT REFERENCES bell_events(id),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL
);

-- Create FTS table for search
CREATE VIRTUAL TABLE observations_fts USING fts5(
  content, tags,
  content='observations',
  content_rowid='rowid'
);

-- Create indexes for performance
CREATE INDEX idx_observations_type ON observations(type);
CREATE INDEX idx_observations_created_at ON observations(created_at);
CREATE INDEX idx_observations_deleted_at ON observations(deleted_at);
```

## Core Functionality Validation

### 1. Quick Capture Flow
**Test from Home Screen**:
- [ ] Tap "Quick Capture" button
- [ ] Select observation type (Desire/Fear/Affliction)
- [ ] Enter content with hashtags: "Feeling anxious about #work #deadline"
- [ ] Tap Save
- [ ] Verify observation appears in list with auto-extracted tags

**Test from Bell Acknowledgment**:
- [ ] Trigger test bell notification
- [ ] Tap "Add Note" from acknowledgment screen
- [ ] Create observation and link to bell event
- [ ] Verify `bell_event_id` is populated correctly

### 2. Content Management
**Create Observation**:
```typescript
const testObservation = {
  type: 'fear',
  content: 'Worried about upcoming presentation #work #anxiety',
  tags: ['presentation', 'public-speaking'], // explicit tags
  bellEventId: null
};

// Should auto-extract #work and #anxiety from content
// Final tags: ['work', 'anxiety', 'presentation', 'public-speaking']
```

**Edit Observation**:
- [ ] Select existing observation
- [ ] Modify content and tags
- [ ] Save changes
- [ ] Verify `updated_at` timestamp changes
- [ ] Check tags are re-extracted from new content

**Delete and Restore**:
- [ ] Delete observation (soft delete)
- [ ] Verify appears in "Recently Deleted" view
- [ ] Restore within 5-minute timeout
- [ ] Verify observation returns to main list
- [ ] Test permanent deletion after timeout

### 3. Search and Filtering
**Text Search**:
- [ ] Search for "anxiety" - should match content
- [ ] Search for "#work" - should match tags
- [ ] Search for partial words - should use stemming
- [ ] Verify search results ranked by relevance

**Filter Testing**:
```typescript
const filterTests = [
  { type: ['desire'], expectedCount: 5 },
  { tags: ['work'], expectedCount: 8 },
  { dateFrom: '2025-01-01', dateTo: '2025-01-31', expectedCount: 12 },
  { search: 'anxious', type: ['fear'], expectedCount: 3 }
];

filterTests.forEach(test => {
  // Apply filters and verify results
});
```

**Performance Testing**:
- [ ] Create 1000+ test observations
- [ ] Verify search completes in <200ms
- [ ] Test pagination with 50 items per page
- [ ] Check memory usage remains stable during scrolling

### 4. Tagging System
**Auto-tag Extraction**:
- [ ] Enter: "Feeling stressed about #work deadline tomorrow"
- [ ] Verify extracts: ['work']
- [ ] Check word frequency for auto-suggestions

**Tag Suggestions**:
- [ ] Start typing "wor" in tag field
- [ ] Verify auto-completion shows "work" (if used before)
- [ ] Test suggestion ranking by frequency and recency

**Tag Management**:
- [ ] View all tags with usage counts
- [ ] Merge similar tags (e.g., "work" and "job")
- [ ] Rename tag across all observations
- [ ] Delete unused tags

### 5. Data Encryption
**Encryption Validation**:
```typescript
// Test encryption/decryption cycle
const plaintext = "Very personal observation content";
const encrypted = await encryptContent(plaintext, entryId);
const decrypted = await decryptContent(encrypted, entryId);
assert(decrypted === plaintext);

// Verify database stores encrypted content
const dbRow = await db.get('SELECT encrypted_content FROM observations WHERE id = ?', entryId);
assert(dbRow.encrypted_content !== plaintext);
```

**Key Management**:
- [ ] Verify master key stored securely in keystore
- [ ] Test key derivation for different entries
- [ ] Check app reinstall generates new keys
- [ ] Verify old data becomes unreadable after key change

### 6. Export Functionality
**Export Formats**:
```typescript
const exportTests = [
  {
    format: 'json',
    filters: { types: ['fear'] },
    expectedFields: ['id', 'type', 'content', 'tags', 'createdAt']
  },
  {
    format: 'csv',
    filters: { dateFrom: '2025-01-01' },
    expectedColumns: ['Type', 'Content', 'Tags', 'Created At']
  },
  {
    format: 'txt',
    options: { anonymize: true },
    expectedAnonymization: true
  }
];
```

**Privacy Protection**:
- [ ] Test anonymization removes personal identifiers
- [ ] Verify encrypted export requires password
- [ ] Check export files auto-delete after timeout
- [ ] Confirm export requires user authentication

## Performance Benchmarks

### Database Performance
```typescript
// Benchmark key operations
const benchmarks = {
  insert: async () => {
    const start = performance.now();
    await createObservation(testData);
    return performance.now() - start;
  },
  search: async () => {
    const start = performance.now();
    await searchObservations('anxiety work');
    return performance.now() - start;
  },
  filter: async () => {
    const start = performance.now();
    await listObservations({ type: ['fear'], limit: 50 });
    return performance.now() - start;
  }
};

// Target performance:
// Insert: < 50ms
// Search: < 200ms
// Filter: < 100ms
```

### Memory Usage
- [ ] Monitor memory during large dataset operations
- [ ] Verify no memory leaks during navigation
- [ ] Check encryption/decryption doesn't accumulate plaintext
- [ ] Test with 10,000+ observations

### UI Responsiveness
- [ ] List scrolling remains smooth with 1000+ items
- [ ] Search input shows results as user types
- [ ] No frame drops during animations
- [ ] Quick capture opens in <100ms

## Real-World Testing Scenarios

### Day 1-3: Basic Usage
- [ ] Create 5-10 observations daily
- [ ] Use mix of types (desire/fear/affliction)
- [ ] Include observations from bell acknowledgments
- [ ] Practice search and filtering

### Week 1: Pattern Recognition
- [ ] Review observations by tag frequency
- [ ] Identify most common observation types
- [ ] Test search for recurring themes
- [ ] Use export to analyze patterns externally

### Month 1: Large Dataset
- [ ] Accumulate 100+ observations
- [ ] Test performance with realistic data volume
- [ ] Verify search quality with diverse content
- [ ] Check tag suggestions improve with usage

## Edge Cases and Error Handling

### Content Validation
```typescript
const edgeCases = [
  { content: '', expectedError: 'Content required' },
  { content: 'x'.repeat(2001), expectedError: 'Content too long' },
  { type: 'invalid', expectedError: 'Invalid observation type' },
  { tags: [''], expectedError: 'Empty tags not allowed' }
];
```

### Database Corruption
- [ ] Test recovery from corrupted SQLite file
- [ ] Verify graceful handling of encryption key loss
- [ ] Check app behavior with missing FTS index
- [ ] Test backup/restore procedures

### Device Limitations
- [ ] Test on device with limited storage
- [ ] Verify behavior when keystore unavailable
- [ ] Check handling of device time changes
- [ ] Test app kill during write operations

## Success Criteria

✅ **Observations feature is successful when**:
- Users can create observation in ≤3 taps from any screen
- Search returns relevant results in <200ms with 1000+ observations
- Content encryption provides meaningful privacy protection
- Tag system reduces typing and improves organization
- Export functionality enables complete data portability
- No data loss occurs during normal usage scenarios
- Performance remains responsive with realistic data volumes
- UI language supports rather than judges emotional content

This validates the observations system provides a safe, private space for mindfulness self-reflection while maintaining excellent performance and usability.
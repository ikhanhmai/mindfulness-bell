# Observations Research

## Data Storage Strategy

**Decision**: SQLite with local encryption for sensitive content
**Rationale**:
- Personal observations may contain very sensitive emotional content
- Users need complete data ownership and privacy
- Fast local search and filtering capabilities required
- Offline-first architecture requires local database

**Schema Design**:
```sql
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('desire', 'fear', 'affliction')),
  content TEXT NOT NULL,
  encrypted_content BLOB,  -- encrypted version of content
  tags TEXT,  -- JSON array of tag strings
  bell_event_id TEXT REFERENCES bell_events(id),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL  -- soft delete
);
```

**Alternatives Considered**:
- Cloud storage with encryption (rejected: offline-first requirement)
- Plain text storage (rejected: privacy concerns)
- Separate table for tags (rejected: unnecessary complexity for use case)

## Search and Filtering

**Decision**: SQLite FTS (Full-Text Search) with custom tokenization
**Rationale**:
- Fast text search across content and tags
- Supports fuzzy matching for typos
- Works completely offline
- Good performance even with thousands of entries

**Implementation**:
- FTS virtual table for content search
- Combined search across content and tags
- Stemming for better match quality
- Ranking by relevance and recency

**Search Features**:
- Text search: "anxiety work"
- Tag filtering: #work #morning
- Type filtering: desires only
- Date range filtering: last week
- Combined filters: text + type + date

**Alternatives Considered**:
- Simple LIKE queries (rejected: poor performance on large datasets)
- External search engine (rejected: offline requirement)
- Client-side JavaScript filtering (rejected: doesn't scale)

## Content Encryption

**Decision**: AES-256-GCM with device keystore
**Rationale**:
- Observations often contain deeply personal content
- Protection against device theft or forensic analysis
- Minimal performance impact for typical usage
- Platform-standard encryption methods

**Key Management**:
- Master key stored in device secure keystore (iOS Keychain, Android Keystore)
- Per-entry encryption keys derived from master key + entry ID
- Automatic key rotation on app reinstall
- No key recovery mechanism (privacy over convenience)

**Implementation**:
- Encrypt content before SQLite storage
- Decrypt only for display/editing
- Search works on encrypted content via FTS indexing of decrypted content
- Metadata (type, timestamps, tags) remain unencrypted for filtering

**Alternatives Considered**:
- No encryption (rejected: privacy risk)
- App-level passcode (rejected: UX friction)
- Server-side encryption (rejected: offline-first requirement)

## Tagging System

**Decision**: Flexible hashtag-style tags with auto-completion
**Rationale**:
- Users naturally organize thoughts with contextual labels
- Hashtag pattern familiar from social media
- Auto-completion reduces typing and ensures consistency
- Simple to implement and understand

**Tag Features**:
- Inline hashtags within content: "Feeling anxious about #work #presentation"
- Suggested tags based on content analysis
- Tag frequency tracking for popular suggestions
- Tag merging/renaming capabilities

**Auto-tagging**:
- Time-based: #morning #evening #weekend
- Location-based: #home #office (if permission granted)
- Emotion detection: #anxiety #excitement #sadness
- Pattern recognition: frequent words become tag suggestions

**Alternatives Considered**:
- Predefined tag categories (rejected: limits user expression)
- Separate tag input field (rejected: workflow friction)
- No tagging system (rejected: limits organization capabilities)

## User Experience Design

**Decision**: Supportive, non-judgmental interface with gentle language
**Rationale**:
- Observations often involve difficult emotions
- Interface should encourage honest self-reflection
- Reduce shame or judgment around negative emotions
- Support mindfulness practice rather than emotional analysis

**Language Principles**:
- "Notice" instead of "record" or "log"
- "Observe" instead of "analyze" or "judge"
- "Present moment" instead of "current state"
- "Acknowledge" instead of "admit" or "confess"

**Visual Design**:
- Calm, neutral colors (soft blues, grays)
- Generous whitespace to avoid overwhelming
- Gentle transitions and animations
- Clear hierarchy without harsh contrasts

**Empty States**:
- "Take a breath. Nothing here yet."
- "Your observations will appear here as you notice them."
- "When you're ready, tap + to notice what's present."

**Alternatives Considered**:
- Clinical/therapeutic language (rejected: too formal)
- Motivational/coaching language (rejected: can create pressure)
- Purely neutral language (rejected: misses supportive opportunity)

## Performance Optimization

**Decision**: Lazy loading with intelligent prefetching
**Rationale**:
- Users may accumulate thousands of observations over time
- Initial app load should be fast
- List scrolling should remain smooth
- Search results should appear quickly

**Optimization Strategies**:
- Virtual scrolling for large lists
- Pagination with 50 items per page
- Image/rich content lazy loading
- Background prefetch of next page while user reads
- Aggressive caching of recent searches

**Database Optimization**:
- Indexes on frequently queried columns (type, created_at, tags)
- Compound index for common filter combinations
- VACUUM operation during background maintenance
- Statistics tracking for query optimization

**Memory Management**:
- Release decrypted content after view dismissal
- Limit in-memory observation cache (100 entries max)
- Background cleanup of unused resources
- Monitoring for memory leaks in development

**Alternatives Considered**:
- Load all data upfront (rejected: poor performance with large datasets)
- Server-side pagination (rejected: offline requirement)
- No optimization (rejected: poor user experience)

## Data Export and Backup

**Decision**: User-controlled export in multiple formats
**Rationale**:
- Users own their personal data
- Enable backup before app deletion
- Support data portability to other systems
- Privacy-first approach means no automatic cloud backup

**Export Formats**:
- JSON: Complete data with metadata
- CSV: Tabular format for spreadsheet analysis
- Plain text: Human-readable format
- Encrypted archive: Secure backup with password

**Export Options**:
- All observations
- Date range selection
- Filtered by type or tags
- Include/exclude deleted entries

**Privacy Considerations**:
- Export requires user authentication
- Clear warnings about unencrypted formats
- Option to exclude sensitive content
- Automatic deletion of export files after sharing

**Alternatives Considered**:
- Automatic cloud backup (rejected: privacy concerns)
- No export capability (rejected: data ownership principle)
- Server-side export processing (rejected: offline-first requirement)
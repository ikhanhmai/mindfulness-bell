# Random Bell Research

## Bell Scheduling Algorithm

**Decision**: Poisson distribution with minimum interval constraints
**Rationale**:
- Provides truly random intervals that feel natural
- Avoids predictable patterns that users might anticipate
- Allows for density control through rate parameter adjustment
- Mathematically sound approach for random event scheduling

**Implementation**:
- Low density: λ = 4 bells/day (6-hour average interval)
- Medium density: λ = 8 bells/day (3-hour average interval)
- High density: λ = 12 bells/day (2-hour average interval)
- Minimum interval: 45 minutes between bells
- Rejection sampling to enforce minimum intervals

**Alternatives Considered**:
- Fixed intervals with random jitter (rejected: too predictable)
- Pure uniform random (rejected: can create clustering)
- Exponential distribution (rejected: potential for very long gaps)

## iOS Notification Limits

**Decision**: Rolling window notification management
**Rationale**:
- iOS limits pending notifications to 64 per app
- Need to schedule bells efficiently without hitting limits
- Cancel expired notifications to free up slots

**Strategy**:
- Schedule 7 days of bells at most (≈84 bells at high density)
- Daily cleanup job removes expired notifications
- Priority system: today > tomorrow > future days
- Fallback: reduce to 3-day window if still hitting limits

**Alternatives Considered**:
- Daily scheduling only (rejected: unreliable if app not opened)
- Server-based scheduling (rejected: offline-first requirement)
- Reduce density automatically (rejected: user preference override)

## Random Generation Quality

**Decision**: Crypto.getRandomValues() for randomness source
**Rationale**:
- Cryptographically secure random numbers
- Available in React Native through polyfills
- Prevents predictable patterns from weak PRNGs
- Important for genuine randomness experience

**Validation**:
- Statistical tests for uniform distribution
- Chi-square test for interval distribution
- Manual testing for "feeling random" to users

**Alternatives Considered**:
- Math.random() (rejected: predictable patterns possible)
- Device sensors for entropy (rejected: unnecessary complexity)
- External randomness API (rejected: offline requirement)

## Notification Sound Design

**Decision**: Short, gentle bell tones with fade-in/out
**Rationale**:
- Supports mindfulness rather than startling users
- Multiple sound options for personalization
- Consistent with meditation app conventions
- Good accessibility for hearing-impaired users

**Sound Characteristics**:
- Duration: 2-4 seconds maximum
- Frequency: 200-800 Hz (pleasant bell range)
- Volume: Respects system notification volume
- Format: High-quality compressed audio (AAC/MP3)

**Alternatives Considered**:
- System notification sounds (rejected: not mindful enough)
- Long meditation bells (rejected: too disruptive)
- Silent notifications only (rejected: defeats purpose)

## Background Processing

**Decision**: Expo TaskManager for background scheduling
**Rationale**:
- Handles iOS/Android background execution differences
- Reliable for daily scheduling tasks
- Minimizes battery impact through efficient scheduling
- Good integration with notification system

**Background Tasks**:
- Daily bell schedule generation (5-minute window)
- Cleanup expired notifications
- Update statistics counters
- Sync device time changes

**Alternatives Considered**:
- React Native Background Job (rejected: more complex setup)
- Push notifications for triggering (rejected: requires server)
- Foreground-only scheduling (rejected: unreliable usage)

## Time Zone Handling

**Decision**: Device local time with automatic adjustment
**Rationale**:
- Users expect bells to respect their current location
- No server dependency for time zone data
- Handles daylight saving time automatically
- Simple implementation with native date APIs

**Edge Cases**:
- Travel across time zones: reschedule bells for new local time
- DST transitions: adjust active windows accordingly
- Manual time changes: detect and reschedule if needed

**Alternatives Considered**:
- UTC-only scheduling (rejected: poor user experience)
- Manual time zone selection (rejected: additional complexity)
- Server-based time sync (rejected: offline requirement)

## Statistics and Analytics

**Decision**: Local-only event tracking with aggregation
**Rationale**:
- Privacy-first approach aligns with constitution
- Rich insights possible without external analytics
- Real-time feedback for user motivation
- No performance impact from network calls

**Metrics Tracked**:
- Bell generation: scheduled, triggered, acknowledged, missed
- Timing accuracy: variance from scheduled times
- User engagement: acknowledgment rates by time of day
- Settings impact: density change effects on usage

**Storage**:
- Aggregate daily/weekly summaries
- Raw events for recent period (30 days)
- Automatic cleanup of old detailed data
- Export capability for user data portability

**Alternatives Considered**:
- Third-party analytics (rejected: privacy violations)
- No analytics at all (rejected: missing optimization opportunities)
- Server-side aggregation (rejected: offline-first principle)

## Testing Strategy

**Decision**: Deterministic testing with time mocking
**Rationale**:
- Random algorithms need reproducible tests
- Time-dependent features require controlled environments
- Edge cases around time zones and DST need coverage

**Test Categories**:
- Unit tests: algorithm correctness with fixed seeds
- Integration tests: notification scheduling with mocked time
- Property tests: statistical distribution validation
- Manual tests: real-world usage scenarios

**Mock Strategy**:
- Deterministic random number generation for tests
- Time travel capabilities for multi-day scenarios
- Notification system mocking for automated testing
- Background task simulation for edge cases

**Alternatives Considered**:
- Real-time testing only (rejected: too slow and flaky)
- Statistical sampling tests (rejected: insufficient coverage)
- Manual testing only (rejected: regression risk)
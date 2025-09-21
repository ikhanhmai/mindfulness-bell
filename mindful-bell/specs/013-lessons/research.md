# Lessons Research

## Data Relationships and Linking

**Decision**: Flexible many-to-many relationship between lessons and observations
**Rationale**:
- Single lesson may synthesize insights from multiple observations
- Single observation might contribute to multiple lessons over time
- Relationships should survive deletion of linked entities
- Support for discovering patterns across observations

**Schema Design**:
```sql
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  encrypted_content BLOB,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL
);

CREATE TABLE lesson_observations (
  lesson_id TEXT REFERENCES lessons(id),
  observation_id TEXT REFERENCES observations(id),
  created_at DATETIME NOT NULL,
  PRIMARY KEY (lesson_id, observation_id)
);
```

**Linking Strategy**:
- Soft references: maintain links even if observations deleted
- Cascade deletion when lesson deleted
- Display "Deleted observation" placeholder for broken links
- Automatic suggestion of related observations based on content similarity

**Alternatives Considered**:
- One-to-many only (rejected: limits insight synthesis)
- Hard foreign key constraints (rejected: breaks when observations deleted)
- Embedding observation content in lessons (rejected: data duplication)

## Content Creation Workflows

**Decision**: Multiple entry points with contextual pre-filling
**Rationale**:
- Users discover insights in different contexts
- Reduce friction by pre-populating relevant information
- Support both spontaneous and reflective lesson creation
- Maintain connection to source observations

**Creation Workflows**:
1. **From Observation Detail**: "What did I learn from this?"
   - Pre-link to current observation
   - Suggest title from observation content
   - Pre-fill with observation summary

2. **From Multiple Observations**: "What pattern do I see?"
   - Multi-select observations in list view
   - Generate lesson connecting common themes
   - Auto-extract shared tags as lesson keywords

3. **Standalone Creation**: "I have an insight"
   - Start from lessons list
   - Search and link observations after writing
   - AI-assisted suggestion of related observations

4. **From Bell Acknowledgment**: "In this moment I realize..."
   - Direct path from bell to lesson creation
   - Link to current observation if created
   - Capture immediate insights

**Alternatives Considered**:
- Single creation flow (rejected: doesn't match natural insight patterns)
- Template-based lessons (rejected: too rigid for personal insights)
- AI-generated lessons (rejected: removes personal reflection value)

## Content Organization and Discovery

**Decision**: Chronological primary view with semantic search
**Rationale**:
- Lessons represent learning journey over time
- Recent insights often most relevant
- Search enables discovery of older wisdom
- Tag-based organization emerges naturally

**Organization Features**:
- Reverse chronological default view
- Full-text search across title and content
- Filter by linked observation types
- "Memories" feature: resurface old lessons on anniversaries
- Related lessons suggestions based on content similarity

**Search Implementation**:
- Same FTS approach as observations
- Search across lesson content and linked observation content
- Ranking by recency and relevance
- "Find lessons about..." natural language queries

**Discovery Patterns**:
- "Lessons like this" recommendations
- "From observations like these" suggestions
- Seasonal/anniversary reminders of past insights
- Progress tracking: how insights evolve over time

**Alternatives Considered**:
- Category-based organization (rejected: insights don't fit rigid categories)
- Alphabetical sorting (rejected: loses temporal context)
- No search (rejected: lessons become harder to find over time)

## Insight Synthesis Tools

**Decision**: Gentle AI assistance for pattern recognition
**Rationale**:
- Help users recognize patterns they might miss
- Reduce effort required for lesson creation
- Maintain user agency in insight formation
- Support learning without replacing reflection

**AI Features**:
- Suggest title from lesson content
- Identify related observations based on semantic similarity
- Highlight recurring themes across observations
- Generate writing prompts for deeper reflection
- Suggest when observations might be ready for lesson synthesis

**Pattern Recognition**:
- Temporal patterns: "You often feel anxious on Monday mornings"
- Contextual patterns: "Work-related fears cluster around presentations"
- Emotional patterns: "Desires often followed by fear observations"
- Growth patterns: "Your responses to work stress have evolved"

**Privacy Preservation**:
- All AI processing happens locally on device
- No content sent to external services
- User can disable all AI features
- Transparent about what patterns are detected

**Alternatives Considered**:
- Cloud-based AI analysis (rejected: privacy concerns)
- No AI assistance (rejected: misses valuable pattern recognition)
- Mandatory AI suggestions (rejected: removes user agency)

## Writing Support and Interface

**Decision**: Minimal, distraction-free writing environment
**Rationale**:
- Lessons require deeper reflection than quick observations
- Interface should support contemplative writing
- Reduce friction while maintaining focus
- Support both brief insights and longer reflections

**Writing Features**:
- Clean, minimal editor with generous whitespace
- Auto-save every few seconds
- Word count and reading time estimates
- Optional title field (auto-generate from content)
- Rich text support for emphasis and structure

**Reflection Prompts**:
- "What did I learn from this?"
- "How might I apply this insight?"
- "What pattern am I noticing?"
- "How has my understanding changed?"
- "What would I tell someone else about this?"

**Writing Assistance**:
- Grammar/spell check
- Readability suggestions
- Tone analysis (ensure supportive, non-judgmental)
- Length guidance (neither too brief nor overwhelming)

**Alternatives Considered**:
- Rich WYSIWYG editor (rejected: too complex for mobile)
- Plain text only (rejected: limits expression)
- Structured templates (rejected: constrains natural reflection)

## Sharing and Export

**Decision**: Private by default with selective sharing options
**Rationale**:
- Lessons often contain deeply personal insights
- Users should control what they share and with whom
- Support for therapeutic/coaching relationships
- Enable community learning while preserving privacy

**Privacy Levels**:
1. **Private**: Only visible to user (default)
2. **Anonymized**: Share insight without personal details
3. **Trusted Circle**: Share with specific people
4. **Community**: Share with app community (if feature enabled)

**Sharing Features**:
- Export individual lessons or collections
- Generate shareable quotes from lessons
- Create anonymized wisdom for community
- Export for journal or therapeutic review

**Export Formats**:
- PDF with elegant formatting for printing
- Text for copying to other apps
- JSON for data backup
- EPUB for e-reader devices

**Alternatives Considered**:
- Social media integration (rejected: too public for personal insights)
- Automatic sharing (rejected: violates privacy-first principle)
- No sharing options (rejected: limits therapeutic and community value)

## Progress Tracking and Growth

**Decision**: Gentle metrics focused on learning rather than productivity
**Rationale**:
- Avoid gamification that could pressure users
- Focus on quality of insight rather than quantity
- Support recognition of personal growth
- Encourage consistent practice without stress

**Growth Metrics**:
- Lessons created over time (trend, not targets)
- Diversity of insight topics
- Connection patterns between observations and lessons
- Evolution of language and perspective
- Depth of reflection (content analysis)

**Progress Visualization**:
- Learning journey timeline
- Insight topic clouds
- Connection maps between observations and lessons
- Personal growth indicators (language becoming more positive/self-aware)

**Reflection Features**:
- Monthly/yearly "looking back" summaries
- Anniversary notifications for significant lessons
- Evolution tracking: how perspectives change over time
- Wisdom compilation: most meaningful insights

**Alternatives Considered**:
- Streak tracking (rejected: creates pressure)
- Public leaderboards (rejected: violates privacy)
- Goal setting (rejected: can create judgment about practice)

## Integration with Mindfulness Practice

**Decision**: Seamless integration with bell system and observations
**Rationale**:
- Lessons represent synthesis of mindfulness practice
- Connect insights to moments of awareness
- Support natural flow from noticing to understanding
- Reinforce mindfulness habits through meaning-making

**Integration Points**:
- Bell acknowledgment can prompt lesson creation
- Observation details suggest lesson creation
- Lessons can reference specific bell events
- Practice statistics include lesson creation

**Mindfulness Features**:
- Gratitude prompts: "What am I grateful to have learned?"
- Compassion reminders: gentle language around difficult insights
- Present moment awareness: date/time context for lessons
- Non-attachment: insights as discoveries, not achievements

**Practice Reinforcement**:
- Lessons remind users of their capacity for awareness
- Growth tracking shows value of mindfulness practice
- Wisdom accumulation motivates continued practice
- Connection to bell moments reinforces habit

**Alternatives Considered**:
- Separate lessons app (rejected: breaks practice integration)
- No connection to bells/observations (rejected: misses synthesis opportunity)
- Mandatory lesson creation (rejected: creates pressure)
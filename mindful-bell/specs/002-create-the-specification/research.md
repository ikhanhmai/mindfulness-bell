# Implementation Research: App Store Publishing with EAS

**Branch**: `002-create-the-specification` | **Date**: 2025-09-27
**Purpose**: Research technical decisions for automated iOS app publishing pipeline

## Research Findings

### EAS Build Configuration

**Decision**: Layered configuration approach with remote credential management
**Rationale**:
- Security: Remote credential management eliminates manual certificate handling
- Scalability: Tiered profiles (development, preview, production) with inheritance
- Performance: Resource class optimization and caching reduce build times
- Compliance: Ensures iOS 18 SDK compatibility required from April 2025

**Alternatives considered**:
- Local credential management (higher security risk)
- Single build profile (less flexibility)
- Self-hosted infrastructure (higher maintenance)

**Implementation**:
```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "large",
        "image": "macos-sonoma-14.6-xcode-16.1"
      }
    }
  }
}
```

### App Store Connect API Authentication

**Decision**: App Store Connect API Key with JWT authentication
**Rationale**:
- Enhanced security: No Apple ID credentials in CI/CD pipeline
- Granular permissions: Role-based access control
- Better rate limiting: Predictable limits with clear headers
- Future-proof: Apple's preferred API-first approach

**Alternatives considered**:
- App Specific Password (less secure, limited audit)
- Individual API keys (limited team support)

**Implementation**:
```json
{
  "submit": {
    "production": {
      "ios": {
        "ascApiKeyPath": "./private_keys/AuthKey_ABC123DEF4.p8",
        "ascApiKeyId": "ABC123DEF4",
        "ascApiKeyIssuerId": "12345678-1234-1234-1234-123456789012"
      }
    }
  }
}
```

### iOS Build Optimization

**Decision**: Multi-layered optimization strategy with EAS Build + Expo Atlas
**Rationale**:
- Bundle size reduction: 75% improvement (80MB → 16MB typical)
- Modern toolchain: Leverages React Compiler and typed routes
- App Store compliance: Meets performance expectations for wellness apps
- User experience: Fast startup times crucial for meditation apps

**Alternatives considered**:
- Metro-only optimization (limited capabilities)
- Alternative bundlers (compatibility issues)
- Manual optimization only (insufficient reduction)

**Implementation**:
```bash
# Environment variables for optimization
EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1
EXPO_UNSTABLE_TREE_SHAKING=1
EXPO_UNSTABLE_ATLAS=true
```

### Apple Wellness App Guidelines

**Decision**: Health & Fitness category with enhanced privacy compliance
**Rationale**:
- Mindfulness apps fall under Health & Fitness category requiring enhanced review
- Mental health sensitivity requires appropriate disclaimers
- 2024-2025 privacy enhancements specifically target health-related apps
- Clear disclaimers protect both developers and users

**Alternatives considered**:
- Lifestyle category (less discoverable, lower regulatory burden)
- Utilities category (minimal compliance but poor fit)

**Implementation requirements**:
- Privacy manifest with API usage declarations
- "Not intended for medical use" disclaimer
- Local data storage preference
- Comprehensive privacy policy
- App Transport Security implementation

## Technical Decisions Summary

| Component | Technology Choice | Key Benefit |
|-----------|------------------|-------------|
| Build System | EAS Build with remote credentials | Security + simplicity |
| Authentication | App Store Connect API Key | Enhanced security + audit |
| Optimization | EAS + Expo Atlas + tree-shaking | 75% bundle size reduction |
| App Category | Health & Fitness | Proper discoverability |
| Data Storage | Local-first with optional cloud | Privacy compliance |
| Privacy | Enhanced with manifest | App Store approval |

## Implementation Priority

1. **Phase 1**: EAS configuration and API key setup
2. **Phase 2**: Build optimization and asset management
3. **Phase 3**: Privacy compliance and App Store metadata
4. **Phase 4**: Automated submission workflow

## Risk Mitigation

- **Build failures**: Implement proper error handling and retry logic
- **App Store rejection**: Follow wellness app guidelines strictly
- **Performance issues**: Use Expo Atlas for bundle analysis
- **Security concerns**: Store API keys securely, never in version control

---
*Research completed: 2025-09-27*
*Next phase: Design and contracts generation*
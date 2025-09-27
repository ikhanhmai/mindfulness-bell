# Quickstart Guide: App Store Publishing with EAS

**Purpose**: End-to-end validation of automated iOS app publishing workflow
**Prerequisites**: Completed implementation of EAS publishing pipeline
**Estimated time**: 30 minutes

## Prerequisites Checklist

- [ ] Apple Developer Account with App Manager access
- [ ] App Store Connect API Key generated and downloaded
- [ ] EAS CLI installed and authenticated
- [ ] iOS app project with valid configuration
- [ ] Git repository with committed changes

## Test Scenarios

### Scenario 1: Development Build (5 minutes)

**Goal**: Verify EAS can build development version for testing

**Steps**:
1. Configure development build profile
```bash
# Verify eas.json configuration
cat eas.json | grep -A 5 "development"

# Expected output: development profile with simulator: true
```

2. Initiate development build
```bash
eas build --platform ios --profile development
```

3. Monitor build progress
```bash
eas build:list --status in-progress
```

**Success Criteria**:
- [ ] Build completes within 10 minutes
- [ ] No configuration errors
- [ ] Simulator build URL generated
- [ ] Build logs show successful compilation

**Validation**:
```bash
# Download and test simulator build
eas build:run --latest --ios-simulator

# Expected: App launches in simulator without crashes
```

### Scenario 2: Production Build with Optimization (10 minutes)

**Goal**: Verify optimized production build generation

**Steps**:
1. Verify production configuration
```bash
# Check production profile settings
cat eas.json | grep -A 10 "production"

# Expected: resourceClass: "large", optimization enabled
```

2. Create production build
```bash
eas build --platform ios --profile production
```

3. Monitor bundle size optimization
```bash
# Enable bundle analysis
EXPO_UNSTABLE_ATLAS=true eas build --platform ios --profile production
```

**Success Criteria**:
- [ ] Build completes within 15 minutes
- [ ] Bundle size < 20MB (optimized)
- [ ] No tree-shaking warnings
- [ ] Source maps generated

**Validation**:
```bash
# Check build artifacts
eas build:show --latest

# Expected fields:
# - applicationArchiveUrl (IPA file)
# - buildSize (< 20MB)
# - sourcemaps available
```

### Scenario 3: App Store Connect Submission (10 minutes)

**Goal**: Verify automated submission to App Store Connect

**Steps**:
1. Configure App Store Connect credentials
```bash
# Verify API key configuration
eas credentials --platform ios

# Expected: API Key ID and Issuer ID configured
```

2. Submit latest build
```bash
eas submit --platform ios --latest
```

3. Monitor submission status
```bash
eas submission:list --platform ios
```

**Success Criteria**:
- [ ] Submission completes within 5 minutes
- [ ] No authentication errors
- [ ] App Store Connect receives build
- [ ] Submission ID returned

**Validation**:
```bash
# Check submission details
eas submission:show --latest

# Expected status: "finished"
# Expected: App Store Connect submission ID
```

### Scenario 4: Metadata Validation (3 minutes)

**Goal**: Verify App Store metadata requirements are met

**Steps**:
1. Validate app metadata
```bash
# Check app.json configuration
cat app.json | grep -A 5 "ios"

# Expected: bundleIdentifier, version, build number
```

2. Verify privacy compliance
```bash
# Check for privacy manifest
ls ios/*/Supporting\ Files/PrivacyInfo.xcprivacy 2>/dev/null || echo "Privacy manifest missing"
```

**Success Criteria**:
- [ ] Bundle identifier matches provisioning profile
- [ ] Version follows semantic versioning
- [ ] Privacy manifest present for wellness app
- [ ] Required metadata fields complete

### Scenario 5: Error Handling (2 minutes)

**Goal**: Verify graceful handling of common failures

**Steps**:
1. Test invalid configuration
```bash
# Temporarily break configuration
cp eas.json eas.json.backup
echo '{"invalid": "json"}' > eas.json

# Attempt build
eas build --platform ios --profile production 2>&1 | grep -i error

# Restore configuration
mv eas.json.backup eas.json
```

**Success Criteria**:
- [ ] Clear error message for invalid configuration
- [ ] Build fails fast (< 30 seconds)
- [ ] Helpful troubleshooting guidance provided

## Environment Validation

### Build Environment Check
```bash
# Verify EAS CLI version
eas --version
# Expected: >= 8.0.0

# Check project configuration
eas config
# Expected: Valid project ID and credentials

# Verify git status
git status
# Expected: Clean working directory or committed changes
```

### Credentials Validation
```bash
# Test API key authentication
eas credentials:show --platform ios
# Expected: Valid API key with App Manager role

# Verify certificates
eas credentials --platform ios --check
# Expected: Valid distribution certificate and provisioning profile
```

## Performance Benchmarks

| Metric | Target | Actual | Status |
|--------|--------|--------|---------|
| Development build time | < 10 min | ___ | ⏳ |
| Production build time | < 15 min | ___ | ⏳ |
| Bundle size (production) | < 20 MB | ___ | ⏳ |
| Submission time | < 5 min | ___ | ⏳ |
| End-to-end workflow | < 30 min | ___ | ⏳ |

## Troubleshooting Common Issues

### Build Failures
```bash
# Check build logs
eas build:logs --latest

# Common fixes:
# 1. Certificate expiry: eas credentials --clear-provisioning-profile
# 2. Bundle ID mismatch: Update app.json bundleIdentifier
# 3. Dependency conflicts: Clear node_modules and reinstall
```

### Submission Failures
```bash
# Check submission logs
eas submission:logs --latest

# Common fixes:
# 1. Invalid metadata: Update app.json with required fields
# 2. API key permissions: Verify App Manager role in App Store Connect
# 3. App Store guidelines: Review rejection reasons
```

### Performance Issues
```bash
# Analyze bundle size
EXPO_UNSTABLE_ATLAS=true expo start
# Navigate to /_expo/atlas to view bundle analysis

# Common optimizations:
# 1. Remove unused dependencies
# 2. Enable tree-shaking: EXPO_UNSTABLE_TREE_SHAKING=1
# 3. Optimize images: npx expo-optimize
```

## Success Validation

**Complete pipeline success requires**:
- [ ] All 5 test scenarios pass
- [ ] Performance benchmarks met
- [ ] No unresolved errors or warnings
- [ ] App appears in App Store Connect TestFlight
- [ ] Build artifacts accessible and valid

## Next Steps After Validation

1. **Production Setup**: Configure production environment variables
2. **CI/CD Integration**: Automate builds with GitHub Actions or similar
3. **Monitoring**: Set up build status notifications
4. **Documentation**: Update team onboarding with workflow steps

---
**Validation Date**: ___________
**Validated By**: ___________
**Build Version**: ___________
**Notes**: ___________
# Core App Quickstart Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Studio (for emulator)
- Expo Go app on physical device (optional)

## Quick Setup

1. **Install dependencies**
   ```bash
   cd mindful-bell
   npm install
   ```

2. **Start development server**
   ```bash
   npx expo start
   ```

3. **Open app**
   - iOS Simulator: Press `i` in terminal
   - Android Emulator: Press `a` in terminal
   - Physical device: Scan QR code with Expo Go app

## Core Features Validation

### 1. First Launch Setup
- [ ] App opens without login screen
- [ ] Notification permission is requested
- [ ] Default settings are applied (9AM-5PM active window, medium density)
- [ ] Database is initialized with empty tables

### 2. Bell Scheduling
- [ ] Open Settings → change bell density to "high"
- [ ] Verify next bell shows on home screen within current active window
- [ ] Check that no bells are scheduled during quiet hours (if configured)

### 3. Quick Capture
- [ ] From home screen, tap "Quick Capture"
- [ ] Select observation type (Desire/Fear/Affliction/Lesson)
- [ ] Enter text and save
- [ ] Verify entry appears in Observations list

### 4. Bell Notification
**Note**: For testing, temporarily set active window to include current time
- [ ] Wait for scheduled bell or trigger manually via debug menu
- [ ] Notification appears with bell sound
- [ ] Tap notification opens quick capture screen
- [ ] Bell is marked as "acknowledged" in database

### 5. Data Persistence
- [ ] Close app completely (not just background)
- [ ] Reopen app
- [ ] Verify all previous entries are still visible
- [ ] Verify bell schedule continues correctly

### 6. Settings Configuration
- [ ] Open Settings screen
- [ ] Modify active windows (e.g., 8AM-6PM)
- [ ] Add quiet hours (e.g., 12PM-1PM lunch break)
- [ ] Change bell density to "low"
- [ ] Toggle sound/vibration settings
- [ ] Verify changes persist after app restart

### 7. Statistics View
- [ ] Open Stats screen
- [ ] Verify counts show:
   - Bells scheduled today
   - Bells acknowledged today
   - Entries created this week
   - Breakdown by observation type
- [ ] Test with different time periods (day/week/month)

## Test Data Setup

For comprehensive testing, create sample data:

```typescript
// Add to debug menu or run in console
const testEntries = [
  { type: 'desire', content: 'Wanting to check phone constantly' },
  { type: 'fear', content: 'Anxiety about upcoming presentation' },
  { type: 'affliction', content: 'Feeling rushed and impatient' },
  { type: 'lesson', content: 'Breathwork helps center me' },
];

testEntries.forEach(entry => {
  // Create entries through normal app flow
});
```

## Performance Validation

### Cold Start Test
- [ ] Force close app
- [ ] Clear from recent apps
- [ ] Launch app and time until home screen appears
- [ ] Should be < 2 seconds on mid-range device

### Memory Usage
- [ ] Monitor memory usage during normal operation
- [ ] Should remain stable over extended use
- [ ] No memory leaks during navigation

### Battery Impact
- [ ] Use app normally for a day with notifications enabled
- [ ] Check battery usage in device settings
- [ ] Should not appear in top battery consumers

## Offline Functionality

- [ ] Enable airplane mode
- [ ] Verify all core features work:
  - Creating/editing/deleting entries
  - Viewing statistics
  - Changing settings
  - Bell scheduling (for next online period)
- [ ] Re-enable connectivity
- [ ] Verify no data loss or corruption

## Common Issues & Solutions

**Bell notifications not appearing**:
- Check notification permissions in device settings
- Verify active window includes current time
- Ensure app is not in "Do Not Disturb" mode

**App crashes on startup**:
- Clear Expo cache: `npx expo start --clear`
- Restart Metro bundler
- Check device logs for specific errors

**Database errors**:
- Clear app data and restart
- Check SQLite schema migrations
- Verify expo-sqlite is properly installed

**Performance issues**:
- Enable Flipper for debugging (development builds)
- Profile with React DevTools
- Check for memory leaks in navigation

## Success Criteria

The quickstart is successful when:
- ✅ App launches in < 2 seconds
- ✅ All 7 validation steps pass
- ✅ Performance metrics are within targets
- ✅ Offline functionality works completely
- ✅ No critical bugs or crashes observed

This validates the core app is ready for daily use and follows the constitutional principles of offline-first, privacy-focused mindfulness support.
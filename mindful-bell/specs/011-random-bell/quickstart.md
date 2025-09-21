# Random Bell Quickstart Guide

## Quick Setup for Testing

### 1. Enable Development Mode
```typescript
// Add to app.config.js or similar
const config = {
  extra: {
    isDevelopment: __DEV__,
    enableBellTesting: true,
  }
};
```

### 2. Configure Test Settings
```typescript
// Test configuration for immediate bell testing
const testSettings = {
  activeWindows: [
    { start: "00:00", end: "23:59" }  // All day for testing
  ],
  quietHours: [],  // No quiet hours during testing
  bellDensity: "high",
  minimumInterval: 1,  // 1 minute for testing
  soundEnabled: true,
  vibrationEnabled: true
};
```

## Core Functionality Validation

### 1. Bell Schedule Generation
```bash
# Test with debug tools or app interface
npx expo start --dev-client
```

**Validation Steps**:
- [ ] Open Settings → Set density to "high"
- [ ] Set active window to current time + 2 hours
- [ ] Verify schedule shows 8-12 bells for today
- [ ] Check no bells scheduled during quiet hours
- [ ] Confirm minimum 45-minute spacing between bells

### 2. Notification Scheduling
**iOS Testing**:
- [ ] Check notification permissions granted
- [ ] Verify pending notifications in device settings
- [ ] Confirm count doesn't exceed 64 notifications
- [ ] Test notification cleanup after expiry

**Android Testing**:
- [ ] Verify notification channel created
- [ ] Check Do Not Disturb settings don't block
- [ ] Test notification priority and sound

### 3. Random Distribution Quality
**Manual Validation**:
- [ ] Generate multiple day schedules
- [ ] Verify bells spread across active windows
- [ ] Check no obvious patterns or clustering
- [ ] Confirm density matches expectations (±20%)

**Statistical Test** (optional):
```typescript
// Generate 100 days of schedules and analyze
const schedules = Array.from({length: 100}, () =>
  generateBellSchedule(date, settings)
);

// Check distribution properties
const intervals = calculateIntervals(schedules);
const avgInterval = intervals.reduce((a,b) => a+b) / intervals.length;
console.log(`Average interval: ${avgInterval} minutes`);
```

### 4. Bell Triggering Flow
**Test Immediate Bell**:
- [ ] Use debug menu to trigger bell now
- [ ] Verify notification appears with sound
- [ ] Tap notification opens quick capture
- [ ] Complete capture flow with observation
- [ ] Check bell marked as "acknowledged" in database

**Test Missed Bell**:
- [ ] Schedule bell and ignore notification
- [ ] Wait for notification to expire
- [ ] Verify bell marked as "missed" after timeout
- [ ] Check stats reflect missed bell count

### 5. Background Processing
**Test Scenarios**:
- [ ] Close app completely, wait for scheduled bell
- [ ] Put app in background, verify bells still trigger
- [ ] Restart device, confirm bells resume after boot
- [ ] Change time zone, verify bells adjust accordingly

### 6. Edge Case Handling

**Time Zone Changes**:
```typescript
// Simulate travel scenario
// 1. Set timezone to EST, generate schedule
// 2. Change device timezone to PST
// 3. Verify bells reschedule for new local time
```

**Daylight Saving Time**:
- [ ] Test schedule generation across DST transition
- [ ] Verify active windows adjust correctly
- [ ] Check no duplicate bells during "fall back"
- [ ] Confirm no missing hour during "spring forward"

**Notification Limits**:
- [ ] Generate maximum bells (high density, 7 days)
- [ ] Verify iOS notification limit respected
- [ ] Test cleanup when approaching limits
- [ ] Confirm graceful degradation if limits hit

## Performance Testing

### 1. Schedule Generation Speed
```typescript
console.time('scheduleGeneration');
const schedule = generateBellSchedule(
  startDate,
  endDate,
  'high',
  activeWindows,
  quietHours
);
console.timeEnd('scheduleGeneration');
// Should complete in < 100ms
```

### 2. Battery Impact
- [ ] Monitor background battery usage over 24 hours
- [ ] Compare with/without bell scheduling enabled
- [ ] Verify minimal impact (< 2% daily battery drain)

### 3. Memory Usage
- [ ] Check memory usage during schedule generation
- [ ] Verify no memory leaks from repeated scheduling
- [ ] Test with maximum bells (1000+ scheduled)

## Real-World Testing

### Day 1: Initial Setup
- [ ] Install app on primary device
- [ ] Configure realistic active windows (e.g., 8AM-9PM)
- [ ] Set quiet hours for sleep (e.g., 10PM-7AM)
- [ ] Choose medium density
- [ ] Use app normally for full day

### Day 2-7: Normal Usage
- [ ] Track bell acknowledgment rate (target >70%)
- [ ] Note any missed bells or technical issues
- [ ] Verify bells feel appropriately random
- [ ] Check notification timing accuracy (±5 minutes)

### Week 2: Advanced Scenarios
- [ ] Travel across time zones
- [ ] Experience DST transition (if applicable)
- [ ] Change density settings mid-week
- [ ] Test during phone restarts/updates

## Common Issues & Debugging

**No bells triggering**:
```bash
# Debug checklist
1. Check notification permissions
2. Verify active window includes current time
3. Check phone's Do Not Disturb settings
4. Confirm app has background refresh enabled
5. Check device storage for database corruption
```

**Bells clustering together**:
```javascript
// Debug schedule generation
const schedule = getStoredSchedule();
const intervals = schedule.map((bell, i, arr) =>
  i > 0 ? bell.time - arr[i-1].time : 0
);
console.log('Intervals (minutes):', intervals.filter(i => i > 0));
// All should be >= minimum interval
```

**Poor randomness**:
```typescript
// Check random number generator
const samples = Array.from({length: 1000}, () => Math.random());
const histogram = createHistogram(samples, 10);
console.log('Distribution:', histogram);
// Should be roughly uniform across bins
```

## Success Criteria

✅ **Random Bell implementation is successful when**:
- Bell notifications trigger within 5 minutes of scheduled time 95% of the time
- Distribution passes visual randomness test (no obvious patterns)
- Battery impact < 2% daily drain on typical devices
- Notification limits never exceeded on iOS
- Background processing works reliably across device restarts
- Time zone changes handled gracefully
- User acknowledgment rate >70% in real-world testing

This validates the random bell system provides the intended mindfulness interruptions while respecting user preferences and device limitations.
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Settings, BellDensity, TimeWindow } from '../types';
import { DatabaseService } from '../services/DatabaseService';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseService.getInstance();
      const currentSettings = await db.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!settings) return;

    try {
      const db = DatabaseService.getInstance();
      const updatedSettings = await db.updateSettings(updates);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleDensityChange = (density: BellDensity) => {
    updateSettings({ bellDensity: density });
  };

  const handleSoundToggle = (enabled: boolean) => {
    updateSettings({ soundEnabled: enabled });
  };

  const handleVibrationToggle = (enabled: boolean) => {
    updateSettings({ vibrationEnabled: enabled });
  };

  const handleTimeWindowEdit = (type: 'active' | 'quiet') => {
    Alert.alert(
      'Time Window',
      `Edit ${type} time windows`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => console.log(`Edit ${type} windows`) }
      ]
    );
  };

  const formatTimeWindows = (windows: TimeWindow[]) => {
    return windows.map(w => `${w.start} - ${w.end}`).join(', ');
  };

  const getDensityDescription = (density: BellDensity) => {
    switch (density) {
      case 'low': return '4 bells per day';
      case 'medium': return '8 bells per day';
      case 'high': return '12 bells per day';
      default: return '';
    }
  };

  if (isLoading || !settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your mindful bell experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bell Schedule</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Bell Density</Text>
          <Text style={styles.settingDescription}>{getDensityDescription(settings.bellDensity)}</Text>
        </View>

        <View style={styles.densityButtons}>
          {(['low', 'medium', 'high'] as BellDensity[]).map(density => (
            <TouchableOpacity
              key={density}
              style={[
                styles.densityButton,
                settings.bellDensity === density && styles.densityButtonActive
              ]}
              onPress={() => handleDensityChange(density)}
            >
              <Text style={[
                styles.densityButtonText,
                settings.bellDensity === density && styles.densityButtonTextActive
              ]}>
                {density.charAt(0).toUpperCase() + density.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Windows</Text>

        <TouchableOpacity
          style={styles.timeWindowItem}
          onPress={() => handleTimeWindowEdit('active')}
        >
          <View>
            <Text style={styles.timeWindowLabel}>Active Hours</Text>
            <Text style={styles.timeWindowValue}>{formatTimeWindows(settings.activeWindows)}</Text>
          </View>
          <Text style={styles.editIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.timeWindowItem}
          onPress={() => handleTimeWindowEdit('quiet')}
        >
          <View>
            <Text style={styles.timeWindowLabel}>Quiet Hours</Text>
            <Text style={styles.timeWindowValue}>{formatTimeWindows(settings.quietHours)}</Text>
          </View>
          <Text style={styles.editIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchLabel}>Sound</Text>
            <Text style={styles.switchDescription}>Play sound with bell notifications</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={settings.soundEnabled ? '#ffffff' : '#ffffff'}
          />
        </View>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchLabel}>Vibration</Text>
            <Text style={styles.switchDescription}>Vibrate device with bell notifications</Text>
          </View>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={handleVibrationToggle}
            trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            thumbColor={settings.vibrationEnabled ? '#ffffff' : '#ffffff'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Privacy</Text>
          <Text style={styles.infoDescription}>All data stays on your device</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  densityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  densityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    alignItems: 'center',
  },
  densityButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  densityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  densityButtonTextActive: {
    color: 'white',
  },
  timeWindowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  timeWindowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  timeWindowValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  editIcon: {
    fontSize: 20,
    color: '#bdc3c7',
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default SettingsScreen;
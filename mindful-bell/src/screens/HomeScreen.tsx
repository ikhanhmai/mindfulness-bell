import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { BellEvent, Observation } from '../types';
import { BellSchedulerService } from '../services/BellSchedulerService';
import { DatabaseService } from '../services/DatabaseService';
import { ObservationForm } from '../components/ObservationForm';
const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [nextBell, setNextBell] = useState<BellEvent | null>(null);
  const [todaysBells, setTodaysBells] = useState<BellEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showObservationForm, setShowObservationForm] = useState(false);

  useEffect(() => {
    loadTodaysSchedule();
  }, []);

  const loadTodaysSchedule = async () => {
    try {
      setIsLoading(true);
      const scheduler = BellSchedulerService.getInstance();
      const db = DatabaseService.getInstance();
      const settings = await db.getSettings();

      const today = new Date();
      const schedule = await scheduler.generateDailySchedule(
        today,
        settings.bellDensity,
        settings.activeWindows,
        settings.quietHours
      );

      setTodaysBells(schedule);

      // Find next bell
      const now = new Date();
      const upcoming = schedule.find(bell => bell.scheduledTime > now);
      setNextBell(upcoming || null);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      Alert.alert('Error', 'Failed to load bell schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCapture = () => {
    setShowObservationForm(true);
  };

  const handleObservationSave = (observation: Observation) => {
    setShowObservationForm(false);
    
    console.log('Observation saved from HomeScreen:', observation);
    
    // Automatically navigate to observations screen
    try {
      router.push('/(tabs)/observations');
      
      // Show brief success toast (non-blocking) - could be implemented with a toast library
      // For now, we'll use a brief console log
      console.log('✅ Navigating to observations screen...');
      
    } catch (error) {
      console.error('Navigation failed:', error);
      
      // Fallback: show alert with manual navigation option
      Alert.alert(
        'Success', 
        `Observation saved successfully!\n\nType: ${observation.type}\nContent: ${observation.content.substring(0, 50)}...`,
        [
          {
            text: 'Stay Here',
            style: 'cancel'
          },
          {
            text: 'View Observations',
            onPress: () => {
              // Retry navigation
              try {
                router.push('/(tabs)/observations');
              } catch (retryError) {
                console.error('Retry navigation failed:', retryError);
                Alert.alert('Note', 'Observation saved! You can view it in the Observations tab.');
              }
            }
          }
        ]
      );
    }
  };

  const handleObservationCancel = () => {
    setShowObservationForm(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m Let's begin your mindful journeys`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mindful Bell</Text>
        <Text style={styles.subtitle}>Present moment awareness</Text>
      </View>

      <View style={styles.nextBellSection}>
        {nextBell ? (
          <>
            <Text style={styles.nextBellLabel}>Next Bell</Text>
            <Text style={styles.nextBellTime}>{formatTime(nextBell.scheduledTime)}</Text>
            <Text style={styles.timeUntil}>in {formatTimeUntil(nextBell.scheduledTime)}</Text>
          </>
        ) : (
          <>
            <Text style={styles.nextBellLabel}>No More Bells Today</Text>
            <Text style={styles.timeUntil}>Practice complete for today</Text>
          </>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Today&apos;s Schedule</Text>
        <Text style={styles.statsText}>{todaysBells.length} bells planned</Text>
      </View>

      <TouchableOpacity style={styles.quickCaptureButton} onPress={handleQuickCapture}>
        <Text style={styles.quickCaptureText}>Quick Capture</Text>
        <Text style={styles.quickCaptureSubtext}>Record an observation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={loadTodaysSchedule}>
        <Text style={styles.refreshText}>Refresh Schedule</Text>
      </TouchableOpacity>

      <Modal
        visible={showObservationForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleObservationCancel}
      >
        <ObservationForm
          onSave={handleObservationSave}
          onCancel={handleObservationCancel}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
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
    fontStyle: 'italic',
  },
  nextBellSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextBellLabel: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  nextBellTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  timeUntil: {
    fontSize: 16,
    color: '#27ae60',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quickCaptureButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickCaptureText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  quickCaptureSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  refreshButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default HomeScreen;
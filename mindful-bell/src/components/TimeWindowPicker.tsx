import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { TimeWindow } from '../types';

interface TimeWindowPickerProps {
  timeWindows: TimeWindow[];
  onTimeWindowsChange: (windows: TimeWindow[]) => void;
  title: string;
  description?: string;
  allowOvernight?: boolean;
  maxWindows?: number;
}

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  selectedTime,
  onTimeSelect,
  onClose
}) => {
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const formatDisplayTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalPlaceholder} />
        </View>

        <FlatList
          data={timeOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.timeOption,
                item === selectedTime && styles.timeOptionSelected
              ]}
              onPress={() => {
                onTimeSelect(item);
                onClose();
              }}
            >
              <Text style={[
                styles.timeOptionText,
                item === selectedTime && styles.timeOptionTextSelected
              ]}>
                {formatDisplayTime(item)}
              </Text>
              <Text style={[
                styles.timeOptionTime,
                item === selectedTime && styles.timeOptionTimeSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

export const TimeWindowPicker: React.FC<TimeWindowPickerProps> = ({
  timeWindows,
  onTimeWindowsChange,
  title,
  description,
  allowOvernight = false,
  maxWindows = 5
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [editingWindowIndex, setEditingWindowIndex] = useState<number>(-1);
  const [selectedTime, setSelectedTime] = useState('09:00');

  const formatDisplayTime = useCallback((time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }, []);

  const validateTimeWindow = useCallback((start: string, end: string): string | null => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

    if (!allowOvernight && endMinutes <= startMinutes) {
      return 'End time must be after start time';
    }

    if (allowOvernight && endMinutes === startMinutes) {
      return 'Start and end times cannot be the same';
    }

    const duration = allowOvernight && endMinutes < startMinutes
      ? (24 * 60 - startMinutes) + endMinutes
      : endMinutes - startMinutes;

    if (duration < 15) {
      return 'Time window must be at least 15 minutes';
    }

    return null;
  }, [allowOvernight]);

  const checkForOverlaps = useCallback((windows: TimeWindow[], excludeIndex = -1): string | null => {
    for (let i = 0; i < windows.length; i++) {
      if (i === excludeIndex) continue;

      for (let j = i + 1; j < windows.length; j++) {
        if (j === excludeIndex) continue;

        const window1 = windows[i];
        const window2 = windows[j];

        const start1 = parseInt(window1.start.split(':')[0]) * 60 + parseInt(window1.start.split(':')[1]);
        const end1 = parseInt(window1.end.split(':')[0]) * 60 + parseInt(window1.end.split(':')[1]);
        const start2 = parseInt(window2.start.split(':')[0]) * 60 + parseInt(window2.start.split(':')[1]);
        const end2 = parseInt(window2.end.split(':')[0]) * 60 + parseInt(window2.end.split(':')[1]);

        // Simple overlap check for same-day windows
        if (start1 < end2 && start2 < end1) {
          return `Time windows overlap: ${formatDisplayTime(window1.start)}-${formatDisplayTime(window1.end)} and ${formatDisplayTime(window2.start)}-${formatDisplayTime(window2.end)}`;
        }
      }
    }

    return null;
  }, [formatDisplayTime]);

  const addTimeWindow = useCallback(() => {
    if (timeWindows.length >= maxWindows) {
      Alert.alert('Limit Reached', `You can only have up to ${maxWindows} time windows.`);
      return;
    }

    const newWindow: TimeWindow = { start: '09:00', end: '17:00' };
    const error = validateTimeWindow(newWindow.start, newWindow.end);

    if (error) {
      Alert.alert('Invalid Time Window', error);
      return;
    }

    const newWindows = [...timeWindows, newWindow];
    const overlapError = checkForOverlaps(newWindows);

    if (overlapError) {
      Alert.alert('Overlapping Windows', overlapError);
      return;
    }

    onTimeWindowsChange(newWindows);
  }, [timeWindows, maxWindows, validateTimeWindow, checkForOverlaps, onTimeWindowsChange]);

  const removeTimeWindow = useCallback((index: number) => {
    Alert.alert(
      'Remove Time Window',
      'Are you sure you want to remove this time window?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newWindows = timeWindows.filter((_, i) => i !== index);
            onTimeWindowsChange(newWindows);
          }
        }
      ]
    );
  }, [timeWindows, onTimeWindowsChange]);

  const editTime = useCallback((windowIndex: number, mode: 'start' | 'end') => {
    const window = timeWindows[windowIndex];
    setEditingWindowIndex(windowIndex);
    setTimePickerMode(mode);
    setSelectedTime(mode === 'start' ? window.start : window.end);
    setShowTimePicker(true);
  }, [timeWindows]);

  const handleTimeSelect = useCallback((time: string) => {
    if (editingWindowIndex === -1) return;

    const currentWindow = timeWindows[editingWindowIndex];
    const newWindow = {
      ...currentWindow,
      [timePickerMode]: time
    };

    const error = validateTimeWindow(newWindow.start, newWindow.end);
    if (error) {
      Alert.alert('Invalid Time Window', error);
      return;
    }

    const newWindows = [...timeWindows];
    newWindows[editingWindowIndex] = newWindow;

    const overlapError = checkForOverlaps(newWindows, editingWindowIndex);
    if (overlapError) {
      Alert.alert('Overlapping Windows', overlapError);
      return;
    }

    onTimeWindowsChange(newWindows);
  }, [editingWindowIndex, timeWindows, timePickerMode, validateTimeWindow, checkForOverlaps, onTimeWindowsChange]);

  const renderTimeWindow = ({ item, index }: { item: TimeWindow; index: number }) => (
    <View style={styles.timeWindowItem}>
      <View style={styles.timeWindowTimes}>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => editTime(index, 'start')}
        >
          <Text style={styles.timeButtonText}>{formatDisplayTime(item.start)}</Text>
        </TouchableOpacity>

        <Text style={styles.timeSeparator}>to</Text>

        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => editTime(index, 'end')}
        >
          <Text style={styles.timeButtonText}>{formatDisplayTime(item.end)}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeTimeWindow(index)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      <FlatList
        data={timeWindows}
        renderItem={renderTimeWindow}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No time windows configured</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[
          styles.addButton,
          timeWindows.length >= maxWindows && styles.addButtonDisabled
        ]}
        onPress={addTimeWindow}
        disabled={timeWindows.length >= maxWindows}
      >
        <Text style={[
          styles.addButtonText,
          timeWindows.length >= maxWindows && styles.addButtonTextDisabled
        ]}>
          + Add Time Window
        </Text>
      </TouchableOpacity>

      <TimePickerModal
        visible={showTimePicker}
        title={`Select ${timePickerMode === 'start' ? 'Start' : 'End'} Time`}
        selectedTime={selectedTime}
        onTimeSelect={handleTimeSelect}
        onClose={() => setShowTimePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  timeWindowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeWindowTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#7f8c8d',
    marginHorizontal: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  addButtonTextDisabled: {
    color: '#ecf0f1',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalPlaceholder: {
    width: 50,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  timeOptionTextSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  timeOptionTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  timeOptionTimeSelected: {
    color: '#1976d2',
  },
});
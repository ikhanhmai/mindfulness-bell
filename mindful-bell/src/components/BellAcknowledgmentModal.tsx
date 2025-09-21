import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { BellEvent, ObservationType } from '../types';
import { useObservations } from '../hooks/useObservations';
import { useBellSchedule } from '../hooks/useBellEvents';

interface BellAcknowledgmentModalProps {
  visible: boolean;
  bellEvent: BellEvent | null;
  onClose: () => void;
  onAcknowledged: (bellEvent: BellEvent, observationCreated?: boolean) => void;
}

export const BellAcknowledgmentModal: React.FC<BellAcknowledgmentModalProps> = ({
  visible,
  bellEvent,
  onClose,
  onAcknowledged
}) => {
  const [observationType, setObservationType] = useState<ObservationType>('lesson');
  const [observationContent, setObservationContent] = useState('');
  const [isCreatingObservation, setIsCreatingObservation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createObservation } = useObservations();
  const { acknowledgeCurrentBell } = useBellSchedule();

  const resetForm = useCallback(() => {
    setObservationType('lesson');
    setObservationContent('');
    setIsCreatingObservation(false);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleAcknowledgeOnly = useCallback(async () => {
    if (!bellEvent) return;

    try {
      setIsSubmitting(true);
      await acknowledgeCurrentBell();
      onAcknowledged(bellEvent, false);
      handleClose();
    } catch (error) {
      console.error('Failed to acknowledge bell:', error);
      Alert.alert('Error', 'Failed to acknowledge bell');
    } finally {
      setIsSubmitting(false);
    }
  }, [bellEvent, acknowledgeCurrentBell, onAcknowledged, handleClose]);

  const handleCreateObservation = useCallback(async () => {
    if (!bellEvent || !observationContent.trim()) return;

    try {
      setIsSubmitting(true);

      // Create observation
      await createObservation(
        observationType,
        observationContent.trim(),
        [],
        bellEvent.id
      );

      // Acknowledge bell
      await acknowledgeCurrentBell();

      onAcknowledged(bellEvent, true);
      handleClose();
    } catch (error) {
      console.error('Failed to create observation:', error);
      Alert.alert('Error', 'Failed to create observation');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    bellEvent,
    observationContent,
    observationType,
    createObservation,
    acknowledgeCurrentBell,
    onAcknowledged,
    handleClose
  ]);

  const getTypeIcon = (type: ObservationType) => {
    switch (type) {
      case 'desire': return '💭';
      case 'fear': return '⚡';
      case 'affliction': return '🌊';
      case 'lesson': return '💡';
      default: return '📝';
    }
  };

  const getTypeColor = (type: ObservationType) => {
    switch (type) {
      case 'desire': return '#e74c3c';
      case 'fear': return '#f39c12';
      case 'affliction': return '#9b59b6';
      case 'lesson': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  const getTypeDescription = (type: ObservationType) => {
    switch (type) {
      case 'desire': return 'Something you want or crave';
      case 'fear': return 'Something you fear or worry about';
      case 'affliction': return 'A difficult emotion or state';
      case 'lesson': return 'An insight or learning';
      default: return '';
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      <Text style={styles.typeSelectorLabel}>What would you like to observe?</Text>
      <View style={styles.typeButtons}>
        {(['desire', 'fear', 'affliction', 'lesson'] as ObservationType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              observationType === type && { backgroundColor: getTypeColor(type) }
            ]}
            onPress={() => setObservationType(type)}
            disabled={isSubmitting}
          >
            <Text style={styles.typeIcon}>{getTypeIcon(type)}</Text>
            <Text style={[
              styles.typeText,
              observationType === type && styles.typeTextSelected
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.typeDescription}>
        {getTypeDescription(observationType)}
      </Text>
    </View>
  );

  if (!visible || !bellEvent) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mindful Bell</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.bellInfo}>
            <Text style={styles.bellIcon}>🔔</Text>
            <Text style={styles.bellMessage}>Take a moment to be present</Text>
            <Text style={styles.bellTime}>
              {bellEvent.scheduledTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acknowledgeButton]}
              onPress={handleAcknowledgeOnly}
              disabled={isSubmitting}
            >
              <Text style={styles.acknowledgeButtonText}>
                {isSubmitting ? 'Acknowledging...' : 'Just Acknowledge'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.observeButton]}
              onPress={() => setIsCreatingObservation(true)}
              disabled={isSubmitting || isCreatingObservation}
            >
              <Text style={styles.observeButtonText}>Capture Observation</Text>
            </TouchableOpacity>
          </View>

          {isCreatingObservation && (
            <View style={styles.observationForm}>
              {renderTypeSelector()}

              <View style={styles.contentInputContainer}>
                <Text style={styles.contentInputLabel}>
                  What did you observe in this moment?
                </Text>
                <TextInput
                  style={styles.contentInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe your observation... (use #hashtags for automatic tagging)"
                  value={observationContent}
                  onChangeText={setObservationContent}
                  maxLength={2000}
                  editable={!isSubmitting}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {observationContent.length}/2000
                </Text>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.backButton]}
                  onPress={() => setIsCreatingObservation(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formButton,
                    styles.saveButton,
                    (!observationContent.trim() || isSubmitting) && styles.saveButtonDisabled
                  ]}
                  onPress={handleCreateObservation}
                  disabled={!observationContent.trim() || isSubmitting}
                >
                  <Text style={[
                    styles.saveButtonText,
                    (!observationContent.trim() || isSubmitting) && styles.saveButtonTextDisabled
                  ]}>
                    {isSubmitting ? 'Saving...' : 'Save & Acknowledge'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
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
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bellInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bellIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  bellMessage: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  bellTime: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  actionButtons: {
    gap: 16,
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  acknowledgeButton: {
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  acknowledgeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  observeButton: {
    backgroundColor: '#3498db',
  },
  observeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  observationForm: {
    flex: 1,
  },
  typeSelectorContainer: {
    marginBottom: 24,
  },
  typeSelectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  typeTextSelected: {
    color: 'white',
  },
  typeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  contentInputContainer: {
    marginBottom: 24,
  },
  contentInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  contentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  saveButtonTextDisabled: {
    color: '#ecf0f1',
  },
});
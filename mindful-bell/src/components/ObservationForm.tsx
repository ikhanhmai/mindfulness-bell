import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Observation, ObservationType } from '../types';
import { useObservations } from '../hooks/useObservations';

interface ObservationFormProps {
  observation?: Observation; // For editing existing observation
  bellEventId?: string; // For creating observation from bell
  onSave?: (observation: Observation) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({
  observation,
  bellEventId,
  onSave,
  onCancel,
  onDelete
}) => {
  const [type, setType] = useState<ObservationType>(observation?.type || 'lesson');
  const [content, setContent] = useState(observation?.content || '');
  const [tags, setTags] = useState<string[]>(observation?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { createObservation, updateObservation, deleteObservation } = useObservations();

  const isEditing = !!observation;

  // Extract hashtags from content automatically
  const extractHashtags = useCallback((text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    return matches.map(tag => tag.substring(1).toLowerCase());
  }, []);

  // Update tags when content changes
  useEffect(() => {
    const extractedTags = extractHashtags(content);
    const manualTags = tags.filter(tag => !extractedTags.includes(tag.toLowerCase()));
    const allTags = [...new Set([...manualTags, ...extractedTags])];
    setTags(allTags);
  }, [content, extractHashtags]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 3) {
      newErrors.content = 'Content must be at least 3 characters';
    } else if (content.trim().length > 2000) {
      newErrors.content = 'Content cannot exceed 2000 characters';
    }

    if (tags.length > 10) {
      newErrors.tags = 'Cannot have more than 10 tags';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [content, tags]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      let savedObservation: Observation;

      if (isEditing && observation) {
        savedObservation = await updateObservation(observation.id, {
          content: content.trim(),
          tags
        });
      } else {
        savedObservation = await createObservation(
          type,
          content.trim(),
          tags,
          bellEventId
        );
      }

      onSave?.(savedObservation);
    } catch (error) {
      console.error('Failed to save observation:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save observation'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    isEditing,
    observation,
    updateObservation,
    createObservation,
    content,
    tags,
    type,
    bellEventId,
    onSave
  ]);

  const handleDelete = useCallback(async () => {
    if (!observation) return;

    Alert.alert(
      'Delete Observation',
      'Are you sure you want to delete this observation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteObservation(observation.id);
              onDelete?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete observation');
            }
          }
        }
      ]
    );
  }, [observation, deleteObservation, onDelete]);

  const addTag = useCallback(() => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags(prev => [...prev, trimmedTag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const getTypeIcon = (obsType: ObservationType) => {
    switch (obsType) {
      case 'desire': return '💭';
      case 'fear': return '⚡';
      case 'affliction': return '🌊';
      case 'lesson': return '💡';
      default: return '📝';
    }
  };

  const getTypeColor = (obsType: ObservationType) => {
    switch (obsType) {
      case 'desire': return '#e74c3c';
      case 'fear': return '#f39c12';
      case 'affliction': return '#9b59b6';
      case 'lesson': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  const getTypeDescription = (obsType: ObservationType) => {
    switch (obsType) {
      case 'desire': return 'Something you want or crave';
      case 'fear': return 'Something you fear or worry about';
      case 'affliction': return 'A difficult emotion or state';
      case 'lesson': return 'An insight or learning';
      default: return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Type Selector */}
          {!isEditing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type of Observation</Text>
              <View style={styles.typeSelector}>
                {(['desire', 'fear', 'affliction', 'lesson'] as ObservationType[]).map((obsType) => (
                  <TouchableOpacity
                    key={obsType}
                    style={[
                      styles.typeOption,
                      type === obsType && {
                        backgroundColor: getTypeColor(obsType),
                        borderColor: getTypeColor(obsType)
                      }
                    ]}
                    onPress={() => setType(obsType)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.typeIcon}>{getTypeIcon(obsType)}</Text>
                    <Text style={[
                      styles.typeText,
                      type === obsType && styles.typeTextSelected
                    ]}>
                      {obsType.charAt(0).toUpperCase() + obsType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.typeDescription}>
                {getTypeDescription(type)}
              </Text>
            </View>
          )}

          {/* Content Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observation</Text>
            <TextInput
              style={[
                styles.contentInput,
                errors.content && styles.inputError
              ]}
              multiline
              numberOfLines={6}
              placeholder="What did you observe? Use #hashtags for automatic tagging..."
              placeholderTextColor="#bdc3c7"
              value={content}
              onChangeText={setContent}
              maxLength={2000}
              editable={!isSubmitting}
              textAlignVertical="top"
            />
            {errors.content && (
              <Text style={styles.errorText}>{errors.content}</Text>
            )}
            <Text style={styles.characterCount}>
              {content.length}/2000
            </Text>
          </View>

          {/* Tags Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>

            {/* Existing Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => removeTag(tag)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Text style={styles.tagRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add New Tag */}
            {tags.length < 10 && (
              <View style={styles.addTagContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add tag..."
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  maxLength={50}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  style={[
                    styles.addTagButton,
                    (!newTag.trim() || tags.length >= 10) && styles.addTagButtonDisabled
                  ]}
                  onPress={addTag}
                  disabled={!newTag.trim() || tags.length >= 10 || isSubmitting}
                >
                  <Text style={styles.addTagButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            {errors.tags && (
              <Text style={styles.errorText}>{errors.tags}</Text>
            )}

            <Text style={styles.tagHint}>
              Tip: Use #hashtags in your observation text for automatic tagging
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isEditing && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isSubmitting}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}

            <View style={styles.primaryActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!content.trim() || isSubmitting) && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={!content.trim() || isSubmitting}
              >
                <Text style={[
                  styles.saveButtonText,
                  (!content.trim() || isSubmitting) && styles.saveButtonTextDisabled
                ]}>
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
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
  contentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: 'white',
    marginRight: 4,
  },
  tagRemove: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  addTagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  tagHint: {
    fontSize: 11,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: 32,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
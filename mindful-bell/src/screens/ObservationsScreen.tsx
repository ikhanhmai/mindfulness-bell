import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Observation, ObservationType } from '../types';
import { ObservationService } from '../services/ObservationService';

export const ObservationsScreen: React.FC = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedType, setSelectedType] = useState<ObservationType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    try {
      setIsLoading(true);
      // For now, we'll simulate loading observations
      // In full implementation, this would call DatabaseService methods
      setObservations([]);
    } catch (error) {
      console.error('Failed to load observations:', error);
      Alert.alert('Error', 'Failed to load observations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadObservations();
    setRefreshing(false);
  };

  const handleCreateObservation = () => {
    Alert.alert('Create Observation', 'This will open the observation form', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => console.log('Navigate to observation form') }
    ]);
  };

  const handleObservationPress = (observation: Observation) => {
    Alert.alert('Observation Details', observation.content, [
      { text: 'Close', style: 'cancel' },
      { text: 'Edit', onPress: () => console.log('Edit observation:', observation.id) }
    ]);
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

  const getTypeIcon = (type: ObservationType) => {
    switch (type) {
      case 'desire': return '💭';
      case 'fear': return '⚡';
      case 'affliction': return '🌊';
      case 'lesson': return '💡';
      default: return '📝';
    }
  };

  const filteredObservations = selectedType === 'all'
    ? observations
    : observations.filter(obs => obs.type === selectedType);

  const renderObservation = ({ item }: { item: Observation }) => (
    <TouchableOpacity style={styles.observationCard} onPress={() => handleObservationPress(item)}>
      <View style={styles.observationHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.contentText} numberOfLines={3}>
        {item.content}
      </Text>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTags}>+{item.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (type: ObservationType | 'all', label: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.filterButton,
        selectedType === type && styles.filterButtonActive
      ]}
      onPress={() => setSelectedType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedType === type && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>No Observations Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start capturing your mindful moments when the bell rings
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateObservation}>
        <Text style={styles.createButtonText}>Create First Observation</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading observations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Observations</Text>
        <Text style={styles.subtitle}>Your mindful insights</Text>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('desire', 'Desires')}
        {renderFilterButton('fear', 'Fears')}
        {renderFilterButton('affliction', 'Afflictions')}
        {renderFilterButton('lesson', 'Lessons')}
      </View>

      {filteredObservations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredObservations}
          renderItem={renderObservation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreateObservation}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
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
    paddingBottom: 20,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  observationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  contentText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  moreTags: {
    fontSize: 12,
    color: '#bdc3c7',
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 100,
  },
});
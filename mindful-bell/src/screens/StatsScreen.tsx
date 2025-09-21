import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ObservationType } from '../types';

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

interface TypeStats {
  type: ObservationType;
  count: number;
  percentage: number;
}

export const StatsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Mock data - in real implementation, this would come from DatabaseService
  const [stats, setStats] = useState({
    totalObservations: 0,
    bellsAcknowledged: 0,
    currentStreak: 0,
    longestStreak: 0,
    averagePerDay: 0,
    typeBreakdown: [] as TypeStats[]
  });

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      // Simulate loading stats
      // In real implementation, would query DatabaseService for statistics

      // Mock data for demonstration
      setStats({
        totalObservations: 24,
        bellsAcknowledged: 18,
        currentStreak: 5,
        longestStreak: 12,
        averagePerDay: 3.4,
        typeBreakdown: [
          { type: 'lesson', count: 10, percentage: 42 },
          { type: 'desire', count: 8, percentage: 33 },
          { type: 'fear', count: 4, percentage: 17 },
          { type: 'affliction', count: 2, percentage: 8 }
        ]
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setIsLoading(false);
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

  const getTypeIcon = (type: ObservationType) => {
    switch (type) {
      case 'desire': return '💭';
      case 'fear': return '⚡';
      case 'affliction': return '🌊';
      case 'lesson': return '💡';
      default: return '📝';
    }
  };

  const renderStatCard = ({ title, value, subtitle, color = '#3498db' }: StatCard) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderPeriodButton = (period: 'week' | 'month' | 'year', label: string) => (
    <TouchableOpacity
      key={period}
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.periodButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTypeBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Observation Types</Text>
      {stats.typeBreakdown.map((item) => (
        <View key={item.type} style={styles.typeItem}>
          <View style={styles.typeHeader}>
            <View style={styles.typeInfo}>
              <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
              <Text style={styles.typeName}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            <View style={styles.typeStats}>
              <Text style={styles.typeCount}>{item.count}</Text>
              <Text style={styles.typePercentage}>{item.percentage}%</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: getTypeColor(item.type)
                }
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice Stats</Text>
        <Text style={styles.subtitle}>Your mindfulness journey</Text>
      </View>

      <View style={styles.periodSelector}>
        {renderPeriodButton('week', 'This Week')}
        {renderPeriodButton('month', 'This Month')}
        {renderPeriodButton('year', 'This Year')}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard({
          title: 'Observations',
          value: stats.totalObservations,
          subtitle: `${stats.averagePerDay} per day`
        })}
        {renderStatCard({
          title: 'Bells Answered',
          value: stats.bellsAcknowledged,
          subtitle: `${Math.round((stats.bellsAcknowledged / (stats.bellsAcknowledged + 6)) * 100)}% response rate`
        })}
        {renderStatCard({
          title: 'Current Streak',
          value: `${stats.currentStreak} days`,
          subtitle: 'Keep it up!'
        })}
        {renderStatCard({
          title: 'Longest Streak',
          value: `${stats.longestStreak} days`,
          subtitle: 'Personal best'
        })}
      </View>

      {stats.typeBreakdown.length > 0 && renderTypeBreakdown()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>🌱</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Growth Pattern</Text>
            <Text style={styles.insightText}>
              You&apos;re capturing more lessons than fears this {selectedPeriod}.
              This suggests growing mindful awareness.
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>🎯</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Response Rate</Text>
            <Text style={styles.insightText}>
              Great job responding to {Math.round((stats.bellsAcknowledged / (stats.bellsAcknowledged + 6)) * 100)}% of bells.
              Each response deepens your practice.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
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
  typeItem: {
    marginBottom: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  typeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  typePercentage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 100,
  },
});
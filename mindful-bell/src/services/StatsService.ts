import { ObservationType } from '../types';
import { DatabaseService } from './DatabaseService';

export interface PracticeStats {
  totalObservations: number;
  bellsScheduled: number;
  bellsAcknowledged: number;
  responseRate: number;
  currentStreak: number;
  longestStreak: number;
  averageObservationsPerDay: number;
}

export interface TypeBreakdown {
  type: ObservationType;
  count: number;
  percentage: number;
}

export interface PeriodStats {
  period: 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  practiceStats: PracticeStats;
  typeBreakdown: TypeBreakdown[];
  dailyBreakdown: Array<{
    date: Date;
    observationCount: number;
    bellsAcknowledged: number;
  }>;
}

export interface TrendData {
  observationTrend: Array<{ date: Date; count: number }>;
  responseTrend: Array<{ date: Date; rate: number }>;
  typeTrend: Array<{ date: Date; type: ObservationType; count: number }>;
}

export class StatsService {
  private static instance: StatsService;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  public async getPracticeStats(
    period: 'week' | 'month' | 'year' = 'week'
  ): Promise<PeriodStats> {
    const { startDate, endDate } = this.getPeriodBounds(period);

    // For now, return mock data
    // In full implementation, these would be actual database queries
    const practiceStats: PracticeStats = {
      totalObservations: 24,
      bellsScheduled: 30,
      bellsAcknowledged: 18,
      responseRate: 0.6,
      currentStreak: 5,
      longestStreak: 12,
      averageObservationsPerDay: 3.4
    };

    const typeBreakdown: TypeBreakdown[] = [
      { type: 'lesson', count: 10, percentage: 42 },
      { type: 'desire', count: 8, percentage: 33 },
      { type: 'fear', count: 4, percentage: 17 },
      { type: 'affliction', count: 2, percentage: 8 }
    ];

    const dailyBreakdown = this.generateMockDailyBreakdown(startDate, endDate);

    return {
      period,
      startDate,
      endDate,
      practiceStats,
      typeBreakdown,
      dailyBreakdown
    };
  }

  public async getTypeBreakdown(
    period: 'week' | 'month' | 'year' = 'week'
  ): Promise<TypeBreakdown[]> {
    const { startDate, endDate } = this.getPeriodBounds(period);

    // In full implementation, this would query the database
    // SELECT type, COUNT(*) as count FROM entries
    // WHERE created_at BETWEEN ? AND ? AND deleted_at IS NULL
    // GROUP BY type

    return [
      { type: 'lesson', count: 10, percentage: 42 },
      { type: 'desire', count: 8, percentage: 33 },
      { type: 'fear', count: 4, percentage: 17 },
      { type: 'affliction', count: 2, percentage: 8 }
    ];
  }

  public async getStreakData(): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{ startDate: Date; endDate: Date; length: number }>;
  }> {
    // In full implementation, this would calculate streaks based on daily practice
    // A streak is maintained if the user acknowledges at least one bell per day

    return {
      currentStreak: 5,
      longestStreak: 12,
      streakHistory: [
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-12'), length: 12 },
        { startDate: new Date('2024-01-15'), endDate: new Date('2024-01-20'), length: 6 },
        { startDate: new Date('2024-01-25'), endDate: new Date('2024-01-29'), length: 5 }
      ]
    };
  }

  public async getTrendData(
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<TrendData> {
    const { startDate, endDate } = this.getPeriodBounds(period);

    // In full implementation, these would be database queries with DATE functions
    return {
      observationTrend: this.generateMockTrend(startDate, endDate, 'observations') as Array<{ date: Date; count: number }>,
      responseTrend: this.generateMockTrend(startDate, endDate, 'response') as Array<{ date: Date; rate: number }>,
      typeTrend: this.generateMockTypeTrend(startDate, endDate)
    };
  }

  public async getResponseRateAnalysis(): Promise<{
    overallRate: number;
    weeklyRates: Array<{ week: Date; rate: number }>;
    timeOfDayAnalysis: Array<{ hour: number; rate: number }>;
    dayOfWeekAnalysis: Array<{ dayOfWeek: number; rate: number }>;
  }> {
    // In full implementation, this would analyze bell_events table
    // JOIN with observations to determine response patterns

    return {
      overallRate: 0.65,
      weeklyRates: [
        { week: new Date('2024-01-01'), rate: 0.7 },
        { week: new Date('2024-01-08'), rate: 0.6 },
        { week: new Date('2024-01-15'), rate: 0.65 }
      ],
      timeOfDayAnalysis: [
        { hour: 9, rate: 0.8 },
        { hour: 12, rate: 0.6 },
        { hour: 15, rate: 0.7 },
        { hour: 18, rate: 0.5 }
      ],
      dayOfWeekAnalysis: [
        { dayOfWeek: 1, rate: 0.7 }, // Monday
        { dayOfWeek: 2, rate: 0.65 },
        { dayOfWeek: 3, rate: 0.6 },
        { dayOfWeek: 4, rate: 0.65 },
        { dayOfWeek: 5, rate: 0.5 }, // Friday
        { dayOfWeek: 6, rate: 0.4 }, // Saturday
        { dayOfWeek: 0, rate: 0.3 }  // Sunday
      ]
    };
  }

  public async getInsights(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    insights: Array<{
      type: 'positive' | 'neutral' | 'suggestion';
      title: string;
      description: string;
      data?: any;
    }>;
  }> {
    const stats = await this.getPracticeStats(period);
    const insights = [];

    // Response rate insight
    if (stats.practiceStats.responseRate > 0.7) {
      insights.push({
        type: 'positive' as const,
        title: 'Excellent Response Rate',
        description: `You're responding to ${Math.round(stats.practiceStats.responseRate * 100)}% of bells. Great mindful engagement!`
      });
    } else if (stats.practiceStats.responseRate < 0.5) {
      insights.push({
        type: 'suggestion' as const,
        title: 'Improve Response Rate',
        description: 'Try adjusting your bell schedule to times when you\'re more available to respond.'
      });
    }

    // Type distribution insight
    const lessonPercentage = stats.typeBreakdown.find(t => t.type === 'lesson')?.percentage || 0;
    if (lessonPercentage > 40) {
      insights.push({
        type: 'positive' as const,
        title: 'Growth Mindset',
        description: 'You\'re capturing many lessons, showing active mindful learning and growth.'
      });
    }

    // Streak insight
    if (stats.practiceStats.currentStreak >= 7) {
      insights.push({
        type: 'positive' as const,
        title: 'Strong Practice Streak',
        description: `${stats.practiceStats.currentStreak} days of consistent practice! Keep it up.`
      });
    } else if (stats.practiceStats.currentStreak === 0) {
      insights.push({
        type: 'suggestion' as const,
        title: 'Restart Your Practice',
        description: 'Consider acknowledging at least one bell today to restart your practice streak.'
      });
    }

    return { insights };
  }

  private getPeriodBounds(period: 'week' | 'month' | 'year'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  private generateMockDailyBreakdown(
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; observationCount: number; bellsAcknowledged: number }> {
    const breakdown = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      breakdown.push({
        date: new Date(currentDate),
        observationCount: Math.floor(Math.random() * 5) + 1,
        bellsAcknowledged: Math.floor(Math.random() * 4) + 1
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return breakdown;
  }

  private generateMockTrend(
    startDate: Date,
    endDate: Date,
    type: 'observations'
  ): Array<{ date: Date; count: number }>;
  private generateMockTrend(
    startDate: Date,
    endDate: Date,
    type: 'response'
  ): Array<{ date: Date; rate: number }>;
  private generateMockTrend(
    startDate: Date,
    endDate: Date,
    type: 'observations' | 'response'
  ): Array<{ date: Date; count?: number; rate?: number }> {
    const trend = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (type === 'observations') {
        trend.push({
          date: new Date(currentDate),
          count: Math.floor(Math.random() * 5) + 1
        });
      } else {
        trend.push({
          date: new Date(currentDate),
          rate: Math.random() * 0.4 + 0.4 // Random rate between 0.4 and 0.8
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }

  private generateMockTypeTrend(
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; type: ObservationType; count: number }> {
    const trend = [];
    const currentDate = new Date(startDate);
    const types: ObservationType[] = ['desire', 'fear', 'affliction', 'lesson'];

    while (currentDate <= endDate) {
      for (const type of types) {
        trend.push({
          date: new Date(currentDate),
          type,
          count: Math.floor(Math.random() * 3)
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }
}
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ObservationType } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface ChartDataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface TypeBreakdownData {
  type: ObservationType;
  count: number;
  percentage: number;
}

interface StatsChartProps {
  type: 'line' | 'bar' | 'pie' | 'progress';
  data: ChartDataPoint[] | TypeBreakdownData[] | number;
  title: string;
  subtitle?: string;
  height?: number;
  color?: string;
  maxValue?: number;
}

const getTypeColor = (type: ObservationType): string => {
  switch (type) {
    case 'desire': return '#e74c3c';
    case 'fear': return '#f39c12';
    case 'affliction': return '#9b59b6';
    case 'lesson': return '#27ae60';
    default: return '#7f8c8d';
  }
};

const getTypeIcon = (type: ObservationType): string => {
  switch (type) {
    case 'desire': return '💭';
    case 'fear': return '⚡';
    case 'affliction': return '🌊';
    case 'lesson': return '💡';
    default: return '📝';
  }
};

const LineChart: React.FC<{ data: ChartDataPoint[]; height: number; color: string }> = ({
  data,
  height,
  color
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const chartWidth = screenWidth - 80;
  const chartHeight = height - 40;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxValue}</Text>
          <Text style={styles.axisLabel}>{Math.round((maxValue + minValue) / 2)}</Text>
          <Text style={styles.axisLabel}>{minValue}</Text>
        </View>

        {/* Chart content */}
        <View style={styles.chartContent}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.gridLine, { top: (i * chartHeight) / 3 }]} />
            ))}
          </View>

          {/* Data points and lines */}
          <View style={styles.dataLayer}>
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 40);
              const y = chartHeight - ((point.value - minValue) / range) * chartHeight;

              return (
                <View key={index}>
                  {/* Line to next point */}
                  {index < data.length - 1 && (
                    <View
                      style={[
                        styles.lineSegment,
                        {
                          left: x + 20,
                          top: y,
                          width: Math.sqrt(
                            Math.pow((chartWidth - 40) / (data.length - 1), 2) +
                            Math.pow(((data[index + 1].value - point.value) / range) * chartHeight, 2)
                          ),
                          transform: [{
                            rotate: `${Math.atan2(
                              ((data[index + 1].value - point.value) / range) * chartHeight,
                              (chartWidth - 40) / (data.length - 1)
                            )}rad`
                          }],
                          backgroundColor: color
                        }
                      ]}
                    />
                  )}

                  {/* Data point */}
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        left: x + 16,
                        top: y - 4,
                        backgroundColor: color
                      }
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {data.slice(0, 5).map((point, index) => (
          <Text key={index} style={styles.xAxisLabel}>
            {point.date.getDate()}/{point.date.getMonth() + 1}
          </Text>
        ))}
      </View>
    </View>
  );
};

const BarChart: React.FC<{ data: ChartDataPoint[]; height: number; color: string }> = ({
  data,
  height,
  color
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.barChartContainer}>
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>{point.value}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: color
                  }
                ]}
              />
              <Text style={styles.barLabel}>
                {point.label || `${point.date.getDate()}/${point.date.getMonth() + 1}`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const PieChart: React.FC<{ data: TypeBreakdownData[]; height: number }> = ({
  data,
  height
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.pieChartContainer}>
        {/* Simplified pie representation using bars */}
        <View style={styles.pieChart}>
          {data.map((item, index) => (
            <View key={item.type} style={styles.pieSlice}>
              <View
                style={[
                  styles.pieBar,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: getTypeColor(item.type)
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.pieLegend}>
          {data.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getTypeColor(item.type) }
                ]}
              />
              <Text style={styles.legendIcon}>{getTypeIcon(item.type)}</Text>
              <Text style={styles.legendText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
              <Text style={styles.legendValue}>
                {item.count} ({item.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const ProgressChart: React.FC<{ value: number; maxValue: number; height: number; color: string }> = ({
  value,
  maxValue,
  height,
  color
}) => {
  const percentage = Math.round((value / maxValue) * 100);

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressValue}>{value}</Text>
        <Text style={styles.progressMaxValue}>of {maxValue}</Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: color
              }
            ]}
          />
        </View>

        <Text style={styles.progressPercentage}>{percentage}%</Text>
      </View>
    </View>
  );
};

export const StatsChart: React.FC<StatsChartProps> = ({
  type,
  data,
  title,
  subtitle,
  height = 200,
  color = '#3498db',
  maxValue = 100
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data as ChartDataPoint[]}
            height={height}
            color={color}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data as ChartDataPoint[]}
            height={height}
            color={color}
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data as TypeBreakdownData[]}
            height={height}
          />
        );
      case 'progress':
        return (
          <ProgressChart
            value={data as number}
            maxValue={maxValue}
            height={height}
            color={color}
          />
        );
      default:
        return <Text>Unsupported chart type</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  chartContainer: {
    position: 'relative',
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    marginTop: 40,
  },
  chartArea: {
    flexDirection: 'row',
    height: '85%',
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#ecf0f1',
  },
  dataLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    paddingTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'space-between',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#2c3e50',
    marginBottom: 4,
  },
  bar: {
    width: '80%',
    minHeight: 4,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    width: '100%',
    marginBottom: 16,
  },
  pieSlice: {
    marginBottom: 2,
  },
  pieBar: {
    height: 8,
    borderRadius: 4,
  },
  pieLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: '#2c3e50',
  },
  legendValue: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  progressMaxValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
});

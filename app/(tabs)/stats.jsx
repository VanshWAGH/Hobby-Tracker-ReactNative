import { Award, ChartBar as BarChart3, Clock, Target, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Card,
    Chip,
    Paragraph,
    SegmentedButtons,
    Text,
    Title
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHobbies } from '../../lib/hooks/useHobbies';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { hobbies, loading, fetchHobbies, getHobbiesByDateRange } = useHobbies();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [periodStats, setPeriodStats] = useState({
    totalTime: 0,
    totalSessions: 0,
    averageTime: 0,
    topCategory: '',
    hobbies: []
  });
  const [overallStats, setOverallStats] = useState({
    totalTime: 0,
    totalSessions: 0,
    uniqueCategories: 0,
    longestSession: 0,
    averagePerDay: 0,
    categoryBreakdown: [],
    dailyAverage: [],
    streakDays: 0
  });

  // Period options
  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  // Calculate overall statistics
  useEffect(() => {
    if (hobbies.length > 0) {
      calculateOverallStats();
    }
  }, [hobbies]);

  // Calculate period-specific statistics
  useEffect(() => {
    if (hobbies.length > 0) {
      calculatePeriodStats();
    }
  }, [hobbies, selectedPeriod]);

  const calculateOverallStats = () => {
    const totalTime = hobbies.reduce((sum, hobby) => sum + (hobby.duration || 0), 0);
    const totalSessions = hobbies.length;
    
    // Calculate unique categories
    const categories = [...new Set(hobbies.map(hobby => hobby.category))];
    const uniqueCategories = categories.length;
    
    // Find longest session
    const longestSession = Math.max(...hobbies.map(hobby => hobby.duration || 0));
    
    // Calculate category breakdown
    const categoryMap = hobbies.reduce((acc, hobby) => {
      const cat = hobby.category;
      if (!acc[cat]) {
        acc[cat] = { count: 0, time: 0 };
      }
      acc[cat].count += 1;
      acc[cat].time += hobby.duration || 0;
      return acc;
    }, {});
    
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        time: data.time,
        percentage: (data.time / totalTime * 100).toFixed(1)
      }))
      .sort((a, b) => b.time - a.time);
    
    // Calculate days since first hobby
    const dates = hobbies.map(hobby => new Date(hobby.date)).sort((a, b) => a - b);
    const firstDate = dates[0];
    const daysSinceFirst = Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24));
    const averagePerDay = daysSinceFirst > 0 ? (totalTime / daysSinceFirst).toFixed(1) : 0;
    
    // Calculate current streak
    const today = new Date();
    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dayHobbies = hobbies.filter(hobby => {
        const hobbyDate = new Date(hobby.date);
        return hobbyDate.toDateString() === checkDate.toDateString();
      });
      
      if (dayHobbies.length > 0) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }
    
    setOverallStats({
      totalTime,
      totalSessions,
      uniqueCategories,
      longestSession,
      averagePerDay: parseFloat(averagePerDay),
      categoryBreakdown,
      streakDays
    });
  };

  const calculatePeriodStats = async () => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const result = await getHobbiesByDateRange(startDate, endDate);
    
    if (result.success) {
      const periodHobbies = result.data;
      const totalTime = periodHobbies.reduce((sum, hobby) => sum + (hobby.duration || 0), 0);
      const totalSessions = periodHobbies.length;
      const averageTime = totalSessions > 0 ? (totalTime / totalSessions).toFixed(1) : 0;
      
      // Find top category
      const categoryMap = periodHobbies.reduce((acc, hobby) => {
        acc[hobby.category] = (acc[hobby.category] || 0) + (hobby.duration || 0);
        return acc;
      }, {});
      
      const topCategory = Object.entries(categoryMap)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
      
      setPeriodStats({
        totalTime,
        totalSessions,
        averageTime: parseFloat(averageTime),
        topCategory,
        hobbies: periodHobbies
      });
    }
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHobbies();
    setRefreshing(false);
  };

  if (loading && hobbies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hobbies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <BarChart3 size={64} color="#6750a4" />
          <Title style={styles.emptyTitle}>No Statistics Yet</Title>
          <Paragraph style={styles.emptyText}>
            Start tracking your hobbies to see detailed statistics and insights about your activities.
          </Paragraph>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Statistics</Title>
          <Paragraph style={styles.subtitle}>
            Track your progress and insights
          </Paragraph>
        </View>

        {/* Period Selector */}
        <Card style={styles.selectorCard}>
          <Card.Content>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              buttons={periodOptions}
            />
          </Card.Content>
        </Card>

        {/* Period Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              {periodOptions.find(p => p.value === selectedPeriod)?.label} Summary
            </Title>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Clock size={24} color="#1976d2" />
                <Text style={styles.statNumber}>{formatDuration(periodStats.totalTime)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              
              <View style={styles.statItem}>
                <Target size={24} color="#2e7d32" />
                <Text style={styles.statNumber}>{periodStats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              
              <View style={styles.statItem}>
                <TrendingUp size={24} color="#f57c00" />
                <Text style={styles.statNumber}>{formatDuration(periodStats.averageTime)}</Text>
                <Text style={styles.statLabel}>Avg Session</Text>
              </View>
              
              <View style={styles.statItem}>
                <Award size={24} color="#7b1fa2" />
                <Text style={styles.statNumber}>{periodStats.topCategory || 'N/A'}</Text>
                <Text style={styles.statLabel}>Top Category</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Overall Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>All Time Statistics</Title>
            
            <View style={styles.overallStats}>
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Total Time Spent:</Text>
                <Text style={styles.overallValue}>{formatDuration(overallStats.totalTime)}</Text>
              </View>
              
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Total Sessions:</Text>
                <Text style={styles.overallValue}>{overallStats.totalSessions}</Text>
              </View>
              
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Unique Categories:</Text>
                <Text style={styles.overallValue}>{overallStats.uniqueCategories}</Text>
              </View>
              
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Longest Session:</Text>
                <Text style={styles.overallValue}>{formatDuration(overallStats.longestSession)}</Text>
              </View>
              
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Daily Average:</Text>
                <Text style={styles.overallValue}>{formatDuration(overallStats.averagePerDay)}</Text>
              </View>
              
              <View style={styles.overallStatRow}>
                <Text style={styles.overallLabel}>Current Streak:</Text>
                <Text style={styles.overallValue}>
                  {overallStats.streakDays} {overallStats.streakDays === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        {overallStats.categoryBreakdown.length > 0 && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Category Breakdown</Title>
              
              {overallStats.categoryBreakdown.map((category, index) => (
                <View key={category.name} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDetails}>
                      {category.count} sessions • {formatDuration(category.time)}
                    </Text>
                  </View>
                  <Chip mode="outlined" style={styles.percentageChip}>
                    {category.percentage}%
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Achievements */}
        <Card style={styles.achievementCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>🏆 Achievements</Title>
            
            <View style={styles.achievements}>
              {overallStats.totalSessions >= 10 && (
                <Chip icon="check" mode="flat" style={styles.achievementChip}>
                  Dedicated Tracker (10+ sessions)
                </Chip>
              )}
              
              {overallStats.totalTime >= 600 && (
                <Chip icon="check" mode="flat" style={styles.achievementChip}>
                  Time Master (10+ hours)
                </Chip>
              )}
              
              {overallStats.uniqueCategories >= 5 && (
                <Chip icon="check" mode="flat" style={styles.achievementChip}>
                  Category Explorer (5+ categories)
                </Chip>
              )}
              
              {overallStats.streakDays >= 7 && (
                <Chip icon="check" mode="flat" style={styles.achievementChip}>
                  Week Warrior (7+ day streak)
                </Chip>
              )}
              
              {overallStats.longestSession >= 180 && (
                <Chip icon="check" mode="flat" style={styles.achievementChip}>
                  Marathon Session (3+ hours)
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  selectorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  overallStats: {
    gap: 12,
  },
  overallStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  overallLabel: {
    fontSize: 16,
    flex: 1,
  },
  overallValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6750a4',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  percentageChip: {
    marginLeft: 12,
  },
  achievementCard: {
    elevation: 2,
    backgroundColor: '#fff8e1',
  },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    backgroundColor: '#e8f5e8',
    marginBottom: 8,
  },
});
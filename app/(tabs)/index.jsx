import { router } from 'expo-router';
import { Clock, LogOut, Target, TrendingUp } from 'lucide-react-native';
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
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    Paragraph,
    Text,
    Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useHobbies } from '../../lib/hooks/useHobbies';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { hobbies, loading, fetchHobbies } = useHobbies();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalHobbies: 0,
    totalTime: 0,
    todayTime: 0,
    categories: [],
    recentActivity: []
  });

  // Calculate statistics from hobbies data
  useEffect(() => {
    if (hobbies.length > 0) {
      calculateStats();
    }
  }, [hobbies]);

  const calculateStats = () => {
    const today = new Date().toDateString();
    
    // Calculate total time spent
    const totalTime = hobbies.reduce((sum, hobby) => sum + (hobby.duration || 0), 0);
    
    // Calculate today's time
    const todayTime = hobbies
      .filter(hobby => new Date(hobby.date).toDateString() === today)
      .reduce((sum, hobby) => sum + (hobby.duration || 0), 0);
    
    // Get unique categories with counts
    const categoryMap = hobbies.reduce((acc, hobby) => {
      acc[hobby.category] = (acc[hobby.category] || 0) + 1;
      return acc;
    }, {});
    
    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get recent activity (last 5 hobbies)
    const recentActivity = hobbies.slice(0, 5);
    
    setStats({
      totalHobbies: hobbies.length,
      totalTime,
      todayTime,
      categories,
      recentActivity
    });
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHobbies();
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading && hobbies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
          <View style={styles.headerContent}>
            <Avatar.Text 
              size={48} 
              label={user?.name?.charAt(0)?.toUpperCase() || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Title style={styles.welcomeTitle}>
                Hello, {user?.name?.split(' ')[0] || 'User'}!
              </Title>
              <Paragraph style={styles.welcomeSubtitle}>
                Keep up the great work with your hobbies
              </Paragraph>
            </View>
          </View>
          <Button
            mode="text"
            onPress={handleLogout}
            icon={({ size, color }) => <LogOut size={size} color={color} />}
            contentStyle={styles.logoutButton}
          />
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
              <Card.Content style={styles.statCardContent}>
                <Target color="#2e7d32" size={24} />
                <Text style={styles.statNumber}>{stats.totalHobbies}</Text>
                <Text style={styles.statLabel}>Total Hobbies</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
              <Card.Content style={styles.statCardContent}>
                <Clock color="#1976d2" size={24} />
                <Text style={styles.statNumber}>{formatDuration(stats.totalTime)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </Card.Content>
            </Card>
          </View>
          
          <Card style={[styles.todayCard, { backgroundColor: '#fff3e0' }]}>
            <Card.Content style={styles.todayCardContent}>
              <TrendingUp color="#f57c00" size={28} />
              <View style={styles.todayText}>
                <Text style={styles.todayNumber}>{formatDuration(stats.todayTime)}</Text>
                <Text style={styles.todayLabel}>Time spent today</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Top Categories */}
        {stats.categories.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Top Categories</Title>
              <View style={styles.categoriesContainer}>
                {stats.categories.map((category, index) => (
                  <Chip
                    key={category.name}
                    mode="outlined"
                    style={styles.categoryChip}
                  >
                    {category.name} ({category.count})
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Recent Activity</Title>
              {stats.recentActivity.map((hobby, index) => (
                <View key={hobby.$id}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{hobby.name}</Text>
                      <Text style={styles.activityDetails}>
                        {hobby.category} • {formatDuration(hobby.duration)} • {formatDate(hobby.date)}
                      </Text>
                    </View>
                  </View>
                  {index < stats.recentActivity.length - 1 && (
                    <Divider style={styles.activityDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.quickActionButton}
                contentStyle={styles.quickActionContent}
              >
                Add New Hobby
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.push('/(tabs)/stats')}
                style={styles.quickActionButton}
                contentStyle={styles.quickActionContent}
              >
                View Statistics
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Empty State */}
        {hobbies.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Target color="#6750a4" size={48} />
              <Title style={styles.emptyTitle}>Start Your Journey</Title>
              <Paragraph style={styles.emptyText}>
                You haven't tracked any hobbies yet. Add your first hobby to get started!
              </Paragraph>
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/add')}
                style={styles.emptyButton}
              >
                Add Your First Hobby
              </Button>
            </Card.Content>
          </Card>
        )}
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
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#6750a4',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    paddingHorizontal: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  todayCard: {
    elevation: 2,
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  todayText: {
    marginLeft: 16,
    flex: 1,
  },
  todayNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  todayLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  activityItem: {
    paddingVertical: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  activityDivider: {
    marginHorizontal: 0,
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    marginBottom: 8,
  },
  quickActionContent: {
    paddingVertical: 8,
  },
  emptyCard: {
    elevation: 2,
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
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
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});
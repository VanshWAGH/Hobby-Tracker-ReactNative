import { router } from 'expo-router';
import { Calendar, Clock, Filter, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  FAB,
  Menu,
  Paragraph,
  Searchbar,
  Snackbar,
  Text,
  Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHobbies } from '../../lib/hooks/useHobbies';

export default function HobbiesScreen() {
  const { hobbies = [], loading, fetchHobbies, deleteHobby } = useHobbies();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Safely get unique categories from hobbies
  const categories = ['All', ...new Set(
    hobbies
      .map(hobby => hobby?.category || 'Uncategorized')
      .filter(Boolean)
  )];

  // Safe filter and sort hobbies
  const filteredHobbies = hobbies
    .filter(hobby => {
      if (!hobby) return false;
      
      const hobbyName = String(hobby?.name || '').toLowerCase();
      const hobbyCategory = String(hobby?.category || '').toLowerCase();
      const searchTerm = String(searchQuery || '').toLowerCase();

      const matchesSearch = hobbyName.includes(searchTerm) || 
                          hobbyCategory.includes(searchTerm);
      const matchesCategory = selectedCategory === 'All' || 
                            hobby?.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'name':
          return String(a.name || '').localeCompare(String(b.name || ''));
        case 'date':
        default:
          return (new Date(b.date || 0) - new Date(a.date || 0));
      }
    });

  // Format duration safely
  const formatDuration = (minutes) => {
    const mins = Number(minutes) || 0;
    if (mins < 60) {
      return `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Format date safely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString || new Date());
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHobbies();
    setRefreshing(false);
  };

  // Handle delete hobby
  const handleDeleteHobby = async (hobbyId, hobbyName) => {
    if (!hobbyId) return;
    
    Alert.alert(
      'Delete Hobby',
      `Are you sure you want to delete "${hobbyName || 'this hobby'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteHobby(hobbyId);
              if (result?.success) {
                setSnackbarMessage('Hobby deleted successfully');
                setSnackbarVisible(true);
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete hobby');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  // Render hobby card safely
  const renderHobbyCard = (hobby) => {
    if (!hobby?.$id) return null;
    
    return (
      <Card key={hobby.$id} style={styles.hobbyCard}>
        <Card.Content>
          <View style={styles.hobbyHeader}>
            <View style={styles.hobbyInfo}>
              <Title style={styles.hobbyTitle}>{hobby.name || 'Unnamed Hobby'}</Title>
              <Chip mode="outlined" style={styles.categoryChip}>
                {hobby.category || 'Uncategorized'}
              </Chip>
            </View>
            <View style={styles.hobbyActions}>
              <Button
                mode="text"
                onPress={() => handleDeleteHobby(hobby.$id, hobby.name)}
                icon={({ size, color }) => <Trash2 size={16} color="#d32f2f" />}
                textColor="#d32f2f"
                style={styles.actionButton}
              />
            </View>
          </View>
          
          <View style={styles.hobbyDetails}>
            <View style={styles.detailItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.detailText}>{formatDuration(hobby.duration)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar size={16} color="#666" />
              <Text style={styles.detailText}>{formatDate(hobby.date)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && hobbies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your hobbies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>My Hobbies</Title>
        <Paragraph style={styles.headerSubtitle}>
          {hobbies.length} {hobbies.length === 1 ? 'hobby' : 'hobbies'} tracked
        </Paragraph>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search hobbies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <Menu
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterVisible(true)}
              icon={({ size, color }) => <Filter size={size} color={color} />}
              style={styles.filterButton}
            >
              Filter
            </Button>
          }
        >
          <Menu.Item
            title="Sort by Date"
            onPress={() => {
              setSortBy('date');
              setFilterVisible(false);
            }}
            leadingIcon={sortBy === 'date' ? 'check' : undefined}
          />
          <Menu.Item
            title="Sort by Duration"
            onPress={() => {
              setSortBy('duration');
              setFilterVisible(false);
            }}
            leadingIcon={sortBy === 'duration' ? 'check' : undefined}
          />
          <Menu.Item
            title="Sort by Name"
            onPress={() => {
              setSortBy('name');
              setFilterVisible(false);
            }}
            leadingIcon={sortBy === 'name' ? 'check' : undefined}
          />
          <Divider />
          {categories.map(category => (
            <Menu.Item
              key={category}
              title={category}
              onPress={() => {
                setSelectedCategory(category);
                setFilterVisible(false);
              }}
              leadingIcon={selectedCategory === category ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>

      {/* Category Filter Chips */}
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          {categories.map(category => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryFilterChip}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      )}

      {/* Hobbies List */}
      <ScrollView
        style={styles.hobbiesList}
        contentContainerStyle={styles.hobbiesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredHobbies.length > 0 ? (
          filteredHobbies.map(renderHobbyCard)
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'All' ? 'No hobbies found' : 'No hobbies yet'}
              </Text>
              <Paragraph style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start tracking your hobbies to see them here'
                }
              </Paragraph>
              {!searchQuery && selectedCategory === 'All' && (
                <Button
                  mode="contained"
                  onPress={() => router.push('/(tabs)/add')}
                  style={styles.emptyButton}
                >
                  Add Your First Hobby
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/add')}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  searchbar: {
    flex: 1,
  },
  filterButton: {
    minWidth: 80,
  },
  categoryFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryFilterChip: {
    marginRight: 8,
  },
  hobbiesList: {
    flex: 1,
  },
  hobbiesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  hobbyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  hobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hobbyInfo: {
    flex: 1,
    marginRight: 12,
  },
  hobbyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  hobbyActions: {
    flexDirection: 'row',
  },
  actionButton: {
    minWidth: 40,
  },
  hobbyDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyCard: {
    marginTop: 32,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750a4',
  },
});
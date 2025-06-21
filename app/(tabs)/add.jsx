import { router } from 'expo-router';
import { ChevronDown, Clock, Tag } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Menu,
  Snackbar,
  Text,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useHobbies } from '../../lib/hooks/useHobbies';

const HOBBY_CATEGORIES = [
  'Sports & Fitness',
  'Arts & Crafts',
  'Music & Audio',
  'Reading & Writing',
  'Cooking & Baking',
  'Gaming',
  'Technology',
  'Gardening',
  'Photography',
  'Travel',
  'Learning',
  'Social',
  'Other'
];

export default function AddHobbyScreen() {
  const { createHobby, loading } = useHobbies();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const categoryAnchorRef = useRef(null);

  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Hobby name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Hobby name must be at least 2 characters';
    }

    const finalCategory = showCustomCategory ? customCategory : category;
    if (!finalCategory.trim()) {
      errors.category = 'Category is required';
    }

    if (!duration.trim()) {
      errors.duration = 'Duration is required';
    } else {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum)) {
        errors.duration = 'Duration must be a number';
      } else if (durationNum <= 0) {
        errors.duration = 'Duration must be positive';
      } else if (durationNum > 1440) {
        errors.duration = 'Duration cannot exceed 1440 minutes (24 hours)';
      }
    }

    if (!user?.$id) {
      errors.user = 'User authentication required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategorySelect = (selectedCategory) => {
    if (selectedCategory === 'Other') {
      setShowCustomCategory(true);
      setCategory('');
    } else {
      setShowCustomCategory(false);
      setCategory(selectedCategory);
      setCustomCategory('');
    }
    setCategoryMenuVisible(false);
  };

  const formatDurationDisplay = (minutes) => {
    if (!minutes) return '';
    const num = parseInt(minutes);
    if (isNaN(num)) return '';
    
    if (num < 60) {
      return `${num} minutes`;
    }
    const hours = Math.floor(num / 60);
    const remainingMinutes = num % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const finalCategory = showCustomCategory ? customCategory.trim() : category;
    
    // Try different field combinations to match your actual collection structure
    // Based on your screenshot, but let's try variations in case of sync issues
    
    // Option 1: Exact match to your screenshot
    let hobbyData = {
      name: name.trim(),
      category: finalCategory,
      duration: parseInt(duration, 10),
      date: new Date().toISOString(),
      userId: user.$id
    };

    console.log('Attempting to submit with Option 1:', hobbyData);

    try {
      let result = await createHobby(hobbyData);
      
      if (result && result.success) {
        setSnackbarMessage('Hobby added successfully!');
        setSnackbarVisible(true);
        
        // Clear form
        setName('');
        setCategory('');
        setDuration('');
        setCustomCategory('');
        setShowCustomCategory(false);
        setFormErrors({});
        
        setTimeout(() => {
          router.push('/(tabs)/hobbies');
        }, 1500);
        return;
      } else if (result && result.error && result.error.includes('Unknown attribute: "name"')) {
        // Try Option 2: Maybe 'name' field is called something else
        console.log('Trying Option 2: Alternative field names');
        
        hobbyData = {
          title: name.trim(), // Try 'title' instead of 'name'
          category: finalCategory,
          duration: parseInt(duration, 10),
          date: new Date().toISOString(),
          userId: user.$id
        };
        
        result = await createHobby(hobbyData);
        
        if (result && result.success) {
          setSnackbarMessage('Hobby added successfully!');
          setSnackbarVisible(true);
          
          // Clear form
          setName('');
          setCategory('');
          setDuration('');
          setCustomCategory('');
          setShowCustomCategory(false);
          setFormErrors({});
          
          setTimeout(() => {
            router.push('/(tabs)/hobbies');
          }, 1500);
          return;
        }
      }
      
      if (result && result.error && result.error.includes('Unknown attribute')) {
        // Try Option 3: Minimal data to identify which field is causing issues
        console.log('Trying Option 3: Minimal required fields only');
        
        hobbyData = {
          category: finalCategory,
          duration: parseInt(duration, 10),
          date: new Date().toISOString(),
          userId: user.$id
        };
        
        result = await createHobby(hobbyData);
        
        if (result && result.success) {
          setSnackbarMessage('Hobby added successfully (minimal data)!');
          setSnackbarVisible(true);
          
          // Clear form
          setName('');
          setCategory('');
          setDuration('');
          setCustomCategory('');
          setShowCustomCategory(false);
          setFormErrors({});
          
          setTimeout(() => {
            router.push('/(tabs)/hobbies');
          }, 1500);
          return;
        }
      }

      // If all attempts failed, show detailed error
      const errorMessage = result?.error || result?.message || 'Failed to add hobby';
      console.error('All create attempts failed:', result);
      
      Alert.alert(
        'Error Adding Hobby', 
        `${errorMessage}\n\nCollection ID: 6856469500220389348c\nDatabase ID: 685646570038e69435ca`,
        [
          { 
            text: 'Details', 
            onPress: () => {
              const details = `Error: ${errorMessage}\nCode: ${result?.code || 'Unknown'}\nType: ${result?.type || 'Unknown'}\n\nData sent:\n${JSON.stringify(hobbyData, null, 2)}`;
              Alert.alert('Error Details', details);
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Submission error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to add hobby. Please try again.';
      if (error.message?.includes('400')) {
        errorMessage = 'Invalid data format. Please check your collection attributes.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert(
        'Error',
        `${errorMessage}\n\nTechnical details: ${error.message}`,
        [
          { 
            text: 'Debug Info',
            onPress: () => {
              const details = `Message: ${error.message || 'Unknown'}\nCode: ${error.code || 'Unknown'}\nStack: ${error.stack || 'Not available'}\n\nCollection: 6856469500220389348c\nDatabase: 685646570038e69435ca`;
              Alert.alert('Debug Information', details);
            }
          },
          { text: 'OK' }
        ]
      );
    }
  };

  const handleClear = () => {
    setName('');
    setCategory('');
    setDuration('');
    setCustomCategory('');
    setShowCustomCategory(false);
    setFormErrors({});
  };

  const displayCategory = showCustomCategory ? customCategory : category;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add New Hobby</Text>
            <Text style={styles.subtitle}>
              Track a new hobby session and add it to your collection
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Card.Content style={styles.cardContent}>
              <TextInput
                label="Hobby Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                placeholder="e.g., Morning Jog, Guitar Practice"
                style={styles.input}
                error={!!formErrors.name}
                disabled={loading}
                left={<TextInput.Icon icon={() => <Tag size={20} color="#666" />} />}
              />
              {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}

              <View style={styles.categoryContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <TouchableOpacity
                  onPress={() => setCategoryMenuVisible(true)}
                  ref={categoryAnchorRef}
                  style={[
                    styles.categoryInput,
                    formErrors.category && styles.errorInput
                  ]}
                >
                  <Tag size={20} color="#666" style={styles.categoryIcon} />
                  <Text style={styles.categoryText}>
                    {displayCategory || 'Select a category'}
                  </Text>
                  <ChevronDown size={20} color="#666" />
                </TouchableOpacity>

                <Menu
                  visible={categoryMenuVisible}
                  onDismiss={() => setCategoryMenuVisible(false)}
                  anchor={{
                    x: Dimensions.get('window').width - 40,
                    y: 100,
                    width: 0,
                    height: 0
                  }}
                  style={styles.menuStyle}
                  contentStyle={styles.menuContent}
                >
                  <ScrollView 
                    style={styles.menuScrollView}
                    nestedScrollEnabled={true}
                  >
                    {HOBBY_CATEGORIES.map(cat => (
                      <Menu.Item
                        key={cat}
                        title={cat}
                        onPress={() => handleCategorySelect(cat)}
                        style={styles.menuItem}
                        titleStyle={styles.menuItemText}
                      />
                    ))}
                  </ScrollView>
                </Menu>
              </View>
              {formErrors.category && <Text style={styles.errorText}>{formErrors.category}</Text>}

              {showCustomCategory && (
                <TextInput
                  label="Custom Category"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  mode="outlined"
                  placeholder="Enter your custom category"
                  style={styles.input}
                  disabled={loading}
                />
              )}

              <TextInput
                label="Duration (minutes)"
                value={duration}
                onChangeText={setDuration}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 30, 45, 120"
                style={styles.input}
                error={!!formErrors.duration}
                disabled={loading}
                left={<TextInput.Icon icon={() => <Clock size={20} color="#666" />} />}
              />
              {formErrors.duration && <Text style={styles.errorText}>{formErrors.duration}</Text>}
              
              {duration && !formErrors.duration && (
                <View style={styles.durationPreview}>
                  <Chip mode="outlined" icon="clock">
                    <Text>{formatDurationDisplay(duration)}</Text>
                  </Chip>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={handleClear}
                  style={styles.clearButton}
                  disabled={loading}
                >
                  Clear Form
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    'Add Hobby'
                  )}
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipText}>• Be specific with hobby names</Text>
                <Text style={styles.tipText}>• Choose appropriate categories</Text>
                <Text style={styles.tipText}>• Track actual time spent</Text>
                <Text style={styles.tipText}>• Regular tracking builds habits</Text>
              </View>
            </Card.Content>
          </Card>

          {__DEV__ && (
            <Card style={{ marginTop: 16, backgroundColor: '#fff0f0' }}>
              <Card.Content>
                <Text style={{ fontWeight: 'bold' }}>Debug Information:</Text>
                <Text>User ID: {user?.$id || 'Not available'}</Text>
                <Text>Current Data: {JSON.stringify({
                  name: name.trim(),
                  category: showCustomCategory ? customCategory.trim() : category,
                  duration: parseInt(duration, 10) || 0,
                  date: new Date().toISOString(),
                  userId: user?.$id
                }, null, 2)}</Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'View Hobbies',
          onPress: () => router.push('/(tabs)/hobbies'),
        }}
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 24,
  },
  formCard: {
    elevation: 4,
    marginBottom: 16,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  categoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'white',
  },
  errorInput: {
    borderColor: '#d32f2f',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.87)',
  },
  menuStyle: {
    marginTop: 10,
    width: Dimensions.get('window').width - 32,
  },
  menuContent: {
    maxHeight: 300,
  },
  menuScrollView: {
    maxHeight: 250,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  durationPreview: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  tipsCard: {
    elevation: 2,
    backgroundColor: '#fff8e1',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#f57c00',
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e65100',
  },
});
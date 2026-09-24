import React, { useState, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Text, 
  TextInput,
  Pressable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mockRooms } from '../data/mockRooms';
import { RoomCard } from '../components/RoomCard';
import { Room, RootStackParamList } from '../types';

type FilterStatus = 'ALL' | 'AVAILABLE' | 'BOOKED';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BrowseRooms'>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  const handleRoomPress = (room: Room) => {
    navigation.navigate('RoomDetail', { room });
  };


  const filteredRooms = useMemo(() => {
    return mockRooms.filter((room) => {
      // 1. Search condition
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        room.name.toLowerCase().includes(lowerQuery) || 
        room.building.toLowerCase().includes(lowerQuery);

      // 2. Filter condition
      let matchesFilter = true;
      if (filterStatus === 'AVAILABLE') {
        matchesFilter = room.available === true;
      } else if (filterStatus === 'BOOKED') {
        matchesFilter = room.available === false;
      }

      // Combine conditions
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
      <Text style={styles.emptySubtitle}>Hãy thử từ khóa hoặc bộ lọc khác.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Rooms</Text>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm phòng..."
            placeholderTextColor="#9aa0a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <Pressable 
            style={[styles.filterButton, filterStatus === 'ALL' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('ALL')}
          >
            <Text style={[styles.filterText, filterStatus === 'ALL' && styles.filterTextActive]}>Tất cả</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.filterButton, filterStatus === 'AVAILABLE' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('AVAILABLE')}
          >
            <Text style={[styles.filterText, filterStatus === 'AVAILABLE' && styles.filterTextActive]}>Có thể đặt</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.filterButton, filterStatus === 'BOOKED' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('BOOKED')}
          >
            <Text style={[styles.filterText, filterStatus === 'BOOKED' && styles.filterTextActive]}>Đã đặt</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={handleRoomPress} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8eaed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#202124',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  filterButtonActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#d2e3fc',
  },
  filterText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c4043',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 20,
  },
});

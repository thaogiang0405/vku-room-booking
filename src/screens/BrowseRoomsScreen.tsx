import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  StatusBar, 
  Text, 
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RoomCard } from '../components/RoomCard';
import { Room, RootStackParamList } from '../types';
import { subscribeToRooms } from '../services/roomService';
import { useTodayRoomSchedules } from '../hooks/useTodayRoomSchedules';
import { getRoomStatus, RoomStatus } from '../utils/roomUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BrowseRooms'>;

const BUILDINGS = ['ALL', 'A', 'B', 'C', 'V'];
const CAPACITIES = [0, 2, 4, 6, 8, 10, 12, 15, 20];
const EQUIPMENTS = ['Máy chiếu', 'Bảng trắng', 'Máy tính cấu hình cao', 'Điều hòa'];

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todaySchedules = useTodayRoomSchedules();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<string>('ALL');
  const [filterCapacity, setFilterCapacity] = useState<number>(0);
  const [filterEquipments, setFilterEquipments] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'ALL'>('ALL');
  
  // Force re-render every minute to keep room status up to date
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRooms(
      (data) => {
        setRooms(data);
        setIsLoading(false);
      },
      (err) => {
        setError('Không thể tải danh sách phòng.');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleRoomPress = useCallback((room: Room) => {
    navigation.navigate('RoomDetail', { room });
  }, [navigation]);

  const toggleEquipment = (eq: string) => {
    setFilterEquipments(prev => 
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const roomStatus = getRoomStatus(room, todaySchedules[room.id] || []);
      
      // 1. Search condition
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        room.name.toLowerCase().includes(lowerQuery) || 
        room.building.toLowerCase().includes(lowerQuery);

      // 2. Status condition
      const matchesStatus = filterStatus === 'ALL' || roomStatus === filterStatus;

      // 3. Building condition
      const buildingCode = room.buildingCode || (
        room.building.includes('Khu V') ? 'V' :
        room.building.includes('Tòa C') ? 'C' :
        room.building.includes('Tòa B') ? 'B' :
        room.building.includes('Tòa A') ? 'A' : ''
      );
      const matchesBuilding = filterBuilding === 'ALL' || buildingCode === filterBuilding;
      
      // 4. Capacity condition
      const matchesCapacity = filterCapacity === 0 || room.capacity >= filterCapacity;

      // 5. Equipment condition
      const matchesEquip = filterEquipments.every(eq => room.facilities.includes(eq));

      return matchesSearch && matchesStatus && matchesBuilding && matchesCapacity && matchesEquip;
    });
  }, [rooms, searchQuery, filterStatus, filterBuilding, filterCapacity, filterEquipments, todaySchedules, tick]);

  const renderEmptyState = () => {
    if (rooms.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu phòng.</Text>
          <Text style={styles.emptySubtitle}>Không có phòng nào được lưu trên hệ thống.</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
        <Text style={styles.emptySubtitle}>Hãy thử từ khóa hoặc bộ lọc khác.</Text>
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: Room }) => (
    <RoomCard 
      room={item} 
      status={getRoomStatus(item, todaySchedules[item.id] || [])} 
      onPress={handleRoomPress} 
    />
  ), [todaySchedules, handleRoomPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Study Rooms</Text>
          <View style={styles.navButtonsContainer}>
            <Pressable 
              style={styles.navButton}
              onPress={() => navigation.navigate('MyBookings')}
            >
              <Text style={styles.navButtonText}>Lịch đặt</Text>
            </Pressable>
            <Pressable 
              style={[styles.navButton, styles.navButtonAlt]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.navButtonTextAlt}>Hồ sơ</Text>
            </Pressable>
          </View>
        </View>
        
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

        {/* Quick Filters */}
        <View style={styles.quickFilterRow}>
          <Pressable style={styles.filterMenuButton} onPress={() => setFilterModalVisible(true)}>
            <Text style={styles.filterMenuButtonText}>⚙️ Bộ lọc nâng cao</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc phòng</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButtonText}>Đóng</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.filterSectionTitle}>Tòa nhà</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {BUILDINGS.map(b => (
                  <Pressable 
                    key={b} 
                    style={[styles.chip, filterBuilding === b && styles.chipActive]}
                    onPress={() => setFilterBuilding(b)}
                  >
                    <Text style={[styles.chipText, filterBuilding === b && styles.chipTextActive]}>
                      {b === 'ALL' ? 'Tất cả' : `Tòa ${b}`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Trạng thái</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['ALL', 'AVAILABLE', 'IN_USE', 'LOCKED'].map(s => {
                  const label = s === 'ALL' ? 'Tất cả' : s === 'AVAILABLE' ? 'Có thể đặt' : s === 'IN_USE' ? 'Đang sử dụng' : 'Tạm khóa';
                  return (
                    <Pressable 
                      key={s} 
                      style={[styles.chip, filterStatus === s && styles.chipActive]}
                      onPress={() => setFilterStatus(s as RoomStatus | 'ALL')}
                    >
                      <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Sức chứa nhóm (tối thiểu)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CAPACITIES.map(c => (
                  <Pressable 
                    key={c} 
                    style={[styles.chip, filterCapacity === c && styles.chipActive]}
                    onPress={() => setFilterCapacity(c)}
                  >
                    <Text style={[styles.chipText, filterCapacity === c && styles.chipTextActive]}>
                      {c === 0 ? 'Tất cả' : `${c} người`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Thiết bị yêu cầu</Text>
              <View style={styles.equipmentsWrap}>
                {EQUIPMENTS.map(eq => (
                  <Pressable 
                    key={eq} 
                    style={[styles.chip, filterEquipments.includes(eq) && styles.chipActive]}
                    onPress={() => toggleEquipment(eq)}
                  >
                    <Text style={[styles.chipText, filterEquipments.includes(eq) && styles.chipTextActive]}>{eq}</Text>
                  </Pressable>
                ))}
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>Đang tải danh sách phòng...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Lỗi kết nối</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={11}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  navButtonAlt: {
    backgroundColor: '#f1f3f4',
  },
  navButtonText: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 14,
  },
  navButtonTextAlt: {
    color: '#5f6368',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#202124',
  },
  quickFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterMenuButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterMenuButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3c4043',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 8,
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  equipmentsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
    borderWidth: 1,
  },
  chipText: {
    color: '#5f6368',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
});

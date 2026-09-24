import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { removeBookingFromFirebase } from '../services/bookingService';
import { mockRooms } from '../data/mockRooms';

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>;

const formatDate = (isoString: string) => {
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${weekdays[d.getDay()]}, ${parts[2]}/${parts[1]}`;
};

export const MyBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const bookings = useBookingStore(state => state.bookings);
  const loading = useBookingStore(state => state.loading);
  const user = useBookingStore(state => state.user);
  const insets = useSafeAreaInsets();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const sortedBookings = [...bookings].reverse();

  const handleCancel = (booking: any) => {
    if (booking.userId !== user?.uid) {
      Alert.alert('Lỗi', 'Bạn không có quyền hủy lịch đặt này.');
      return;
    }
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc muốn hủy lịch đặt này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBookingFromFirebase(booking);
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể hủy đặt phòng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Lịch đặt của bạn đang trống</Text>
      <Text style={styles.emptySubtitle}>Bạn chưa đặt phòng nào.</Text>
      <Pressable 
        style={styles.browseButton}
        onPress={() => navigation.navigate('BrowseRooms')}
      >
        <Text style={styles.browseButtonText}>Đặt phòng</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            sortedBookings.length === 0 ? styles.emptyListContent : styles.listContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => {
            const room = mockRooms.find(r => r.id === item.roomId);
            const building = room ? room.building : '';
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.roomName}>{item.roomName}</Text>
                    {building ? <Text style={styles.buildingText}>{building}</Text> : null}
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Đã đặt</Text>
                  </View>
                </View>
                
                <View style={styles.timeInfo}>
                  <Text style={styles.dateText}>📅 {formatDate(item.date)}</Text>
                  <Text style={styles.timeText}>🕒 {item.startTime} - {item.endTime}</Text>
                </View>
                
                {item.bookingCode && (
                  <Text style={styles.bookingCodeText}>Mã đặt phòng: {item.bookingCode}</Text>
                )}

                <View style={styles.cardFooter}>
                  <Pressable 
                    style={styles.qrButton}
                    onPress={() => setSelectedBooking(item)}
                  >
                    <Text style={styles.qrButtonText}>Hiển thị mã QR</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => handleCancel(item)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy đặt</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* QR Modal */}
      <Modal visible={!!selectedBooking} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrTitle}>Mã QR Check-in</Text>
            {selectedBooking && (() => {
              const payload = {
                type: 'VKU_ROOM_BOOKING',
                version: 1,
                bookingId: selectedBooking.id,
                bookingCode: selectedBooking.bookingCode,
                userId: selectedBooking.userId,
                roomId: selectedBooking.roomId,
                date: selectedBooking.date,
                startTime: selectedBooking.startTime,
                endTime: selectedBooking.endTime
              };
              
              const missingFields = Object.entries(payload)
                .filter(([_, value]) => value === undefined || value === null || value === '')
                .map(([key]) => key);
                
              console.log("[QR MISSING FIELDS]", missingFields);
              
              if (missingFields.length > 0) {
                return (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                      Không thể tạo mã QR cho lịch đặt này.
                    </Text>
                    <Text style={{ textAlign: 'center' }}>
                      Lịch đặt này chưa có mã QR (thiếu: {missingFields.join(', ')}). Vui lòng tạo lại lịch đặt.
                    </Text>
                  </View>
                );
              }

              const qrValue = JSON.stringify(payload);
              console.log("[QR PAYLOAD]", payload);
              console.log("[QR STRING]", qrValue);

              return (
                <>
                  <View style={styles.qrWrapper}>
                    <QRCode value={qrValue} size={200} />
                  </View>
                  <View style={styles.qrDetails}>
                    <Text style={styles.qrDetailText}>
                      Mã đặt phòng: <Text style={{fontWeight: 'bold'}}>{selectedBooking.bookingCode}</Text>
                    </Text>
                    <Text style={styles.qrDetailText}>Phòng: {selectedBooking.roomName}</Text>
                    <Text style={styles.qrDetailText}>Ngày: {formatDate(selectedBooking.date)}</Text>
                    <Text style={styles.qrDetailText}>Khung giờ: {selectedBooking.startTime} - {selectedBooking.endTime}</Text>
                  </View>
                </>
              );
            })()}
            <Pressable style={styles.qrCloseButton} onPress={() => setSelectedBooking(null)}>
              <Text style={styles.qrCloseButtonText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyListContent: { flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#3c4043', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#5f6368', textAlign: 'center', marginBottom: 20 },
  browseButton: { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomName: { fontSize: 20, fontWeight: 'bold', color: '#202124' },
  buildingText: { fontSize: 14, color: '#5f6368', marginTop: 4 },
  statusBadge: { backgroundColor: '#e8f0fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#1a73e8', fontSize: 12, fontWeight: 'bold' },
  timeInfo: { marginBottom: 16, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8 },
  dateText: { fontSize: 16, color: '#3c4043', marginBottom: 8 },
  timeText: { fontSize: 16, color: '#3c4043', fontWeight: '500' },
  bookingCodeText: { fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fce8e6', alignItems: 'center' },
  cancelButtonText: { color: '#c5221f', fontWeight: 'bold', fontSize: 14 },
  qrButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#e8f0fe', alignItems: 'center' },
  qrButtonText: { color: '#1a73e8', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  qrModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
  qrTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1a73e8' },
  qrWrapper: { padding: 16, backgroundColor: '#fff', elevation: 2, borderRadius: 8, marginBottom: 20 },
  qrDetails: { width: '100%', marginBottom: 24 },
  qrDetailText: { fontSize: 14, color: '#5f6368', marginBottom: 6 },
  qrCloseButton: { backgroundColor: '#1a73e8', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center' },
  qrCloseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

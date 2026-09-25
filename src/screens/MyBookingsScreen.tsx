import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList, Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { removeBookingFromFirebase } from '../services/bookingService';
import { mockRooms } from '../data/mockRooms';

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>;

type BookingStatus = 'UPCOMING' | 'REMINDER' | 'ACTIVE' | 'ENDED' | 'RETURNED';

const formatDate = (isoString: string) => {
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${weekdays[d.getDay()]}, ${parts[2]}/${parts[1]}`;
};

const getBookingStatusInfo = (booking: Booking, now: Date) => {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [startH, startM] = booking.startTime.split(':').map(Number);
  const [endH, endM] = booking.endTime.split(':').map(Number);
  
  const start = new Date(year, month - 1, day, startH, startM);
  const end = new Date(year, month - 1, day, endH, endM);
  const checkInStart = new Date(start.getTime() - 15 * 60 * 1000);

  const nowTime = now.getTime();
  let status: BookingStatus = 'UPCOMING';
  if (booking.returnedEarly) {
    status = 'RETURNED';
  } else if (nowTime >= end.getTime()) {
    status = 'ENDED';
  } else if (nowTime >= start.getTime()) {
    status = 'ACTIVE';
  } else if (nowTime >= checkInStart.getTime()) {
    status = 'REMINDER';
  } else {
    status = 'UPCOMING';
  }

  return { status, checkInStart, start, end };
};

const getCountdownText = (targetDate: Date, now: Date): string => {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return '';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `Còn ${diffMins} phút`;
  }
  const hours = Math.floor(diffMins / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Còn ${days} ngày`;
  }
  const mins = diffMins % 60;
  return `Còn ${hours} giờ ${mins} phút`;
};

const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const BookingCardItem = React.memo(({ 
  booking, 
  statusInfo,
  onShowQR, 
  onCancel,
  onCheckIn,
  onReturnEarly
}: { 
  booking: Booking, 
  statusInfo: { status: BookingStatus },
  onShowQR: (b: Booking) => void,
  onCancel: (b: Booking) => void,
  onCheckIn: (b: Booking) => void,
  onReturnEarly: (b: Booking) => void
}) => {
  const room = mockRooms.find(r => r.id === booking.roomId);
  const building = room ? room.building : '';
  const { status } = statusInfo;

  let statusText = '';
  let statusBadgeStyle = {};
  let statusTextStyle = {};

  if (status === 'UPCOMING') {
    statusText = '📅 Sắp tới';
    statusBadgeStyle = styles.badgeUpcoming;
    statusTextStyle = styles.textUpcoming;
  } else if (status === 'REMINDER') {
    statusText = '🔔 Sắp đến giờ';
    statusBadgeStyle = styles.badgeReminder;
    statusTextStyle = styles.textReminder;
  } else if (status === 'ACTIVE') {
    statusText = '🟢 Đang diễn ra';
    statusBadgeStyle = styles.badgeActive;
    statusTextStyle = styles.textActive;
  } else if (status === 'RETURNED') {
    statusText = `✓ Đã trả sớm`;
    statusBadgeStyle = styles.badgeEnded;
    statusTextStyle = styles.textEnded;
  } else {
    statusText = '✓ Đã kết thúc';
    statusBadgeStyle = styles.badgeEnded;
    statusTextStyle = styles.textEnded;
  }

  return (
    <View style={[styles.card, (status === 'ENDED' || status === 'RETURNED') && { opacity: 0.7 }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.roomName}>{booking.roomName}</Text>
          {building ? <Text style={styles.buildingText}>{building}</Text> : null}
        </View>
        <View style={[styles.statusBadge, statusBadgeStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>{statusText}</Text>
        </View>
      </View>
      
      <View style={styles.timeInfo}>
        <Text style={styles.dateText}>📅 {formatDate(booking.date)}</Text>
        <Text style={styles.timeText}>🕒 Lịch đặt: {booking.startTime} - {booking.endTime}</Text>
        {booking.returnedEarly && booking.actualEndTime && (
          <Text style={[styles.timeText, { color: '#137333', marginTop: 4 }]}>
            🕒 Thực tế sử dụng: {booking.startTime} - {booking.actualEndTime}
          </Text>
        )}
      </View>
      
      {booking.bookingCode && (
        <Text style={styles.bookingCodeText}>Mã đặt phòng: {booking.bookingCode}</Text>
      )}

      <View style={styles.cardFooter}>
        <Pressable style={styles.qrButton} onPress={() => onShowQR(booking)}>
          <Text style={styles.qrButtonText}>Xem QR</Text>
        </Pressable>
        {(status === 'REMINDER' || status === 'ACTIVE') && (
          <Pressable style={styles.checkInButton} onPress={() => onCheckIn(booking)}>
            <Text style={styles.checkInButtonText}>Check-in</Text>
          </Pressable>
        )}
        {status === 'ACTIVE' && (
          <Pressable style={styles.returnButton} onPress={() => onReturnEarly(booking)}>
            <Text style={styles.returnButtonText}>Trả phòng sớm</Text>
          </Pressable>
        )}
        {status !== 'ENDED' && status !== 'ACTIVE' && status !== 'RETURNED' && (
          <Pressable style={styles.cancelButton} onPress={() => onCancel(booking)}>
            <Text style={styles.cancelButtonText}>Hủy đặt</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

export const MyBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const bookings = useBookingStore(state => state.bookings);
  const loading = useBookingStore(state => state.loading);
  const user = useBookingStore(state => state.user);
  const insets = useSafeAreaInsets();
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING' | 'PAST'>('TODAY');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleCancel = useCallback((booking: Booking) => {
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
              await removeBookingFromFirebase(booking as any);
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể hủy đặt phòng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  }, [user]);

  const handleCheckIn = useCallback((booking: Booking) => {
    navigation.navigate('QRCheckIn');
  }, [navigation]);

  const handleShowQR = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
  }, []);

  const [isReturning, setIsReturning] = useState(false);

  const handleReturnEarly = useCallback((booking: Booking) => {
    if (booking.userId !== user?.uid) {
      Alert.alert('Lỗi', 'Bạn không có quyền trả phòng này.');
      return;
    }
    Alert.alert(
      'Xác nhận trả phòng',
      'Bạn có chắc muốn trả phòng sớm? Phòng sẽ được mở lại cho người khác từ thời điểm bạn trả phòng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận trả phòng',
          style: 'destructive',
          onPress: async () => {
            if (isReturning) return;
            setIsReturning(true);
            try {
              const now = new Date();
              const actualEndTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              
              // Import the service dynamically or rely on it being imported at top
              const { returnBookingEarly } = require('../services/bookingService');
              await returnBookingEarly(booking, actualEndTime);
              
              Alert.alert('Thành công', 'Đã trả phòng thành công.');
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể trả phòng lúc này. Vui lòng thử lại.');
            } finally {
              setIsReturning(false);
            }
          },
        },
      ]
    );
  }, [user, isReturning]);

  const { todayList, upcomingList, pastList, nextBooking } = useMemo<{
    todayList: Booking[];
    upcomingList: Booking[];
    pastList: Booking[];
    nextBooking: { booking: Booking; info: ReturnType<typeof getBookingStatusInfo> } | null;
  }>(() => {
    const todayIso = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
    
    let today: Booking[] = [];
    let upcoming: Booking[] = [];
    let past: Booking[] = [];
    
    let nearest: { booking: Booking, info: ReturnType<typeof getBookingStatusInfo> } | null = null;

    bookings.forEach(b => {
      const info = getBookingStatusInfo(b as Booking, currentTime);
      
      if (info.status === 'ENDED') {
        past.push(b as Booking);
      } else if (b.date === todayIso) {
        today.push(b as Booking);
      } else if (b.date > todayIso) {
        upcoming.push(b as Booking);
      } else {
        past.push(b as Booking);
      }

      if (info.status !== 'ENDED' && info.status !== 'ACTIVE') {
        if (!nearest || info.start.getTime() < nearest.info.start.getTime()) {
          nearest = { booking: b as Booking, info };
        }
      }
      if (info.status === 'ACTIVE' && (!nearest || nearest.info.status !== 'ACTIVE')) {
        nearest = { booking: b as Booking, info };
      }
    });

    const sortAsc = (a: Booking, b: Booking) => {
      const aTime = new Date(`${a.date}T${a.startTime}`).getTime();
      const bTime = new Date(`${b.date}T${b.startTime}`).getTime();
      return aTime - bTime;
    };
    
    const sortDesc = (a: Booking, b: Booking) => {
      const aTime = new Date(`${a.date}T${a.startTime}`).getTime();
      const bTime = new Date(`${b.date}T${b.startTime}`).getTime();
      return bTime - aTime;
    };

    today.sort(sortAsc);
    upcoming.sort(sortAsc);
    past.sort(sortDesc);

    return { todayList: today, upcomingList: upcoming, pastList: past, nextBooking: nearest };
  }, [bookings, currentTime]);

  let activeList = todayList;
  let emptyMsg = "Hôm nay bạn không có lịch đặt.";
  if (activeTab === 'UPCOMING') {
    activeList = upcomingList;
    emptyMsg = "Bạn chưa có lịch đặt sắp tới.";
  } else if (activeTab === 'PAST') {
    activeList = pastList;
    emptyMsg = "Chưa có lịch sử đặt phòng.";
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{emptyMsg}</Text>
      {activeTab === 'TODAY' && (
        <Pressable style={styles.browseButton} onPress={() => navigation.navigate('BrowseRooms')}>
          <Text style={styles.browseButtonText}>Đặt phòng ngay</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.mainTitle}>Lịch đặt của tôi</Text>
        <Text style={styles.summaryText}>
          {todayList.length > 0 ? `Hôm nay bạn có ${todayList.length} lịch đặt` : 'Hôm nay bạn không có lịch đặt.'}
        </Text>
      </View>

      {nextBooking && (
        <View style={[
          styles.highlightCard, 
          nextBooking.info.status === 'REMINDER' && styles.highlightReminder,
          nextBooking.info.status === 'ACTIVE' && styles.highlightActive
        ]}>
          <View style={styles.highlightHeader}>
            <Text style={styles.highlightStatus}>
              {nextBooking.info.status === 'REMINDER' ? '🔔 Sắp đến giờ' : 
               nextBooking.info.status === 'ACTIVE' ? '🟢 Đang diễn ra' : '📅 Lịch sắp tới'}
            </Text>
            {nextBooking.info.status !== 'ACTIVE' && (
              <Text style={styles.highlightCountdown}>{getCountdownText(nextBooking.info.start, currentTime)}</Text>
            )}
          </View>
          <Text style={styles.highlightRoomName}>{nextBooking.booking.roomName}</Text>
          <Text style={styles.highlightTime}>{formatDate(nextBooking.booking.date)} | {nextBooking.booking.startTime} - {nextBooking.booking.endTime}</Text>
          
          {nextBooking.info.status === 'REMINDER' && (
            <Text style={styles.highlightSub}>Có thể check-in từ {formatTime(nextBooking.info.checkInStart)}</Text>
          )}
          {nextBooking.info.status === 'ACTIVE' && (
            <Text style={styles.highlightSub}>Bạn đang có lịch sử dụng phòng.</Text>
          )}

          <View style={styles.highlightActions}>
            <Pressable style={styles.highlightBtn} onPress={() => handleShowQR(nextBooking.booking)}>
              <Text style={styles.highlightBtnText}>Xem QR</Text>
            </Pressable>
            {(nextBooking.info.status === 'REMINDER' || nextBooking.info.status === 'ACTIVE') && (
              <Pressable style={[styles.highlightBtn, styles.highlightBtnPrimary]} onPress={() => handleCheckIn(nextBooking.booking)}>
                <Text style={styles.highlightBtnPrimaryText}>Check-in</Text>
              </Pressable>
            )}
            {nextBooking.info.status === 'ACTIVE' && (
              <Pressable style={[styles.highlightBtn, { borderColor: '#f4b400', backgroundColor: '#fef7e0' }]} onPress={() => handleReturnEarly(nextBooking.booking)}>
                <Text style={[styles.highlightBtnText, { color: '#b06000' }]}>Trả phòng</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        {(['TODAY', 'UPCOMING', 'PAST'] as const).map(tab => (
          <Pressable 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'TODAY' ? 'Hôm nay' : tab === 'UPCOMING' ? 'Sắp tới' : 'Đã qua'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={activeList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            activeList.length === 0 ? styles.emptyListContent : styles.listContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <BookingCardItem 
              booking={item}
              statusInfo={getBookingStatusInfo(item, currentTime)}
              onShowQR={handleShowQR}
              onCancel={handleCancel}
              onCheckIn={handleCheckIn}
              onReturnEarly={handleReturnEarly}
            />
          )}
        />
      )}

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
                
              if (missingFields.length > 0) {
                return (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>Không thể tạo mã QR</Text>
                    <Text style={{ textAlign: 'center' }}>Thiếu: {missingFields.join(', ')}</Text>
                  </View>
                );
              }

              const qrValue = JSON.stringify(payload);
              return (
                <>
                  <View style={styles.qrWrapper}>
                    <QRCode value={qrValue} size={200} />
                  </View>
                  <View style={styles.qrDetails}>
                    <Text style={styles.qrDetailText}>Mã đặt: <Text style={{fontWeight: 'bold'}}>{selectedBooking.bookingCode}</Text></Text>
                    <Text style={styles.qrDetailText}>Phòng: {selectedBooking.roomName}</Text>
                    <Text style={styles.qrDetailText}>Thời gian: {formatDate(selectedBooking.date)} | {selectedBooking.startTime} - {selectedBooking.endTime}</Text>
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
  headerArea: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a73e8' },
  summaryText: { fontSize: 14, color: '#5f6368', marginTop: 4 },
  
  highlightCard: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#e8f0fe', elevation: 2 },
  highlightReminder: { backgroundColor: '#fef7e0' },
  highlightActive: { backgroundColor: '#e6f4ea' },
  highlightHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  highlightStatus: { fontSize: 14, fontWeight: 'bold', color: '#1a73e8' },
  highlightCountdown: { fontSize: 14, fontWeight: 'bold', color: '#d93025' },
  highlightRoomName: { fontSize: 22, fontWeight: 'bold', color: '#202124' },
  highlightTime: { fontSize: 15, color: '#3c4043', marginVertical: 4 },
  highlightSub: { fontSize: 14, color: '#5f6368', marginBottom: 12 },
  highlightActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  highlightBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#dadce0' },
  highlightBtnText: { color: '#1a73e8', fontWeight: 'bold' },
  highlightBtnPrimary: { backgroundColor: '#1a73e8', borderWidth: 0 },
  highlightBtnPrimaryText: { color: '#fff', fontWeight: 'bold' },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f3f4' },
  tabBtnActive: { backgroundColor: '#1a73e8' },
  tabText: { color: '#5f6368', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  listContent: { padding: 16 },
  emptyListContent: { flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 16, color: '#3c4043', marginBottom: 8 },
  browseButton: { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  browseButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomName: { fontSize: 18, fontWeight: 'bold', color: '#202124' },
  buildingText: { fontSize: 13, color: '#5f6368', marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  badgeUpcoming: { backgroundColor: '#e8f0fe' },
  textUpcoming: { color: '#1a73e8', fontSize: 12, fontWeight: 'bold' },
  badgeReminder: { backgroundColor: '#fef7e0' },
  textReminder: { color: '#b06000', fontSize: 12, fontWeight: 'bold' },
  badgeActive: { backgroundColor: '#e6f4ea' },
  textActive: { color: '#137333', fontSize: 12, fontWeight: 'bold' },
  badgeEnded: { backgroundColor: '#f1f3f4' },
  textEnded: { color: '#5f6368', fontSize: 12, fontWeight: 'bold' },

  timeInfo: { marginBottom: 12, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8 },
  dateText: { fontSize: 14, color: '#3c4043', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#3c4043', fontWeight: '500' },
  bookingCodeText: { fontSize: 13, color: '#333', fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  
  cardFooter: { flexDirection: 'row', gap: 8 },
  qrButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#e8f0fe', alignItems: 'center' },
  qrButtonText: { color: '#1a73e8', fontWeight: 'bold', fontSize: 13 },
  checkInButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#1a73e8', alignItems: 'center' },
  checkInButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cancelButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#fce8e6', alignItems: 'center' },
  cancelButtonText: { color: '#c5221f', fontWeight: 'bold', fontSize: 13 },
  returnButton: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#fef7e0', alignItems: 'center', borderWidth: 1, borderColor: '#f4b400' },
  returnButtonText: { color: '#b06000', fontWeight: 'bold', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  qrModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a73e8' },
  qrWrapper: { padding: 12, backgroundColor: '#fff', elevation: 1, borderRadius: 8, marginBottom: 16 },
  qrDetails: { width: '100%', marginBottom: 20 },
  qrDetailText: { fontSize: 13, color: '#5f6368', marginBottom: 4 },
  qrCloseButton: { backgroundColor: '#1a73e8', paddingVertical: 10, borderRadius: 8, width: '100%', alignItems: 'center' },
  qrCloseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

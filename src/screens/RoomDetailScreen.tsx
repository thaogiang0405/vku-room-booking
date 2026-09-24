import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, Alert, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { getRoomDaySchedules, subscribeToRoomDaySchedules, addBookingToFirebase } from '../services/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetail'>;

// Generate 7 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const iso = `${year}-${month}-${day}`;
    const display = `${weekdays[d.getDay()]}\n${day}/${month}`;
    const displayInline = `${weekdays[d.getDay()]} ${day}/${month}`;
    dates.push({ iso, display, displayInline });
  }
  return dates;
};
const DATES = generateDates();

const PRESET_SLOTS = [
  { id: 'p1', start: '07:30', end: '09:30' },
  { id: 'p2', start: '09:30', end: '11:30' },
  { id: 'p3', start: '07:30', end: '11:30' },
  { id: 'p4', start: '13:00', end: '15:00' },
  { id: 'p5', start: '15:00', end: '17:00' },
  { id: 'p6', start: '13:00', end: '17:00' },
];

const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const isOverlap = (start1: string, end1: string, start2: string, end2: string) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

const isValidTimeFormat = (timeStr: string) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
};

export const RoomDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { room } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<string>(DATES[0].iso);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  // Array of bookings for this room & date only
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // The final validated time range to be booked
  const [confirmedTime, setConfirmedTime] = useState<{start: string, end: string} | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRoomDaySchedules(room.id, selectedDate, (data) => {
      setSchedules(data);
    });
    return () => unsubscribe();
  }, [room.id, selectedDate]);

  // Check if a time range overlaps with any existing schedule for this room & date
  const isTimeBooked = (start: string, end: string, checkSchedules = schedules) => {
    return checkSchedules.some(
      s => isOverlap(start, end, s.startTime, s.endTime)
    );
  };

  // Realtime clear selection if someone else books it while we are looking at it
  useEffect(() => {
    if (confirmedTime) {
      if (isTimeBooked(confirmedTime.start, confirmedTime.end)) {
        setConfirmedTime(null);
        setSelectedPresetId(null);
        Alert.alert('Thông báo', 'Khung giờ này vừa được người khác đặt trước bạn.');
      }
    }
  }, [schedules]);

  const handleDateSelect = (iso: string) => {
    setSelectedDate(iso);
    setSelectedPresetId(null);
    setConfirmedTime(null);
  };

  const handlePresetSelect = (id: string, start: string, end: string) => {
    setSelectedPresetId(id);
    setCustomStart('');
    setCustomEnd('');
    setConfirmedTime({ start, end });
  };

  const handleCustomConfirm = () => {
    // Validation rules
    if (!customStart || !customEnd) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc.');
      return;
    }
    if (!isValidTimeFormat(customStart) || !isValidTimeFormat(customEnd)) {
      Alert.alert('Lỗi', 'Định dạng giờ không hợp lệ. Vui lòng dùng định dạng HH:mm (VD: 08:30).');
      return;
    }
    
    const startMins = timeToMinutes(customStart);
    const endMins = timeToMinutes(customEnd);
    const minTime = timeToMinutes('07:30');
    const maxTime = timeToMinutes('17:00');

    if (startMins >= endMins) {
      Alert.alert('Lỗi', 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
      return;
    }
    if (startMins < minTime || endMins > maxTime) {
      Alert.alert('Lỗi', 'Khung giờ phải nằm trong khoảng 07:30 - 17:00.');
      return;
    }

    if (isTimeBooked(customStart, customEnd)) {
      Alert.alert('Lỗi', 'Khung giờ này bị trùng với lịch đã đặt.');
      return;
    }

    // Success
    setSelectedPresetId(null);
    setConfirmedTime({ start: customStart, end: customEnd });
  };

  const handleBook = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt phòng.');
      return;
    }
    if (!room.available) {
      Alert.alert('Lỗi', 'Phòng này hiện không cho phép đặt.');
      return;
    }
    if (!confirmedTime) return;

    setIsSubmitting(true);
    try {
      // Prevent local conflict before sending to server (Double-checking)
      const latestSchedules = await getRoomDaySchedules(room.id, selectedDate);
      const hasConflict = isTimeBooked(confirmedTime.start, confirmedTime.end, latestSchedules);

      if (hasConflict) {
        Alert.alert('Lỗi', 'Khung giờ này vừa được người khác đặt trước bạn.');
        setConfirmedTime(null);
        setSelectedPresetId(null);
        setIsSubmitting(false);
        return;
      }

      const newBooking = {
        userId: user.uid,
        roomId: room.id,
        roomName: room.name,
        date: selectedDate,
        startTime: confirmedTime.start,
        endTime: confirmedTime.end,
      };

      const result = await addBookingToFirebase(newBooking);
      
      if (result.success) {
        let msg = 'Đặt phòng thành công!';
        if (result.notifReason === 'permission_denied') {
          msg = 'Đặt phòng thành công. Bạn chưa bật thông báo nhắc lịch.';
        }
        
        Alert.alert(
          'Thành công', 
          msg,
          [
            {
              text: 'OK',
              onPress: () => {
                setConfirmedTime(null);
                setSelectedPresetId(null);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        if (result.reason === 'CONFLICT') {
          Alert.alert('Lỗi', 'Khung giờ này vừa được người khác đặt trước bạn.');
        } else {
          Alert.alert('Lỗi', result.message === 'Firebase từ chối thao tác đặt phòng.' ? result.message : 'Không thể hoàn tất đặt phòng. Vui lòng kiểm tra kết nối và thử lại.');
        }
      }
    } catch (error: any) {
      console.error("[BOOKING ERROR RoomDetailScreen]", error.code, error.message, error.name, error);
      Alert.alert('Lỗi', error.code === 'PERMISSION_DENIED' || error.message === 'Firebase từ chối thao tác đặt phòng.' ? 'Firebase từ chối thao tác đặt phòng.' : 'Không thể hoàn tất đặt phòng. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateObj = DATES.find(d => d.iso === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        
        {/* Room Info Section */}
        <View style={styles.card}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tòa nhà:</Text>
            <Text style={styles.value}>{room.building}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sức chứa:</Text>
            <Text style={styles.value}>{room.capacity} người</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiện nghi:</Text>
            {room.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trạng thái:</Text>
            <View style={[styles.statusBadge, room.available ? styles.statusAvailable : styles.statusBooked]}>
              <Text style={[styles.statusText, room.available ? styles.statusTextAvailable : styles.statusTextBooked]}>
                {room.available ? 'Có thể đặt' : 'Tạm khóa'}
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Section */}
        {room.available && (
          <View style={styles.bookingContainer}>
            <Text style={styles.bookingTitle}>Đặt phòng</Text>

            {/* Date Selection */}
            <Text style={styles.subTitle}>Chọn ngày:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollContainer}>
              {DATES.map((dateObj) => (
                <Pressable
                  key={dateObj.iso}
                  style={[styles.dateButton, selectedDate === dateObj.iso && styles.dateButtonActive]}
                  onPress={() => handleDateSelect(dateObj.iso)}
                >
                  <Text style={[styles.dateText, selectedDate === dateObj.iso && styles.dateTextActive]}>
                    {dateObj.display}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Preset Time Slots */}
            <Text style={styles.subTitle}>Khung giờ gợi ý:</Text>
            <View style={styles.slotsContainer}>
              {PRESET_SLOTS.map((slot) => {
                const isBooked = isTimeBooked(slot.start, slot.end);
                const isSelected = selectedPresetId === slot.id;

                return (
                  <Pressable
                    key={slot.id}
                    disabled={isBooked}
                    style={[
                      styles.slotButton,
                      isSelected && styles.slotButtonActive,
                      isBooked && styles.slotButtonBooked
                    ]}
                    onPress={() => handlePresetSelect(slot.id, slot.start, slot.end)}
                  >
                    <Text style={[
                      styles.slotText,
                      isSelected && styles.slotTextActive,
                      isBooked && styles.slotTextBooked
                    ]}>
                      {slot.start} - {slot.end}
                    </Text>
                    {isBooked ? (
                      <Text style={styles.slotBookedLabel}>Đã đặt</Text>
                    ) : (
                      <Text style={styles.slotAvailableLabel}>Có thể đặt</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Time Selection */}
            <Text style={styles.subTitle}>Tự chọn khung giờ:</Text>
            <View style={styles.customTimeContainer}>
              <View style={styles.customInputWrapper}>
                <Text style={styles.customInputLabel}>Giờ bắt đầu</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="08:30"
                  placeholderTextColor="#9aa0a6"
                  value={customStart}
                  onChangeText={setCustomStart}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={styles.customInputWrapper}>
                <Text style={styles.customInputLabel}>Giờ kết thúc</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="10:30"
                  placeholderTextColor="#9aa0a6"
                  value={customEnd}
                  onChangeText={setCustomEnd}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            <Pressable style={styles.customConfirmButton} onPress={handleCustomConfirm}>
              <Text style={styles.customConfirmButtonText}>Chọn khung giờ này</Text>
            </Pressable>

            {/* Final Confirmation Section */}
            {confirmedTime && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Khung giờ đã chọn:</Text>
                <Text style={styles.summaryText}>{selectedDateObj?.displayInline}</Text>
                <Text style={styles.summaryText}>{confirmedTime.start} - {confirmedTime.end}</Text>
                
                <Pressable
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleBook}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>{isSubmitting ? 'Đang xử lý...' : 'Đặt phòng'}</Text>
                </Pressable>
              </View>
            )}

            {!confirmedTime && (
              <View style={[styles.submitButton, styles.submitButtonDisabled]}>
                <Text style={styles.submitButtonText}>Đặt phòng</Text>
              </View>
            )}
            
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  roomName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#5f6368',
    width: 90,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#202124',
    flex: 1,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 12,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 18,
    color: '#5f6368',
    marginRight: 8,
  },
  facilityText: {
    fontSize: 16,
    color: '#3c4043',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  statusAvailable: {
    backgroundColor: '#e6f4ea',
  },
  statusBooked: {
    backgroundColor: '#fce8e6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusTextAvailable: {
    color: '#137333',
  },
  statusTextBooked: {
    color: '#c5221f',
  },
  bookingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    paddingBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c4043',
    marginBottom: 10,
    marginTop: 10,
  },
  dateScrollContainer: {
    paddingBottom: 8,
    gap: 8,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 80,
  },
  dateButtonActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  dateText: {
    fontSize: 14,
    color: '#3c4043',
    fontWeight: '500',
    textAlign: 'center',
  },
  dateTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  slotButtonActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  slotButtonBooked: {
    backgroundColor: '#f1f3f4',
    borderColor: '#f1f3f4',
  },
  slotText: {
    fontSize: 16,
    color: '#3c4043',
    marginBottom: 4,
  },
  slotTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  slotTextBooked: {
    color: '#9aa0a6',
    textDecorationLine: 'line-through',
  },
  slotAvailableLabel: {
    fontSize: 12,
    color: '#137333',
  },
  slotBookedLabel: {
    fontSize: 12,
    color: '#d93025',
    fontWeight: '500',
  },
  customTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 12,
  },
  customInputWrapper: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 4,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#202124',
    textAlign: 'center',
  },
  customConfirmButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  customConfirmButtonText: {
    color: '#3c4043',
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#dadce0',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

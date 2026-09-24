import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBooking } from '../context/BookingContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomDetail'>;

const DATES = ['Hôm nay', 'Ngày mai', 'Ngày kia'];
const TIME_SLOTS = [
  { id: '1', start: '08:00', end: '09:00' },
  { id: '2', start: '09:00', end: '10:00' },
  { id: '3', start: '10:00', end: '11:00' },
  { id: '4', start: '11:00', end: '12:00' },
  { id: '5', start: '13:00', end: '14:00' },
  { id: '6', start: '14:00', end: '15:00' },
  { id: '7', start: '15:00', end: '16:00' },
  { id: '8', start: '16:00', end: '17:00' },
];

export const RoomDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { room } = route.params;
  const { bookings, addBooking } = useBooking();

  const [selectedDate, setSelectedDate] = useState<string>('Hôm nay');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Helper to check if a slot is conflicting
  const isSlotBooked = (slotId: string) => {
    const slot = TIME_SLOTS.find(s => s.id === slotId);
    if (!slot) return false;
    
    return bookings.some(
      b => b.roomId === room.id && 
           b.date === selectedDate && 
           b.startTime === slot.start && 
           b.endTime === slot.end
    );
  };

  const handleBook = () => {
    if (!room.available) {
      Alert.alert('Lỗi', 'Phòng này hiện không cho phép đặt.');
      return;
    }
    if (!selectedSlotId) return;

    const slot = TIME_SLOTS.find(s => s.id === selectedSlotId);
    if (!slot) return;

    const newBooking = {
      id: Math.random().toString(36).substring(7),
      roomId: room.id,
      roomName: room.name,
      date: selectedDate,
      startTime: slot.start,
      endTime: slot.end,
    };

    addBooking(newBooking);
    
    Alert.alert(
      'Thành công', 
      'Đặt phòng thành công!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Optional: reset selection or navigate back
            setSelectedSlotId(null);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Room Info Section */}
        <View style={styles.card}>
          <Text style={styles.roomName}>{room.name}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tòa nhà:</Text>
            <Text style={styles.value}>{room.building}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tầng:</Text>
            <Text style={styles.value}>{room.floor}</Text>
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
            <Text style={styles.subTitle}>Ngày:</Text>
            <View style={styles.dateContainer}>
              {DATES.map((date) => (
                <Pressable
                  key={date}
                  style={[styles.dateButton, selectedDate === date && styles.dateButtonActive]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlotId(null); // Reset slot selection when date changes
                  }}
                >
                  <Text style={[styles.dateText, selectedDate === date && styles.dateTextActive]}>
                    {date}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Time Slot Selection */}
            <Text style={styles.subTitle}>Khung giờ:</Text>
            <View style={styles.slotsContainer}>
              {TIME_SLOTS.map((slot) => {
                const isBooked = isSlotBooked(slot.id);
                const isSelected = selectedSlotId === slot.id;

                return (
                  <Pressable
                    key={slot.id}
                    disabled={isBooked}
                    style={[
                      styles.slotButton,
                      isSelected && styles.slotButtonActive,
                      isBooked && styles.slotButtonBooked
                    ]}
                    onPress={() => setSelectedSlotId(slot.id)}
                  >
                    <Text style={[
                      styles.slotText,
                      isSelected && styles.slotTextActive,
                      isBooked && styles.slotTextBooked
                    ]}>
                      {slot.start} - {slot.end}
                    </Text>
                    {isBooked && <Text style={styles.slotBookedLabel}>Đã đặt</Text>}
                  </Pressable>
                );
              })}
            </View>

            {/* Submit Button */}
            <Pressable
              disabled={!selectedSlotId}
              style={[styles.submitButton, !selectedSlotId && styles.submitButtonDisabled]}
              onPress={handleBook}
            >
              <Text style={styles.submitButtonText}>Đặt phòng</Text>
            </Pressable>
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
    paddingBottom: 40,
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
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    alignItems: 'center',
  },
  dateButtonActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#1a73e8',
  },
  dateText: {
    fontSize: 14,
    color: '#3c4043',
    fontWeight: '500',
  },
  dateTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  slotsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  slotButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
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
  },
  slotTextActive: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  slotTextBooked: {
    color: '#9aa0a6',
    textDecorationLine: 'line-through',
  },
  slotBookedLabel: {
    fontSize: 14,
    color: '#d93025',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#dadce0',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

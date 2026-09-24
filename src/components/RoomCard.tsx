import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onPress?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => onPress && onPress(room)}
    >
      <View style={styles.header}>
        <Text style={styles.roomName}>{room.name}</Text>
        <View style={[styles.statusBadge, room.available ? styles.statusAvailable : styles.statusBooked]}>
          <Text style={[styles.statusText, room.available ? styles.statusTextAvailable : styles.statusTextBooked]}>
            {room.available ? 'Có thể đặt' : 'Đã đặt'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.detailText}>🏢 {room.building} - Tầng {room.floor}</Text>
      <Text style={styles.detailText}>👥 Sức chứa: {room.capacity} người</Text>
      
      <View style={styles.facilitiesContainer}>
        {room.facilities.map((facility, index) => (
          <View key={index} style={styles.facilityBadge}>
            <Text style={styles.facilityText}>{facility}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#e6f4ea',
  },
  statusBooked: {
    backgroundColor: '#fce8e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextAvailable: {
    color: '#137333',
  },
  statusTextBooked: {
    color: '#c5221f',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6, // Requires React Native 0.71+
  },
  facilityBadge: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  facilityText: {
    fontSize: 12,
    color: '#5f6368',
  },
});

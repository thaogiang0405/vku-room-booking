import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Room } from '../types';
import { RoomStatus } from '../utils/roomUtils';

interface RoomCardProps {
  room: Room;
  status: RoomStatus;
  onPress?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room, status, onPress }) => {
  const [imageError, setImageError] = React.useState(false);
  
  let statusText = '';
  let statusBadgeStyle = {};
  let statusTextStyle = {};

  if (status === 'AVAILABLE') {
    statusText = 'Có thể đặt';
  } else if (status === 'IN_USE') {
    statusText = 'Đang sử dụng';
  } else {
    statusText = 'Tạm khóa';
  }

  // Set badge colors based on status...
  if (status === 'AVAILABLE') {
    statusBadgeStyle = styles.statusAvailable;
    statusTextStyle = styles.statusTextAvailable;
  } else if (status === 'IN_USE') {
    statusBadgeStyle = styles.statusInUse;
    statusTextStyle = styles.statusTextInUse;
  } else {
    statusBadgeStyle = styles.statusLocked;
    statusTextStyle = styles.statusTextLocked;
  }

  const getFallbackSource = () => {
    if (room.id === 'LIBRARY') {
      return require('../../assets/rooms/library.jpg');
    }
    if (room.id.startsWith('HALL')) {
      return require('../../assets/rooms/hall.jpg');
    }
    // Checking for 'Máy tính' or lab facilities could go here, 
    // but using classroom as default photographic fallback.
    return require('../../assets/rooms/classroom.jpg');
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => onPress && onPress(room)}
    >
      <Image
        style={styles.image}
        source={room.imageUrl && !imageError ? { uri: room.imageUrl } : getFallbackSource()}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        onError={() => setImageError(true)}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={[styles.statusBadge, statusBadgeStyle]}>
            <Text style={[styles.statusText, statusTextStyle]}>
              {statusText}
            </Text>
          </View>
        </View>
        
        <Text style={styles.detailText}>🏢 {room.building} - Tầng {room.floor || 1}</Text>
        <Text style={styles.detailText}>👥 {room.capacity} chỗ</Text>
        
        <View style={styles.facilitiesContainer}>
          {room.facilities.map((facility, index) => (
            <View key={index} style={styles.facilityBadge}>
              <Text style={styles.facilityText}>{facility}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  statusInUse: {
    backgroundColor: '#fef7e0',
  },
  statusLocked: {
    backgroundColor: '#fce8e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextAvailable: {
    color: '#137333',
  },
  statusTextInUse: {
    color: '#b06000',
  },
  statusTextLocked: {
    color: '#c5221f',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  facilityBadge: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  facilityText: {
    fontSize: 12,
    color: '#5f6368',
  },
});

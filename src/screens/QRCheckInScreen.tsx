import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { checkInBooking } from '../services/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'QRCheckIn'>;

export const QRCheckInScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Cần cấp quyền sử dụng camera</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </Pressable>
      </View>
    );
  }

  const parseBookingQR = (rawData: string) => {
    if (!rawData || !rawData.trim()) {
      throw new Error('QR không có dữ liệu.');
    }
    const normalized = rawData.trim();
    let parsed;
    try {
      parsed = JSON.parse(normalized);
    } catch {
      try {
        parsed = JSON.parse(decodeURIComponent(normalized));
      } catch {
        throw new Error('QR không đúng định dạng.');
      }
    }
    return parsed;
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    console.log("[QR SCANNED RAW]", data);
    console.log("[QR SCANNED TYPE]", type);
    console.log("[QR SCANNED LENGTH]", data?.length);
    
    try {
      const payload = parseBookingQR(data);

      if (payload.type !== 'VKU_ROOM_BOOKING') {
        throw new Error('Đây không phải mã QR đặt phòng VKU.');
      }
      if (payload.version !== 1) {
        throw new Error('Phiên bản QR không được hỗ trợ.');
      }

      // Check required fields (tolerate undefined/missing by checking truthy/type)
      if (
        !payload.bookingId || 
        !payload.bookingCode || 
        !payload.userId || 
        !payload.roomId || 
        !payload.date || 
        !payload.startTime || 
        !payload.endTime
      ) {
        throw new Error('QR thiếu thông tin đặt phòng.');
      }

      if (!user || payload.userId !== user.uid) {
        throw new Error('Bạn không có quyền check-in cho lịch đặt này.');
      }

      // 3. Fetch authoritative booking from Firebase
      const bookingRef = ref(database, `bookings/${user.uid}/${payload.bookingId}`);
      const snapshot = await get(bookingRef);

      if (!snapshot.exists()) {
        throw new Error('Không tìm thấy lịch đặt.');
      }

      const firebaseBooking = snapshot.val();

      // Firebase Validations
      if (firebaseBooking.bookingCode !== payload.bookingCode) {
        throw new Error('Mã QR không khớp với lịch đặt.');
      }
      if (firebaseBooking.roomId !== payload.roomId) {
        throw new Error('Phòng trong QR không khớp.');
      }
      if (firebaseBooking.date !== payload.date) {
        throw new Error('Ngày đặt phòng không khớp.');
      }
      if (
        firebaseBooking.startTime !== payload.startTime ||
        firebaseBooking.endTime !== payload.endTime
      ) {
        throw new Error('Khung giờ đặt phòng không khớp.');
      }

      // 5. Validate Date/Time
      const now = new Date();
      const [year, month, day] = firebaseBooking.date.split('-').map(Number);
      const [startH, startM] = firebaseBooking.startTime.split(':').map(Number);
      const [endH, endM] = firebaseBooking.endTime.split(':').map(Number);
      
      const startTime = new Date(year, month - 1, day, startH, startM);
      const endTime = new Date(year, month - 1, day, endH, endM);

      // Check date (must be today, or specifically around the time)
      if (now.getTime() < startTime.getTime()) {
        Alert.alert('Lỗi', 'Chưa đến thời gian check-in.', [
          { text: 'OK', onPress: () => setIsProcessing(false) }
        ]);
        return;
      }

      if (now.getTime() >= endTime.getTime()) {
        Alert.alert('Lỗi', 'Đã quá thời gian check-in.', [
          { text: 'OK', onPress: () => setIsProcessing(false) }
        ]);
        return;
      }

      // 6. Check if already checked in
      if (firebaseBooking.checkedInAt) {
        Alert.alert('Thông báo', 'Lịch đặt này đã được check-in.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      // 7. Process check-in
      await checkInBooking(user!.uid, payload.bookingId);

      // 8. Show success
      Alert.alert(
        'Check-in thành công!', 
        `Phòng: ${firebaseBooking.roomName || firebaseBooking.roomId}\nThời gian: ${firebaseBooking.startTime} - ${firebaseBooking.endTime}\nMã: ${firebaseBooking.bookingCode}`, 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      const msg = e.message || 'Lỗi đọc mã QR.';
      Alert.alert('Lỗi', msg, [
        { text: 'OK', onPress: () => setIsProcessing(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.scanText}>Di chuyển camera đến mã QR để quét</Text>
      </View>
      <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Trở về</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#0f9d58',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

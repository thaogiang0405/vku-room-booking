import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';
import { RootStackParamList } from '../types';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifStatus, setNotifStatus] = useState<string>('Đang kiểm tra...');

  useEffect(() => {
    checkNotifStatus();
  }, []);

  const checkNotifStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifStatus(status === 'granted' ? 'Đã bật' : 'Chưa cấp quyền');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng xuất.');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.headerCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.userName}>Hồ sơ cá nhân</Text>
        <Text style={styles.userSubtitle}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>UID tài khoản:</Text>
          <Text style={[styles.infoValue, { fontSize: 13, flex: 1, textAlign: 'right' }]}>{user?.uid}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cài đặt</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Thông báo lịch đặt:</Text>
          <Text style={styles.infoValue}>{notifStatus}</Text>
        </View>
        <Pressable onPress={checkNotifStatus}>
          <Text style={{ color: '#1a73e8', fontSize: 12, marginTop: 4 }}>Kiểm tra quyền thông báo</Text>
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phiên bản:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <Pressable style={styles.qrButton} onPress={() => navigation.navigate('QRCheckIn')}>
        <Text style={styles.qrButtonText}>📷 Quét mã QR Check-in</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>VKURoomBooking</Text>
        <Text style={styles.footerSubtitle}>Ứng dụng đặt phòng học nhóm</Text>
        <Text style={styles.footerVersion}>Phiên bản 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c4043',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#5f6368',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f3f4',
  },
  logoutButton: {
    backgroundColor: '#fce8e6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fad2cf',
  },
  logoutButtonText: {
    color: '#c5221f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrButton: {
    backgroundColor: '#e8f0fe',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrButtonText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9aa0a6',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 14,
    color: '#9aa0a6',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#bdc1c6',
  },
});

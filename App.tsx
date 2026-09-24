import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrowseRoomsScreen } from './src/screens/BrowseRoomsScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { MyBookingsScreen } from './src/screens/MyBookingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { QRCheckInScreen } from './src/screens/QRCheckInScreen';

import { RootStackParamList, AuthStackParamList } from './src/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initializeNotifications, reconcileNotifications } from './src/services/notificationService';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <RootStack.Navigator 
    initialRouteName="BrowseRooms"
    screenOptions={{
      headerStyle: { backgroundColor: '#ffffff' },
      headerTintColor: '#202124',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <RootStack.Screen 
      name="BrowseRooms" 
      component={BrowseRoomsScreen} 
      options={{ title: 'Study Rooms', headerShown: false }} 
    />
    <RootStack.Screen 
      name="RoomDetail" 
      component={RoomDetailScreen} 
      options={{ title: 'Chi tiết phòng' }} 
    />
    <RootStack.Screen 
      name="MyBookings" 
      component={MyBookingsScreen} 
      options={{ title: 'Lịch đặt của tôi' }} 
    />
    <RootStack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Hồ sơ cá nhân' }} 
    />
    <RootStack.Screen 
      name="QRCheckIn" 
      component={QRCheckInScreen} 
      options={{ title: 'Check-in phòng' }} 
    />
  </RootStack.Navigator>
);

import { subscribeToUserBookings } from './src/services/bookingService';
import { useBookingStore } from './src/store/useBookingStore';

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const setBookings = useBookingStore(state => state.setBookings);
  const setUser = useBookingStore(state => state.setUser);
  const clearSession = useBookingStore(state => state.clearSession);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    if (isAuthenticated && user) {
      // Sync auth user to Zustand
      setUser({ uid: user.uid, email: user.email });
      
      // Subscribe to bookings
      unsubscribe = subscribeToUserBookings(user.uid, (data) => {
        setBookings(data);
        reconcileNotifications(data).catch(console.error);
      }, (err) => {
        console.error('Lỗi khi tải bookings', err);
      });
    } else {
      clearSession();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user, setUser, setBookings, clearSession]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={{ marginTop: 12, color: '#5f6368' }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

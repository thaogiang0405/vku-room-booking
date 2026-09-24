import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BrowseRoomsScreen } from './src/screens/BrowseRoomsScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { RootStackParamList } from './src/types';
import { BookingProvider } from './src/context/BookingContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <BookingProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="BrowseRooms"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#202124',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="BrowseRooms" 
            component={BrowseRoomsScreen} 
            options={{ title: 'Study Rooms', headerShown: false }} 
          />
          <Stack.Screen 
            name="RoomDetail" 
            component={RoomDetailScreen} 
            options={{ title: 'Chi tiết phòng' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BookingProvider>
  );
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from '../types';

export interface UserSummary {
  uid: string;
  email: string | null;
}

interface BookingStore {
  user: UserSummary | null;
  bookings: Booking[];
  loading: boolean;
  setUser: (user: UserSummary | null) => void;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  removeBooking: (bookingId: string) => void;
  clearBookings: () => void;
  clearSession: () => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      user: null,
      bookings: [],
      loading: true,
      setUser: (user) => set({ user }),
      setBookings: (bookings) => set({ bookings, loading: false }),
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      removeBooking: (bookingId) => set((state) => ({ 
        bookings: state.bookings.filter(b => b.id !== bookingId) 
      })),
      clearBookings: () => set({ bookings: [] }),
      clearSession: () => set({ user: null, bookings: [], loading: false }),
    }),
    {
      name: 'vku-booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, bookings: state.bookings }),
    }
  )
);

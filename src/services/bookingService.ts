import { ref, update, onValue, off, get, push, serverTimestamp } from 'firebase/database';
import { database, auth } from '../config/firebase';
import { Booking } from '../types';

const BOOKINGS_REF = 'bookings';
const SCHEDULES_REF = 'roomSchedules';

export const subscribeToUserBookings = (userId: string, onData: (bookings: Booking[]) => void, onError: (error: Error) => void) => {
  const userBookingsRef = ref(database, `${BOOKINGS_REF}/${userId}`);
  
  const unsubscribe = onValue(userBookingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const bookingsList: Booking[] = Object.values(data);
      onData(bookingsList);
    } else {
      onData([]);
    }
  }, (error) => {
    onError(error);
  });

  return () => off(userBookingsRef, 'value', unsubscribe);
};

export const getRoomDaySchedules = async (roomId: string, date: string): Promise<any[]> => {
  const schedulesRef = ref(database, `${SCHEDULES_REF}/${roomId}/${date}`);
  const snapshot = await get(schedulesRef);
  if (snapshot.exists()) {
    return Object.values(snapshot.val());
  }
  return [];
};

export const subscribeToRoomDaySchedules = (roomId: string, date: string, onData: (schedules: any[]) => void) => {
  const schedulesRef = ref(database, `${SCHEDULES_REF}/${roomId}/${date}`);
  const unsubscribe = onValue(schedulesRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(Object.values(snapshot.val()));
    } else {
      onData([]);
    }
  });
  return () => off(schedulesRef, 'value', unsubscribe);
};

export type BookingResult =
  | { success: true; bookingId: string; notifScheduled?: boolean; notifReason?: string }
  | { success: false; reason: 'CONFLICT' }
  | { success: false; reason: 'ERROR'; message: string };

export const addBookingToFirebase = async (bookingData: Omit<Booking, 'id'>): Promise<BookingResult> => {
  try {
    const currentUid = auth.currentUser?.uid;
    console.log("[AUTH VERIFICATION]", {
      expectedUserId: bookingData.userId,
      currentAuthUid: currentUid
    });
    
    if (!currentUid || currentUid !== bookingData.userId) {
      console.error("[AUTH ERROR] Mismatch or null user.");
      return { success: false, reason: 'ERROR', message: 'Lỗi xác thực. Vui lòng đăng nhập lại.' };
    }

    const newBookingId = push(ref(database, 'bookings')).key as string;
    
    // Generate bookingCode: e.g. VKU-8F4K2P
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingCode = `VKU-${randomChars}`;
    
    const booking = {
      ...bookingData,
      id: newBookingId,
      createdAt: serverTimestamp() as unknown as number,
      bookingCode,
    };
    
    const scheduleData = {
      bookingId: newBookingId,
      userId: booking.userId,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };

    console.log("[BOOKING ATTEMPT]", {
      userId: booking.userId,
      roomId: booking.roomId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingId: newBookingId
    });

    const updates: Record<string, any> = {};
    updates[`${BOOKINGS_REF}/${booking.userId}/${newBookingId}`] = booking;
    updates[`${SCHEDULES_REF}/${booking.roomId}/${booking.date}/${newBookingId}`] = scheduleData;
    
    await update(ref(database), updates);
    
    // Attempt local notification independently
    let notifResult: { success: boolean; reason?: string } = { success: false, reason: 'unknown' };
    try {
      notifResult = await scheduleBookingReminder(booking as Booking);
    } catch (notifError) {
      console.warn("[NOTIFICATION WARNING] Failed to schedule reminder, but booking succeeded:", notifError);
    }

    return { 
      success: true, 
      bookingId: newBookingId, 
      notifScheduled: notifResult.success, 
      notifReason: notifResult.reason 
    };
  } catch (error: any) {
    console.error("[BOOKING ERROR bookingService]", error.code, error.message, error.name, error);
    return { success: false, reason: 'ERROR', message: error.code === 'PERMISSION_DENIED' ? 'Firebase từ chối thao tác đặt phòng.' : (error.message || 'Lỗi hệ thống') };
  }
};

import { cancelBookingReminder, scheduleBookingReminder } from './notificationService';

export const removeBookingFromFirebase = async (booking: Booking): Promise<void> => {
  const updates: Record<string, any> = {};
  updates[`${BOOKINGS_REF}/${booking.userId}/${booking.id}`] = null;
  updates[`${SCHEDULES_REF}/${booking.roomId}/${booking.date}/${booking.id}`] = null;
  
  await update(ref(database), updates);
  
  try {
    await cancelBookingReminder(booking.id);
  } catch (notifError) {
    console.warn("[NOTIFICATION WARNING] Failed to cancel reminder:", notifError);
  }
};

export const checkInBooking = async (userId: string, bookingId: string): Promise<void> => {
  const updates: Record<string, any> = {};
  updates[`${BOOKINGS_REF}/${userId}/${bookingId}/checkedInAt`] = serverTimestamp();
  
  await update(ref(database), updates);
};

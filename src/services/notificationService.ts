import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Booking } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const initializeNotifications = async () => {
  let finalStatus = 'undetermined';
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.warn("[NOTIFICATION WARNING] Error initializing notifications:", error);
  }
  return finalStatus === 'granted';
};

export const scheduleBookingReminder = async (booking: Booking): Promise<{ success: boolean; reason?: string }> => {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hour, minute] = booking.startTime.split(':').map(Number);
  
  const bookingTime = new Date(year, month - 1, day, hour, minute, 0, 0);
  const reminderTime = new Date(bookingTime.getTime() - 15 * 60000); // 15 mins before

  console.log("[NOTIFICATION] bookingId:", booking.id);
  console.log("[NOTIFICATION] reminderDate:", reminderTime.toISOString());
  console.log("[NOTIFICATION] now:", new Date().toISOString());

  if (reminderTime.getTime() <= Date.now()) {
    console.log("[NOTIFICATION] reminderTime is in the past, skipping.");
    return { success: false, reason: 'past_time' };
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    console.warn("[NOTIFICATION WARNING] Permission not granted. Cannot schedule reminder.");
    return { success: false, reason: 'permission_denied' };
  }

  // Check if we already scheduled this one
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const alreadyScheduled = scheduledNotifications.some(
    n => n.content.data?.bookingId === booking.id
  );
  
  if (alreadyScheduled) {
    console.log("[NOTIFICATION] Reminder already scheduled for this booking.");
    return { success: true };
  }

  const scheduledId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nhắc lịch đặt phòng',
      body: `Bạn có lịch tại ${booking.roomName} lúc ${booking.startTime}. Vui lòng chuẩn bị.`,
      data: { 
        bookingId: booking.id,
        bookingCode: booking.bookingCode 
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });
  console.log("[NOTIFICATION] scheduledId:", scheduledId);
  return { success: true };
};

export const cancelBookingReminder = async (bookingId: string) => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduledNotifications) {
    if (notif.content.data?.bookingId === bookingId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
};

export const reconcileNotifications = async (bookings: Booking[]) => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledBookingIds = scheduledNotifications
    .map(n => n.content.data?.bookingId)
    .filter(Boolean);

  for (const booking of bookings) {
    if (!scheduledBookingIds.includes(booking.id)) {
      // Attempt to schedule missing reminders for future bookings
      await scheduleBookingReminder(booking);
    }
  }
};

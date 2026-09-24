import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, push, serverTimestamp } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDVHlEbGSmimHVOm9pEaijweQg7Ua_JDwA',
  authDomain: 'vkuroombooking.firebaseapp.com',
  databaseURL: 'https://vkuroombooking-default-rtdb.firebaseio.com',
  projectId: 'vkuroombooking'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

async function test() {
  try {
    let user;
    try {
      const cred = await signInWithEmailAndPassword(auth, 'test@test.com', 'password123');
      user = cred.user;
    } catch (e) {
      const cred = await createUserWithEmailAndPassword(auth, 'test@test.com', 'password123');
      user = cred.user;
    }
    
    console.log('AUTH UID:', user.uid);
    
    const newBookingId = push(ref(database, 'bookings')).key;
    const booking = {
      userId: user.uid,
      roomId: 'K-A-101',
      roomName: 'K.A101',
      date: '2026-09-24',
      startTime: '07:30',
      endTime: '09:30',
      id: newBookingId,
      createdAt: serverTimestamp(),
      bookingCode: 'VKU-TEST'
    };
    
    const scheduleData = {
      bookingId: newBookingId,
      userId: user.uid,
      startTime: '07:30',
      endTime: '09:30',
    };
    
    const updates = {};
    updates['bookings/' + user.uid + '/' + newBookingId] = booking;
    updates['roomSchedules/' + booking.roomId + '/' + booking.date + '/' + newBookingId] = scheduleData;
    
    console.log('multi-location update paths:', Object.keys(updates));
    console.log('transaction path: None (using multi-location update)');
    
    await update(ref(database), updates);
    console.log('[BOOKING SUCCESS]');
    process.exit(0);
  } catch (error) {
    console.log('[BOOKING ERROR]');
    console.log('error.code =', error.code);
    console.log('error.message =', error.message);
    console.log('error.name =', error.name);
    process.exit(1);
  }
}

test();

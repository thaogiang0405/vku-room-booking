import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { Room } from '../types';
import { mockRooms } from '../data/mockRooms';

const ROOMS_REF = 'rooms';

export const seedRoomsIfEmpty = async (): Promise<void> => {
  // Client-side writing to /rooms is disabled to enforce Security Rules (.write: false).
  // Any migration or seeding must be done by an Admin script or Firebase Console.
  console.warn('Client-side room seeding/migration is disabled for security.');
};

export const subscribeToRooms = (onData: (rooms: Room[]) => void, onError: (error: Error) => void) => {
  const roomsRef = ref(database, ROOMS_REF);
  
  const unsubscribe = onValue(roomsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const roomsList: Room[] = Object.values(data);
      onData(roomsList);
    } else {
      onData([]);
    }
  }, (error) => {
    onError(error);
  });

  return () => off(roomsRef, 'value', unsubscribe);
};

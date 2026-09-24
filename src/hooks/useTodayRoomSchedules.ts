import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';

const SCHEDULES_REF = 'roomSchedules';

export const useTodayRoomSchedules = () => {
  const [todaySchedules, setTodaySchedules] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Determine today's date in YYYY-MM-DD
    const today = new Date();
    const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // We can't directly subscribe to all schedules of a specific date across all rooms if the structure is /roomSchedules/{roomId}/{date}.
    // But since the number of rooms is small (~20), we could listen to the entire /roomSchedules or just the specific rooms we care about.
    // Given the structure, it's easier to listen to the whole `roomSchedules` node, OR we can process it at the component level.
    // Let's just listen to `/roomSchedules` and filter out today's date.
    
    const rootSchedulesRef = ref(database, SCHEDULES_REF);
    const unsubscribe = onValue(rootSchedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allData = snapshot.val();
        const extracted: Record<string, any[]> = {};
        
        for (const roomId of Object.keys(allData)) {
          if (allData[roomId][isoDate]) {
            extracted[roomId] = Object.values(allData[roomId][isoDate]);
          } else {
            extracted[roomId] = [];
          }
        }
        setTodaySchedules(extracted);
      } else {
        setTodaySchedules({});
      }
    });

    return () => off(rootSchedulesRef, 'value', unsubscribe);
  }, []);

  return todaySchedules;
};

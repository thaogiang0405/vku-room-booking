import { Room } from '../types';

export type RoomStatus = 'AVAILABLE' | 'IN_USE' | 'LOCKED';

export const getRoomStatus = (room: Room, todaySchedules: any[]): RoomStatus => {
  if (!room.available) return 'LOCKED';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const schedule of todaySchedules) {
    const startMins = timeToMinutes(schedule.startTime);
    const endMins = timeToMinutes(schedule.endTime);

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      return 'IN_USE';
    }
  }

  return 'AVAILABLE';
};

const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  facilities: string[];
  available: boolean;
  imageUrl?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export type RootStackParamList = {
  BrowseRooms: undefined;
  RoomDetail: {
    room: Room;
  };
};

export interface Room {
  id: string;
  name: string;
  building: string;
  campus?: string;
  buildingCode?: "A" | "B" | "C" | "V";
  floor?: number;
  capacity: number;
  facilities: string[];
  imageUrl?: string;
  available: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  actualEndTime?: string;
  returnedEarly?: boolean;
  createdAt?: number;
  bookingCode?: string;
  checkedInAt?: number | object;
}

export type RootStackParamList = {
  BrowseRooms: undefined;
  RoomDetail: {
    room: Room;
  };
  MyBookings: undefined;
  Profile: undefined;
  QRCheckIn: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type UserRole = 'tenant' | 'landlord';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export type RoomStatus = 'active' | 'rented' | 'paused';

export interface Room {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  title: string;
  description: string;
  price: number; // in GH₵ / month
  deposit: number; // in GH₵
  roomType: 'Single Room' | 'Self-Contained' | 'Master Bedroom' | 'Shared Room' | 'Entire Apartment' | 'Studio';
  city: string; // Accra, Kumasi, Takoradi, etc.
  neighborhood: string; // East Legon, Cantonments, Osu, etc.
  address: string;
  images: string[];
  amenities: string[]; // Wi-Fi, Air Conditioning, Standby Generator, Poly Tank Reservoir, 24/7 Security, Parking, Furnished, Kitchen Access, Laundry
  billsIncluded: boolean;
  availableDate: string;
  minLeaseMonths: number; // 6, 12, 24
  rules: string[]; // No smoking, Pets allowed, Quiet hours after 10 PM, etc.
  status: RoomStatus;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'declined' | 'tour_scheduled';
export type TourType = 'inperson' | 'virtual';

export interface RoomApplication {
  id: string;
  roomId: string;
  roomTitle: string;
  roomImage: string;
  roomPrice: number;
  roomCity: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  status: ApplicationStatus;
  moveInDate: string;
  leaseMonths: number;
  occupation: string;
  monthlyIncome: number;
  bio?: string;
  tourDate?: string;
  tourType?: TourType;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // [tenantId, landlordId]
  roomId: string;
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface DatabaseSchema {
  users: User[];
  rooms: Room[];
  applications: RoomApplication[];
  conversations: Conversation[];
  messages: Message[];
}

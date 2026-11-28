export type ParticipantType = 'customer' | 'agent' | 'admin' | 'manager';

export type SenderRole = 'admin' | 'manager' | 'agent' | 'customer';

export interface StaffContact {
  id: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Agent';
  phone?: string | null;
  avatarUrl?: string | null;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderProfileId?: string | null;
  senderName: string;
  senderRole: SenderRole;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  conversationType?: 'delivery' | 'direct_staff';
  participantId: string;
  participantName: string;
  participantType: ParticipantType;
  participantPhone?: string | null;
  participantAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageRole?: SenderRole | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  isOnline: boolean;
  relatedDeliveryId?: string | null;
  relatedDeliveryTracking?: string | null;
  deliveryStatus?: string | null;
  codAmount?: number | null;
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  visibility?: 'public' | 'staff_only';
}

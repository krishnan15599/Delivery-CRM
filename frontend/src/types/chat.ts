export type ParticipantType = 'customer' | 'agent';

export type SenderRole = 'admin' | 'customer' | 'agent';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantType: ParticipantType;
  participantPhone?: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageRole?: SenderRole;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  relatedDeliveryId?: string;
  relatedDeliveryTracking?: string;
  deliveryStatus?: string;
  codAmount?: number;
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  senderRole?: SenderRole;
}

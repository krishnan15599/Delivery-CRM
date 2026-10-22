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
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  relatedDeliveryTracking?: string;
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  senderRole?: SenderRole;
}

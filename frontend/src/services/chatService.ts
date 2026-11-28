import { io, type Socket } from 'socket.io-client';
import api from './api';
import API_ENDPOINTS from '../constants/endpoints';
import type {
  ChatMessage,
  Conversation,
  ParticipantType,
  SendMessageInput,
  SenderRole,
  StaffContact,
} from '../types/chat';

const SOCKET_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://delivery-crm-7fl4.onrender.com/api'
).replace(/\/api\/?$/, '');

const formatTime = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const mapConversation = (row: Record<string, unknown>): Conversation => ({
  id: String(row.id),
  conversationType: (row.conversation_type as 'delivery' | 'direct_staff') || 'direct_staff',
  participantId: String(row.participant_id || ''),
  participantName: String(row.participant_name || 'Staff'),
  participantType: ((row.participant_type as string) || 'agent').toLowerCase() as ParticipantType,
  participantPhone: (row.participant_phone as string) || null,
  participantAvatar: (row.participant_avatar as string) || null,
  lastMessage: (row.last_message as string) || null,
  lastMessageRole: ((row.last_message_role as string) || null) as SenderRole | null,
  lastMessageTime: formatTime((row.last_message_time as string) || (row.updated_at as string)),
  unreadCount: Number(row.unread_count || 0),
  isOnline: Boolean(row.is_online),
  relatedDeliveryId: (row.delivery_id as string) || null,
  relatedDeliveryTracking: (row.related_delivery_tracking as string) || null,
});

const mapMessage = (row: Record<string, unknown>): ChatMessage => ({
  id: String(row.id),
  conversationId: String(row.conversation_id),
  senderId: String(row.sender_profile_id || row.sender_id || ''),
  senderProfileId: (row.sender_profile_id as string) || null,
  senderName: String(row.sender_name || 'Staff'),
  senderRole: ((row.sender_role as string) || 'agent').toLowerCase() as SenderRole,
  text: String(row.text || ''),
  timestamp: formatTime((row.created_at as string) || (row.timestamp as string)),
  read: Boolean(row.read_by_staff ?? row.read),
});

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  isOnline: boolean;
}

export interface ConversationUpdatedEvent {
  conversationId: string;
  lastMessage: string;
  lastMessageRole: SenderRole;
  lastMessageTime: string;
  senderId: string;
}

class SocketChatService {
  private socket: Socket | null = null;

  connect(): Socket | null {
    const token = localStorage.getItem('delivery_crm_auth_token');
    if (!token) return null;

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async getStaffContacts(): Promise<StaffContact[]> {
    const res = await api.get<{ data: StaffContact[] }>(API_ENDPOINTS.CHAT.CONTACTS);
    return res.data.data || [];
  }

  async getConversations(type?: 'delivery' | 'direct_staff'): Promise<Conversation[]> {
    const res = await api.get<{ data: Record<string, unknown>[] }>(
      API_ENDPOINTS.CHAT.CONVERSATIONS,
      type ? { params: { type } } : undefined
    );
    return (res.data.data || []).map(mapConversation);
  }

  async startDirectChat(targetProfileId: string): Promise<Conversation> {
    const res = await api.post<{ data: { conversation: Record<string, unknown> } }>(
      API_ENDPOINTS.CHAT.DIRECT,
      { targetProfileId }
    );
    return mapConversation(res.data.data.conversation);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await api.get<{ data: { messages: Record<string, unknown>[] } }>(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId)
    );
    return (res.data.data?.messages || []).map(mapMessage);
  }

  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    if (this.socket && this.socket.connected) {
      return new Promise<ChatMessage>((resolve, reject) => {
        this.socket!.emit(
          'chat:send',
          {
            conversationId: input.conversationId,
            text: input.text,
            visibility: input.visibility,
          },
          (ack: { ok: boolean; data?: Record<string, unknown>; error?: string }) => {
            if (ack?.ok && ack.data) {
              resolve(mapMessage(ack.data));
            } else {
              reject(new Error(ack?.error || 'Failed to send message'));
            }
          }
        );
      });
    }

    const res = await api.post<{ data: Record<string, unknown> }>(
      API_ENDPOINTS.CHAT.MESSAGES(input.conversationId),
      { text: input.text, visibility: input.visibility }
    );
    return mapMessage(res.data.data);
  }

  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(API_ENDPOINTS.CHAT.READ(conversationId));
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('chat:join', conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('chat:leave', conversationId);
  }

  emitTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('chat:typing', { conversationId, isTyping });
  }

  onMessage(cb: (msg: ChatMessage) => void): () => void {
    const socket = this.connect();
    if (!socket) return () => {};
    const handler = (raw: Record<string, unknown>) => cb(mapMessage(raw));
    socket.on('chat:message', handler);
    return () => {
      socket.off('chat:message', handler);
    };
  }

  onTyping(cb: (evt: TypingEvent) => void): () => void {
    const socket = this.connect();
    if (!socket) return () => {};
    socket.on('chat:typing', cb);
    return () => {
      socket.off('chat:typing', cb);
    };
  }

  onPresence(cb: (evt: PresenceEvent) => void): () => void {
    const socket = this.connect();
    if (!socket) return () => {};
    socket.on('chat:presence', cb);
    return () => {
      socket.off('chat:presence', cb);
    };
  }

  onConversationUpdated(cb: (evt: ConversationUpdatedEvent) => void): () => void {
    const socket = this.connect();
    if (!socket) return () => {};
    socket.on('chat:conversation_updated', cb);
    return () => {
      socket.off('chat:conversation_updated', cb);
    };
  }
}

export const chatService = new SocketChatService();

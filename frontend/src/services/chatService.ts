import { mockStorage, delay } from './mockStorage';
import type { Conversation, ChatMessage, SendMessageInput } from '../types/chat';

type MessageListener = (msg: ChatMessage) => void;
type TypingListener = (isTyping: boolean) => void;

class MockChatService {
  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private typingListeners: Map<string, Set<TypingListener>> = new Map();

  async getConversations(): Promise<Conversation[]> {
    await delay(200);
    return mockStorage.getConversations();
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(200);
    const messages = mockStorage.getMessages();
    return messages.filter((m) => m.conversationId === conversationId);
  }

  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    await delay(150);
    const messages = mockStorage.getMessages();
    const conversations = mockStorage.getConversations();
    const conv = conversations.find((c) => c.id === input.conversationId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      conversationId: input.conversationId,
      senderId: 'admin',
      senderName: 'Admin (Support)',
      senderRole: input.senderRole || 'admin',
      text: input.text,
      timestamp: timeStr,
      read: true,
    };

    const updatedMessages = [...messages, newMsg];
    mockStorage.setMessages(updatedMessages);

    // Update conversation last message
    if (conv) {
      conv.lastMessage = input.text;
      conv.lastMessageTime = timeStr;
      mockStorage.setConversations(conversations);
    }

    // Notify listeners
    this.broadcastMessage(input.conversationId, newMsg);

    // Trigger mock auto-reply simulation
    this.scheduleAutoReply(input.conversationId, conv?.participantName || 'Customer');

    return newMsg;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await delay(100);
    const messages = mockStorage.getMessages();
    const conversations = mockStorage.getConversations();

    const updatedMessages = messages.map((m) => {
      if (m.conversationId === conversationId) {
        return { ...m, read: true };
      }
      return m;
    });
    mockStorage.setMessages(updatedMessages);

    const convIndex = conversations.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      conversations[convIndex].unreadCount = 0;
      mockStorage.setConversations(conversations);
    }
  }

  // Real-time Mock Subscription (WebSocket simulation)
  subscribeMessages(conversationId: string, listener: MessageListener): () => void {
    if (!this.messageListeners.has(conversationId)) {
      this.messageListeners.set(conversationId, new Set());
    }
    this.messageListeners.get(conversationId)?.add(listener);

    return () => {
      this.messageListeners.get(conversationId)?.delete(listener);
    };
  }

  subscribeTyping(conversationId: string, listener: TypingListener): () => void {
    if (!this.typingListeners.has(conversationId)) {
      this.typingListeners.set(conversationId, new Set());
    }
    this.typingListeners.get(conversationId)?.add(listener);

    return () => {
      this.typingListeners.get(conversationId)?.delete(listener);
    };
  }

  private broadcastMessage(conversationId: string, message: ChatMessage) {
    const listeners = this.messageListeners.get(conversationId);
    listeners?.forEach((cb) => cb(message));
  }

  private broadcastTyping(conversationId: string, isTyping: boolean) {
    const listeners = this.typingListeners.get(conversationId);
    listeners?.forEach((cb) => cb(isTyping));
  }

  private scheduleAutoReply(conversationId: string, participantName: string) {
    setTimeout(() => {
      // Simulate typing indicator
      this.broadcastTyping(conversationId, true);

      setTimeout(() => {
        this.broadcastTyping(conversationId, false);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const replies = [
          `Thanks for the update! Looking forward to receiving the package.`,
          `Understood, I am at home and available to collect.`,
          `Could you please ask the delivery agent to ring the bell twice?`,
          `Got it! Thank you for the quick support.`,
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg: ChatMessage = {
          id: `MSG-${Date.now()}`,
          conversationId,
          senderId: 'participant',
          senderName: participantName,
          senderRole: 'customer',
          text: randomReply,
          timestamp: timeStr,
          read: false,
        };

        const messages = mockStorage.getMessages();
        mockStorage.setMessages([...messages, replyMsg]);

        const conversations = mockStorage.getConversations();
        const conv = conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.lastMessage = randomReply;
          conv.lastMessageTime = timeStr;
          conv.unreadCount += 1;
          mockStorage.setConversations(conversations);
        }

        this.broadcastMessage(conversationId, replyMsg);
      }, 1800);
    }, 1200);
  }
}

export const chatService = new MockChatService();

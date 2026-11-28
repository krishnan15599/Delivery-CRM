import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import type { ChatMessage, Conversation, SenderRole, StaffContact } from '../../types/chat';
import { ChatSidebar, ChatWindow, type ChatFilter } from './components';

const QUICK_REPLIES = [
  'Please prioritize this delivery',
  'On my way to the pickup hub',
  'Customer requested a callback',
  'COD amount settled at hub',
];

export const Chat: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const currentUserId = user?.id || '';
  const currentUserRole = (user?.role?.toLowerCase() || 'agent') as SenderRole;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [staffContacts, setStaffContacts] = useState<StaffContact[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterType, setFilterType] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const activeConvIdRef = useRef<string>('');
  const typingTimeoutRef = useRef<number | null>(null);
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // Load conversations & eligible staff contacts, and connect Socket.IO
  useEffect(() => {
    let isMounted = true;
    chatService.connect();

    Promise.all([
      chatService.getConversations('direct_staff'),
      chatService.getStaffContacts(),
    ])
      .then(([convs, contacts]) => {
        if (!isMounted) return;
        setConversations(convs);
        setStaffContacts(contacts);
        if (convs.length > 0 && window.matchMedia('(min-width: 768px)').matches) {
          setActiveConvId(convs[0].id);
        }
      })
      .catch(() => {
        if (isMounted) toastRef.current.error('Could not load staff chat');
      });

    const offPresence = chatService.onPresence(({ userId, isOnline }) => {
      setStaffContacts((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, isOnline } : c))
      );
      setConversations((prev) =>
        prev.map((c) => (c.participantId === userId ? { ...c, isOnline } : c))
      );
    });

    const offConvUpdated = chatService.onConversationUpdated((evt) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === evt.conversationId);
        if (!exists) {
          void chatService.getConversations('direct_staff').then((fresh) => setConversations(fresh));
          return prev;
        }
        const isCurrent = activeConvIdRef.current === evt.conversationId;
        const updated = prev.map((c) =>
          c.id === evt.conversationId
            ? {
                ...c,
                lastMessage: evt.lastMessage,
                lastMessageRole: evt.lastMessageRole,
                lastMessageTime: new Date(evt.lastMessageTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                unreadCount:
                  isCurrent || evt.senderId === currentUserId ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        );
        return updated;
      });
    });

    const offMessage = chatService.onMessage((newMsg) => {
      if (newMsg.conversationId !== activeConvIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.senderId !== currentUserId) {
        void chatService.markAsRead(newMsg.conversationId);
      }
    });

    const offTyping = chatService.onTyping((evt) => {
      if (evt.conversationId !== activeConvIdRef.current) return;
      if (evt.userId === currentUserId) return;
      setTypingUserName(evt.isTyping ? evt.userName : null);
    });

    return () => {
      isMounted = false;
      offPresence();
      offConvUpdated();
      offMessage();
      offTyping();
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUserId]);

  // Load messages & join Socket.IO room when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    setTypingUserName(null);
    chatService.joinConversation(activeConvId);

    chatService
      .getMessages(activeConvId)
      .then((msgs) => {
        if (!isMounted) return;
        setMessages(msgs);
        void chatService.markAsRead(activeConvId);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => {
        if (isMounted) toastRef.current.error('Could not load messages');
      });

    return () => {
      isMounted = false;
      chatService.leaveConversation(activeConvId);
    };
  }, [activeConvId]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId),
    [conversations, activeConvId]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((c) => {
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'unread' ? c.unreadCount > 0 : c.participantType === filterType);

      if (!matchesFilter) return false;
      if (!query) return true;

      const searchable = [
        c.participantName,
        c.relatedDeliveryTracking || '',
        c.lastMessage || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [conversations, filterType, searchQuery]);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setIsMobileChatOpen(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleStartDirectChat = async (contactId: string) => {
    try {
      const conv = await chatService.startDirectChat(contactId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setActiveConvId(conv.id);
      setIsMobileChatOpen(true);
      setSearchQuery('');
    } catch {
      toast.error('Unable to start chat with this staff member');
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (!activeConvId) return;

    chatService.emitTyping(activeConvId, Boolean(value.trim()));
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    if (value.trim()) {
      typingTimeoutRef.current = window.setTimeout(() => {
        chatService.emitTyping(activeConvId, false);
      }, 1500);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConvId) return;

    setInputText('');
    chatService.emitTyping(activeConvId, false);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    try {
      const sentMsg = await chatService.sendMessage({
        conversationId: activeConvId,
        text,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                lastMessage: text,
                lastMessageRole: currentUserRole,
                lastMessageTime: sentMsg.timestamp,
              }
            : c
        )
      );
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-[#F2F5F4]">
      <ChatSidebar
        conversations={filteredConversations}
        staffContacts={staffContacts}
        currentUserRole={currentUserRole}
        activeConvId={activeConvId}
        searchQuery={searchQuery}
        activeFilter={filterType}
        unreadTotal={unreadTotal}
        isHiddenOnMobile={isMobileChatOpen}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterType}
        onSelectConversation={handleSelectConversation}
        onStartDirectChat={handleStartDirectChat}
      />

      <ChatWindow
        conversation={activeConv}
        messages={messages}
        currentUserId={currentUserId}
        inputText={inputText}
        typingUserName={typingUserName}
        quickReplies={QUICK_REPLIES}
        isVisibleOnMobile={isMobileChatOpen}
        onBack={() => setIsMobileChatOpen(false)}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Chat;

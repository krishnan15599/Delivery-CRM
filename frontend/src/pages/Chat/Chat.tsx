import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../components/common';
import { chatService } from '../../services/chatService';
import type { ChatMessage, Conversation } from '../../types/chat';
import { ChatSidebar, ChatWindow, type ChatFilter } from './components';

const QUICK_REPLIES = [
  'Agent is on the way',
  'Share tracking link',
  'Reschedule delivery',
  'Please confirm your address',
];

export const Chat: React.FC = () => {
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterType, setFilterType] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Load conversations once on mount
  useEffect(() => {
    let isMounted = true;
    chatService.getConversations().then((data) => {
      if (!isMounted) return;
      setConversations(data);
      if (data.length > 0 && window.matchMedia('(min-width: 768px)').matches) {
        setActiveConvId(data[0].id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load messages & subscribe to real-time updates for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    setIsTyping(false);

    chatService.getMessages(activeConvId).then((msgs) => {
      if (!isMounted) return;
      setMessages(msgs);
      void chatService.markAsRead(activeConvId);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
      );
    });

    const unsubscribeMsg = chatService.subscribeMessages(activeConvId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    const unsubscribeTyping = chatService.subscribeTyping(activeConvId, (typing) => {
      setIsTyping(typing);
    });

    return () => {
      isMounted = false;
      unsubscribeMsg();
      unsubscribeTyping();
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

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConvId) return;

    setInputText('');
    try {
      const sentMsg = await chatService.sendMessage({
        conversationId: activeConvId,
        text,
        senderRole: 'admin',
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
                lastMessageRole: 'admin',
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
        activeConvId={activeConvId}
        searchQuery={searchQuery}
        activeFilter={filterType}
        unreadTotal={unreadTotal}
        isHiddenOnMobile={isMobileChatOpen}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterType}
        onSelectConversation={handleSelectConversation}
      />

      <ChatWindow
        conversation={activeConv}
        messages={messages}
        inputText={inputText}
        isTyping={isTyping}
        quickReplies={QUICK_REPLIES}
        isVisibleOnMobile={isMobileChatOpen}
        onBack={() => setIsMobileChatOpen(false)}
        onInputChange={setInputText}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Chat;

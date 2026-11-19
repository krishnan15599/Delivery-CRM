import React, { useEffect, useState, useRef } from 'react';
import {
  Send,
  Search,
  User,
  Truck,
  Package,
  Phone,
  Circle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  Badge,
  useToast,
} from '../../components/common';
import { chatService } from '../../services/chatService';
import type { Conversation, ChatMessage, ParticipantType } from '../../types/chat';

export const Chat: React.FC = () => {
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterType, setFilterType] = useState<'all' | ParticipantType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    chatService.getConversations().then((data) => {
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    });
  }, [activeConvId]);

  // Load messages & setup WebSocket simulation for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    chatService.getMessages(activeConvId).then((msgs) => {
      setMessages(msgs);
      chatService.markAsRead(activeConvId);
      // update conversation unread in state
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
      );
    });

    // Subscribe to new real-time messages
    const unsubscribeMsg = chatService.subscribeMessages(activeConvId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Subscribe to typing indicator
    const unsubscribeTyping = chatService.subscribeTyping(activeConvId, (typing) => {
      setIsTyping(typing);
    });

    return () => {
      unsubscribeMsg();
      unsubscribeTyping();
    };
  }, [activeConvId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConvId) return;

    setInputText('');
    try {
      const sentMsg = await chatService.sendMessage({
        conversationId: activeConvId,
        text,
        senderRole: 'admin',
      });
      setMessages((prev) => [...prev, sentMsg]);

      // update conversation snippet
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: text, lastMessageTime: 'Just now' }
            : c
        )
      );
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesType = filterType === 'all' || c.participantType === filterType;
    const matchesSearch =
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.relatedDeliveryTracking && c.relatedDeliveryTracking.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const quickReplies = [
    'Your order is out for delivery with our field agent.',
    'Agent is arriving at your doorstep shortly.',
    'Please share your 4-digit verification code with the agent.',
    'Could you confirm the exact delivery address landmark?',
  ];

  return (
    <div className="space-y-4 pb-6 h-[calc(100vh-100px)] flex flex-col">
      <PageHeader
        title="Operations Chat"
        subtitle="Live communication inbox with customers and on-field delivery agents."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Chat Inbox' },
        ]}
      />

      {/* Main Chat Layout */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Left Sidebar: Conversations */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col h-full bg-slate-50/40">
          {/* Search & Tabs */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('customer')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  filterType === 'customer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Customers
              </button>
              <button
                type="button"
                onClick={() => setFilterType('agent')}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  filterType === 'agent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Agents
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">
                        {conv.participantType === 'agent' ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                          conv.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {conv.participantName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mb-1">
                        {conv.lastMessage || 'No messages yet'}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          {conv.participantType}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        {activeConv ? (
          <div className="flex-1 flex flex-col h-full bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                    {activeConv.participantName.charAt(0)}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                      activeConv.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeConv.participantName}
                    </h3>
                    <Badge variant={activeConv.participantType === 'agent' ? 'primary' : 'neutral'} size="sm">
                      {activeConv.participantType === 'agent' ? 'Field Agent' : 'Customer'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    {activeConv.participantPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {activeConv.participantPhone}
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Circle className={`w-2 h-2 ${activeConv.isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-300 text-slate-300'}`} />
                      {activeConv.isOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {activeConv.relatedDeliveryTracking && (
                <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>Tracking:</span>
                  <Link
                    to={`/deliveries/${activeConv.relatedDeliveryTracking}`}
                    className="font-bold underline hover:text-indigo-800"
                  >
                    {activeConv.relatedDeliveryTracking}
                  </Link>
                </div>
              )}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50">
              {messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isAdmin
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 px-1">
                      <span>{msg.senderName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white p-2.5 rounded-xl border border-slate-100 max-w-xs animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {activeConv.participantName} is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Carousel */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Quick templates:
              </span>
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(reply)}
                  className="bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full px-3 py-1 text-slate-600 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeConv.participantName}... (Press Enter to send)`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600"
              />

              <button
                type="button"
                disabled={!inputText.trim()}
                onClick={() => handleSendMessage()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white transition-colors cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Select a conversation from the left to view messages
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

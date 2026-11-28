import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io, type Socket } from 'socket.io-client';
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  UserCheck,
  Send,
  MessageSquare,
  Radio,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  StatusBadge,
  StatusTimeline,
  Button,
  Input,
  type TimelineEvent,
} from '../../components/common';
import { API_ENDPOINTS } from '../../constants/endpoints';
import type { DeliveryStatus, DeliveryTimelineEvent } from '../../types/delivery';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://delivery-crm-7fl4.onrender.com/api';
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

interface PublicTrackingInfo {
  trackingNumber: string;
  status: DeliveryStatus;
  city?: string | null;
  packageType?: string;
  scheduledDate?: string | null;
  timeline: DeliveryTimelineEvent[];
  agentFirstName?: string | null;
  updatedAt?: string | null;
}

interface PublicChatMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  sender_type?: string;
  text: string;
  timestamp?: string;
  created_at?: string;
}

interface ChatCapabilities {
  canSend?: boolean;
  reason?: string;
  agentChatActive?: boolean;
}

const PROGRESS_STEPS: DeliveryStatus[] = [
  'Order Created',
  'Received at Hub',
  'Ready for Dispatch',
  'Assigned',
  'Picked Up',
  'Out for Delivery',
  'Delivered',
];

export const CustomerTracking: React.FC = () => {
  const { trackingToken } = useParams<{ trackingToken: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PublicTrackingInfo | null>(null);

  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [capabilities, setCapabilities] = useState<ChatCapabilities>({ canSend: true });
  const [chatText, setChatText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackingToken) return;
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [infoRes, chatRes] = await Promise.all([
          publicApi.get<{ data: PublicTrackingInfo }>(API_ENDPOINTS.TRACKING.INFO(trackingToken)),
          publicApi.get<{
            data: {
              messages: PublicChatMessage[];
              capabilities: ChatCapabilities;
            };
          }>(API_ENDPOINTS.TRACKING.CHAT(trackingToken)),
        ]);

        if (!active) return;
        setInfo(infoRes.data.data);
        setMessages(chatRes.data.data?.messages || []);
        setCapabilities(chatRes.data.data?.capabilities || { canSend: true });
      } catch (err: any) {
        if (!active) return;
        setError(
          err?.response?.data?.message || 'Tracking link not found or expired.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [trackingToken]);

  // Live Socket.IO updates on /track namespace
  useEffect(() => {
    if (!trackingToken) return;

    const socket: Socket = io(`${SOCKET_ORIGIN}/track`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('track:join', { trackingToken }, (ack: { ok?: boolean }) => {
        setSocketConnected(Boolean(ack?.ok));
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('track:status_updated', (payload: Partial<PublicTrackingInfo>) => {
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status || prev.status,
              timeline: payload.timeline || prev.timeline,
              scheduledDate:
                payload.scheduledDate !== undefined ? payload.scheduledDate : prev.scheduledDate,
              agentFirstName:
                payload.agentFirstName !== undefined
                  ? payload.agentFirstName
                  : prev.agentFirstName,
              updatedAt: payload.updatedAt || prev.updatedAt,
            }
          : prev
      );
    });

    socket.on('track:message', (msg: PublicChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [trackingToken]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingToken || !chatText.trim() || sending) return;

    try {
      setSending(true);
      setChatError(null);
      const res = await publicApi.post<{ data: PublicChatMessage }>(
        API_ENDPOINTS.TRACKING.SEND_MESSAGE(trackingToken),
        { text: chatText.trim() }
      );
      const created = res.data.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
      setChatText('');
    } catch (err: any) {
      setChatError(err?.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!info?.timeline) return [];
    return [...info.timeline].reverse().map((evt, idx) => ({
      id: `${evt.status}-${idx}`,
      title: evt.status,
      description: evt.note,
      timestamp: evt.timestamp,
      status:
        evt.status === 'Failed' || evt.status === 'Returned to Hub'
          ? 'failed'
          : idx === 0 && info.status !== 'Delivered'
          ? 'current'
          : 'completed',
    }));
  }, [info]);

  const currentStepIdx = info ? PROGRESS_STEPS.indexOf(info.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Truck className="w-8 h-8 text-indigo-600 mx-auto animate-bounce" />
          <p className="text-sm text-slate-600">Loading your shipment status...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-3 py-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900">Tracking Link Unavailable</h1>
          <p className="text-sm text-slate-600">{error || 'This tracking link is invalid.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Brand Header */}
      <header className="bg-[#0F2A2E] text-white py-4 px-4 sm:px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Delivery CRM Express</div>
              <div className="text-[11px] text-emerald-200/80">Live Shipment Tracking</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Radio
              className={`w-3.5 h-3.5 ${
                socketConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span className={socketConnected ? 'text-emerald-200' : 'text-slate-300'}>
              {socketConnected ? 'Live Updates On' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Summary Card */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tracking Number
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {info.trackingNumber}
                </h1>
                <StatusBadge status={info.status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              {info.scheduledDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Est. Date: {info.scheduledDate}</span>
                </div>
              )}
              {info.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Destination: {info.city}</span>
                </div>
              )}
              {info.agentFirstName && (
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  <span>Courier: {info.agentFirstName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Progress Stepper */}
          <div className="pt-5 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] gap-2">
              {PROGRESS_STEPS.map((step, idx) => {
                const isDone = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                        isDone
                          ? isCurrent && info.status !== 'Delivered'
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone && (!isCurrent || info.status === 'Delivered') ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium leading-tight ${
                        isDone ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Shipment Timeline</h2>
            </div>
            {timelineEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No tracking updates yet.</p>
            ) : (
              <StatusTimeline events={timelineEvents} />
            )}
          </Card>

          {/* Customer Support & Delivery Chat */}
          <Card className="flex flex-col h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Delivery Support Chat</h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {capabilities.agentChatActive ? 'Courier & Support' : 'Support Team'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Need help with your delivery? Send a message below.
                </p>
              ) : (
                messages.map((m) => {
                  const isCustomer = m.sender_role === 'customer' || m.sender_type === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {isCustomer ? 'You' : m.sender_name}
                      </span>
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isCustomer
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {chatError && (
              <p className="text-[11px] text-rose-600 mb-1.5">{chatError}</p>
            )}

            {capabilities.canSend === false ? (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 text-center">
                {capabilities.reason || 'This conversation is closed.'}
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="pt-3 border-t border-slate-100 flex items-center gap-2"
              >
                <Input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={sending}
                  disabled={!chatText.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CustomerTracking;

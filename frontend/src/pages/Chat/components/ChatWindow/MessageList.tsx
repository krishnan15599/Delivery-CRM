import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../../../types/chat';
import { MessageBubble } from './MessageBubble';

export interface MessageListProps {
  messages: ChatMessage[];
  participantName: string;
  isTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  participantName,
  isTyping,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const displayName = participantName.replace(/\s*\(Agent\)\s*$/i, '').trim();

  return (
    <div
      className="flex-1 overflow-y-auto p-3.5 sm:p-5 flex flex-col gap-1.5 bg-[#F2F5F4]"
      aria-live="polite"
    >
      <span className="self-center text-[12px] text-[#5E716F] bg-white border border-[#DDE5E3] rounded-full px-3 py-0.5 my-2">
        Today
      </span>

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isTyping && (
        <div className="self-start text-[#5E716F] text-[13px] px-1.5 py-0.5">
          {displayName} is typing…
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
};

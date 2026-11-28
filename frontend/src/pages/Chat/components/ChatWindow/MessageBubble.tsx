import React from 'react';
import type { ChatMessage } from '../../../../types/chat';

export interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isMe = message.senderRole === 'admin';

  return (
    <div
      className={`max-w-[min(520px,78%)] px-[13px] py-[9px] text-[14px] leading-[1.5] break-words border ${
        isMe
          ? 'self-end bg-[#0F2A2E] text-white border-[#0F2A2E] rounded-[16px_16px_4px_16px]'
          : 'self-start bg-white text-[#10201F] border-[#DDE5E3] rounded-[16px_16px_16px_4px]'
      }`}
    >
      <p className="m-0 whitespace-pre-wrap">{message.text}</p>
      <time className="block text-[11px] opacity-65 mt-0.5 text-right">
        {message.timestamp}
        {isMe ? ' · Sent' : ''}
      </time>
    </div>
  );
};

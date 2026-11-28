import React from 'react';
import type { ChatMessage, Conversation } from '../../../../types/chat';
import { ChatHeader } from './ChatHeader';
import { DeliveryContextBar } from './DeliveryContextBar';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { EmptyChatState } from './EmptyChatState';

export interface ChatWindowProps {
  conversation?: Conversation;
  messages: ChatMessage[];
  currentUserId: string;
  inputText: string;
  typingUserName: string | null;
  quickReplies: string[];
  isVisibleOnMobile: boolean;
  onBack: () => void;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  inputText,
  typingUserName,
  quickReplies,
  isVisibleOnMobile,
  onBack,
  onInputChange,
  onSendMessage,
}) => {
  return (
    <section
      aria-label="Conversation"
      className={`flex-1 flex-col min-w-0 min-h-0 h-full bg-[#F2F5F4] ${
        isVisibleOnMobile ? 'flex' : 'hidden md:flex'
      }`}
    >
      {conversation ? (
        <>
          <ChatHeader conversation={conversation} onBack={onBack} />
          <DeliveryContextBar conversation={conversation} />
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            typingUserName={typingUserName}
          />
          <ChatComposer
            value={inputText}
            quickReplies={quickReplies}
            onChange={onInputChange}
            onSend={onSendMessage}
          />
        </>
      ) : (
        <EmptyChatState />
      )}
    </section>
  );
};

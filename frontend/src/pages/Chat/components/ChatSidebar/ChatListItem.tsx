import React from 'react';
import type { Conversation } from '../../../../types/chat';

export interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const getInitials = (name: string): string =>
  name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  isActive,
  onSelect,
}) => {
  const hasUnread = conversation.unreadCount > 0;
  const isAgent = conversation.participantType === 'agent';
  const displayName = conversation.participantName.replace(/\s*\(Agent\)\s*$/i, '').trim();

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? 'true' : undefined}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 w-full text-left px-2.5 py-[11px] rounded-[12px] transition-colors cursor-pointer ${
        isActive ? 'bg-[#EAF1F0]' : 'hover:bg-[#F2F5F4]'
      }`}
    >
      {/* Avatar with online status indicator */}
      <span className="relative w-[38px] h-[38px] rounded-full bg-[#2B5B62] text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
        {getInitials(displayName)}
        {conversation.isOnline && (
          <span
            className="absolute right-0 bottom-0 w-[11px] h-[11px] rounded-full bg-[#1E8E5A] border-2 border-white"
            aria-label="Online"
          />
        )}
      </span>

      {/* Name & last message preview */}
      <div className="min-w-0">
        <div className="font-semibold text-[14px] text-[#10201F] truncate">
          <span
            className={`inline-block text-[11px] font-semibold rounded-[6px] px-1.5 mr-1.5 ${
              isAgent
                ? 'bg-[#FCEFCF] text-[#A66A00]'
                : 'bg-[#E0EAFB] text-[#2563C9]'
            }`}
          >
            {isAgent ? 'Agent' : 'Customer'}
          </span>
          {displayName}
        </div>
        <div
          className={`text-[13px] truncate ${
            hasUnread ? 'text-[#10201F] font-medium' : 'text-[#5E716F]'
          }`}
        >
          {conversation.lastMessageRole === 'admin' ? 'You: ' : ''}
          {conversation.lastMessage || 'No messages yet'}
        </div>
      </div>

      {/* Timestamp & unread count */}
      <div className="flex flex-col items-end gap-1.5 min-w-[34px]">
        <span className="text-[12px] text-[#5E716F] whitespace-nowrap">
          {conversation.lastMessageTime || ''}
        </span>
        {hasUnread && (
          <span className="bg-[#F2B705] text-[#2A2000] text-[12px] font-semibold rounded-full min-w-[20px] px-1.5 text-center leading-[18px]">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

import React from 'react';
import { ChevronLeft, Phone } from 'lucide-react';
import type { Conversation } from '../../../../types/chat';

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
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

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, onBack }) => {
  const isAgent = conversation.participantType === 'agent';
  const displayName = conversation.participantName.replace(/\s*\(Agent\)\s*$/i, '').trim();

  return (
    <header className="bg-white border-b border-[#DDE5E3] px-3.5 sm:px-5 py-3 flex items-center gap-3 shrink-0">
      {/* Mobile Back Button */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to chats"
        className="md:hidden border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 grid place-items-center text-[#10201F] cursor-pointer"
      >
        <ChevronLeft className="w-[18px] h-[18px]" />
      </button>

      {/* Avatar */}
      <span className="relative w-[38px] h-[38px] rounded-full bg-[#2B5B62] text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
        {getInitials(displayName)}
        {conversation.isOnline && (
          <span
            className="absolute right-0 bottom-0 w-[11px] h-[11px] rounded-full bg-[#1E8E5A] border-2 border-white"
            aria-label="Online"
          />
        )}
      </span>

      {/* Participant Info */}
      <div className="flex-1 min-w-0">
        <b className="block font-semibold text-[16px] font-['Bricolage_Grotesque',sans-serif] text-[#10201F] truncate leading-tight">
          {displayName}
        </b>
        <small className="block text-[12px] text-[#5E716F] truncate">
          {conversation.isOnline ? 'Online now' : 'Last seen today'} ·{' '}
          {isAgent ? 'Delivery agent' : 'Customer'}
        </small>
      </div>

      {/* Call Action */}
      {conversation.participantPhone && (
        <a
          href={`tel:${conversation.participantPhone.replace(/\s+/g, '')}`}
          aria-label={`Call ${displayName}`}
          title={conversation.participantPhone}
          className="border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 grid place-items-center text-[#10201F] transition-colors"
        >
          <Phone className="w-[18px] h-[18px]" />
        </a>
      )}
    </header>
  );
};

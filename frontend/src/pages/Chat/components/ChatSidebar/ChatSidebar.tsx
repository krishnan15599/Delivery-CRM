import React from 'react';
import { Search } from 'lucide-react';
import type { Conversation } from '../../../../types/chat';
import { ChatFilterTabs, type ChatFilter } from './ChatFilterTabs';
import { ChatListItem } from './ChatListItem';

export interface ChatSidebarProps {
  conversations: Conversation[];
  activeConvId: string;
  searchQuery: string;
  activeFilter: ChatFilter;
  unreadTotal: number;
  isHiddenOnMobile: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: ChatFilter) => void;
  onSelectConversation: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConvId,
  searchQuery,
  activeFilter,
  unreadTotal,
  isHiddenOnMobile,
  onSearchChange,
  onFilterChange,
  onSelectConversation,
}) => {
  return (
    <section
      aria-label="Conversations"
      className={`bg-white border-r border-[#DDE5E3] flex-col min-h-0 h-full w-full md:w-[300px] lg:w-[340px] shrink-0 ${
        isHiddenOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Sidebar Header: Title, Search, Filter Tabs */}
      <div className="px-4 pt-4 pb-2.5 grid gap-3 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          <h1 className="text-[22px] font-bold font-['Bricolage_Grotesque',sans-serif] text-[#10201F] leading-tight">
            Chat
          </h1>
        </div>

        <label className="flex items-center gap-2 border border-[#DDE5E3] rounded-[10px] px-3 py-2 text-[#5E716F] bg-[#F2F5F4] focus-within:border-[#F2B705]">
          <Search className="w-[18px] h-[18px] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, order or message"
            aria-label="Search chats"
            className="border-0 bg-transparent outline-none flex-1 text-[14px] text-[#10201F] placeholder:text-[#5E716F] min-w-0"
          />
        </label>

        <ChatFilterTabs
          activeFilter={activeFilter}
          unreadTotal={unreadTotal}
          onChangeFilter={onFilterChange}
        />
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pt-1 pb-3 space-y-0.5">
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <ChatListItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConvId}
              onSelect={onSelectConversation}
            />
          ))
        ) : (
          <div className="px-6 py-7 text-center text-[14px] text-[#5E716F]">
            No chats found. Try a different filter or search.
          </div>
        )}
      </div>
    </section>
  );
};

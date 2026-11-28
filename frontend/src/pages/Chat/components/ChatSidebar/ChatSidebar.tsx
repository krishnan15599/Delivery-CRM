import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { Conversation, SenderRole, StaffContact } from '../../../../types/chat';
import { ChatFilterTabs, type ChatFilter } from './ChatFilterTabs';
import { ChatListItem } from './ChatListItem';

export interface ChatSidebarProps {
  conversations: Conversation[];
  staffContacts: StaffContact[];
  currentUserRole?: SenderRole;
  activeConvId: string;
  searchQuery: string;
  activeFilter: ChatFilter;
  unreadTotal: number;
  isHiddenOnMobile: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: ChatFilter) => void;
  onSelectConversation: (id: string) => void;
  onStartDirectChat: (contactId: string) => Promise<void>;
}

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const CONTACT_ROLE_BADGE: Record<StaffContact['role'], string> = {
  Admin: 'bg-[#DDF3E7] text-[#1E8E5A]',
  Manager: 'bg-[#E0EAFB] text-[#2563C9]',
  Agent: 'bg-[#FCEFCF] text-[#A66A00]',
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  staffContacts,
  currentUserRole,
  activeConvId,
  searchQuery,
  activeFilter,
  unreadTotal,
  isHiddenOnMobile,
  onSearchChange,
  onFilterChange,
  onSelectConversation,
  onStartDirectChat,
}) => {
  const [showContacts, setShowContacts] = useState(false);

  const filteredContacts = staffContacts.filter((c) => {
    if (activeFilter !== 'all' && activeFilter !== 'unread') {
      if (c.role.toLowerCase() !== activeFilter) return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.role}`.toLowerCase().includes(q);
  });

  const handlePickContact = async (contactId: string) => {
    await onStartDirectChat(contactId);
    setShowContacts(false);
  };

  const showQuickContacts = !showContacts && conversations.length === 0 && activeFilter !== 'unread';

  return (
    <section
      aria-label="Conversations"
      className={`bg-white border-r border-[#DDE5E3] flex-col min-h-0 h-full w-full md:w-[300px] lg:w-[340px] shrink-0 ${
        isHiddenOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Sidebar Header: Title, New Staff Chat toggle, Search, Filter Tabs */}
      <div className="px-4 pt-4 pb-2.5 grid gap-3 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          <h1 className="text-[22px] font-bold font-['Bricolage_Grotesque',sans-serif] text-[#10201F] leading-tight">
            {showContacts ? 'New Staff Chat' : 'Chat'}
          </h1>
          <button
            type="button"
            onClick={() => setShowContacts((v) => !v)}
            aria-label={showContacts ? 'Back to chats' : 'Start new staff chat'}
            title={showContacts ? 'Back to chats' : 'New staff chat'}
            className="border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] rounded-[10px] p-2 grid place-items-center text-[#10201F] cursor-pointer transition-colors"
          >
            {showContacts ? <X className="w-[18px] h-[18px]" /> : <Plus className="w-[18px] h-[18px]" />}
          </button>
        </div>

        <label className="flex items-center gap-2 border border-[#DDE5E3] rounded-[10px] px-3 py-2 text-[#5E716F] bg-[#F2F5F4] focus-within:border-[#F2B705]">
          <Search className="w-[18px] h-[18px] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={showContacts ? 'Search staff by name or role' : 'Search staff or message'}
            aria-label="Search chats"
            className="border-0 bg-transparent outline-none flex-1 text-[14px] text-[#10201F] placeholder:text-[#5E716F] min-w-0"
          />
        </label>

        <ChatFilterTabs
          activeFilter={activeFilter}
          unreadTotal={unreadTotal}
          currentUserRole={currentUserRole}
          onChangeFilter={onFilterChange}
        />
      </div>

      {/* Scrollable List: Staff Contacts Picker OR Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pt-1 pb-3 space-y-0.5">
        {showContacts || showQuickContacts ? (
          filteredContacts.length > 0 ? (
            <>
              {showQuickContacts && (
                <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E716F]">
                  Staff Directory — click to chat
                </div>
              )}
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handlePickContact(contact.id)}
                  className="grid grid-cols-[auto_1fr] items-center gap-3 w-full text-left px-2.5 py-[11px] rounded-[12px] hover:bg-[#F2F5F4] transition-colors cursor-pointer"
                >
                  <span className="relative w-[38px] h-[38px] rounded-full bg-[#2B5B62] text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
                    {getInitials(contact.name)}
                    {contact.isOnline && (
                      <span className="absolute right-0 bottom-0 w-[11px] h-[11px] rounded-full bg-[#1E8E5A] border-2 border-white" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-[14px] text-[#10201F] truncate">
                      <span
                        className={`inline-block text-[11px] font-semibold rounded-[6px] px-1.5 mr-1.5 ${
                          CONTACT_ROLE_BADGE[contact.role]
                        }`}
                      >
                        {contact.role}
                      </span>
                      {contact.name}
                    </div>
                    <div className="text-[12px] text-[#5E716F]">
                      {contact.isOnline ? 'Online now' : 'Offline'}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-6 py-7 text-center text-[14px] text-[#5E716F]">
              No eligible staff members found.
            </div>
          )
        ) : conversations.length > 0 ? (
          conversations.map((conv) => (
            <ChatListItem
              key={conv.id}
              conversation={conv}
              currentUserRole={currentUserRole}
              isActive={conv.id === activeConvId}
              onSelect={onSelectConversation}
            />
          ))
        ) : (
          <div className="px-6 py-7 text-center text-[14px] text-[#5E716F]">
            No unread chats found.
          </div>
        )}
      </div>
    </section>
  );
};

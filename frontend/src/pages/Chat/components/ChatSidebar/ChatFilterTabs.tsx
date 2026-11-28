import React from 'react';
import type { ParticipantType } from '../../../../types/chat';

export type ChatFilter = 'all' | 'unread' | ParticipantType;

export interface ChatFilterTabsProps {
  activeFilter: ChatFilter;
  unreadTotal: number;
  onChangeFilter: (filter: ChatFilter) => void;
}

export const ChatFilterTabs: React.FC<ChatFilterTabsProps> = ({
  activeFilter,
  unreadTotal,
  onChangeFilter,
}) => {
  const tabs: { key: ChatFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadTotal})` },
    { key: 'customer', label: 'Customers' },
    { key: 'agent', label: 'Agents' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter chats">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChangeFilter(tab.key)}
            className={`rounded-full border px-3 py-[3px] text-[13px] transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#10201F] text-white border-[#10201F]'
                : 'bg-transparent text-[#10201F] border-[#DDE5E3] hover:bg-[#F2F5F4]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

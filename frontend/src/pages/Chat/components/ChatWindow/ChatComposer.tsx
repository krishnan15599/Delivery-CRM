import React, { useRef } from 'react';
import { Send } from 'lucide-react';

export interface ChatComposerProps {
  value: string;
  quickReplies: string[];
  onChange: (value: string) => void;
  onSend: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  quickReplies,
  onChange,
  onSend,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    resizeTextarea(e.target);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
        if (textareaRef.current) {
          textareaRef.current.style.height = '';
        }
      }
    }
  };

  const handleQuickReply = (reply: string) => {
    onChange(reply);
    if (textareaRef.current) {
      textareaRef.current.focus();
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          resizeTextarea(textareaRef.current);
        }
      });
    }
  };

  const handleSendClick = () => {
    if (!value.trim()) return;
    onSend();
    if (textareaRef.current) {
      textareaRef.current.style.height = '';
    }
  };

  return (
    <div className="bg-white border-t border-[#DDE5E3] px-4 pt-2.5 pb-3.5 grid gap-2.5 shrink-0">
      {/* Quick Reply Chips */}
      {quickReplies.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleQuickReply(reply)}
              className="whitespace-nowrap border border-[#DDE5E3] bg-[#F2F5F4] hover:border-[#F2B705] rounded-full px-3 py-1 text-[13px] text-[#10201F] transition-colors cursor-pointer shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Textarea & Send Button */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          aria-label="Message"
          className="flex-1 resize-none border border-[#DDE5E3] focus:border-[#F2B705] bg-[#F2F5F4] text-[#10201F] placeholder:text-[#5E716F] rounded-[12px] px-3 py-2.5 text-[14px] leading-[1.5] max-h-[110px] min-h-[42px] outline-none"
        />

        <button
          type="button"
          disabled={!value.trim()}
          onClick={handleSendClick}
          className="bg-[#F2B705] hover:bg-[#e0a700] text-[#2A2000] rounded-[12px] px-4 h-[42px] font-semibold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-[18px] h-[18px]" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

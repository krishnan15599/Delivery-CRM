import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
  debounceMs = 0,
  autoFocus = false,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const currentValue = isControlled && !debounceMs ? controlledValue : internalValue;

  useEffect(() => {
    if (debounceMs <= 0) return;

    const timer = setTimeout(() => {
      onChange?.(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    if (!debounceMs) {
      onChange?.(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(currentValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  };

  return (
    <div className={cn('relative flex items-center w-full max-w-md', className)}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 pl-10 pr-9 py-2 transition-colors focus:outline-none focus:border-[#2c5fbf] focus:ring-2 focus:ring-[#2c5fbf]/15"
      />
      {currentValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

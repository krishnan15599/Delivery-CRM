import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset?: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tempStart, setTempStart] = useState(value?.startDate || '');
  const [tempEnd, setTempEnd] = useState(value?.endDate || '');

  const toggleOpen = () => {
    if (!isOpen) {
      setTempStart(value?.startDate || '');
      setTempEnd(value?.endDate || '');
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const setPreset = (presetName: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (presetName) {
      case 'Today':
        start = today;
        end = today;
        break;
      case 'Yesterday': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        start = y;
        end = y;
        break;
      }
      case 'Last 7 Days':
        start.setDate(today.getDate() - 6);
        end = today;
        break;
      case 'Last 30 Days':
        start.setDate(today.getDate() - 29);
        end = today;
        break;
      case 'This Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'All Time':
        onChange({ startDate: '', endDate: '', preset: 'All Time' });
        setIsOpen(false);
        return;
    }

    const sStr = formatDate(start);
    const eStr = formatDate(end);
    setTempStart(sStr);
    setTempEnd(eStr);
    onChange({ startDate: sStr, endDate: eStr, preset: presetName });
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      onChange({ startDate: tempStart, endDate: tempEnd, preset: 'Custom' });
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: '', endDate: '', preset: undefined });
    setTempStart('');
    setTempEnd('');
  };

  const hasValue = Boolean(value?.startDate && value?.endDate);
  const displayLabel = hasValue
    ? `${value?.startDate} ~ ${value?.endDate}`
    : value?.preset || placeholder;

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          'flex items-center justify-between gap-2.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2c5fbf]/20 transition-all cursor-pointer min-w-[210px]',
          isOpen ? 'border-[#2c5fbf] ring-2 ring-[#2c5fbf]/15' : ''
        )}
      >
        <div className="flex items-center gap-2 text-gray-600 truncate">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className={hasValue ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasValue && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
              title="Clear date range"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 z-40 bg-white border border-gray-100 rounded-xl shadow-xl p-4 w-72 text-xs">
          <div className="font-semibold text-gray-800 mb-2">Preset Ranges</div>
          <div className="grid grid-cols-2 gap-1.5 mb-3.5">
            {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'].map(
              (p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={cn(
                    'px-2.5 py-1.5 text-left rounded-md transition-colors font-medium',
                    value?.preset === p
                      ? 'bg-blue-50 text-[#1a5bc9] font-semibold'
                      : 'hover:bg-gray-100 text-gray-600'
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="font-semibold text-gray-800 mb-2">Custom Range</div>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-gray-500 block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-[#2c5fbf]"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-[#2c5fbf]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!tempStart || !tempEnd}
              className="mt-3 w-full bg-[#2c5fbf] hover:bg-[#234ca0] disabled:bg-gray-200 text-white font-medium py-1.5 rounded transition-colors text-xs disabled:cursor-not-allowed"
            >
              Apply Custom Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

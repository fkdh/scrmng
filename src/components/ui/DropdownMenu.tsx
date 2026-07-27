'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
  disabled?: boolean;
  className?: string;
}

interface DropdownMenuProps {
  trigger?: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export default function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        {trigger || <MoreVertical className="w-5 h-5 text-gray-500" />}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[160px] max-w-[280px] whitespace-nowrap bg-white rounded-lg shadow-lg border border-gray-200 py-0.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 border-t border-gray-200" />;
            }
            const isDanger = item.variant === 'danger';
            return (
              <button
                key={i}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isDanger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${item.className || ''}`}
              >
                {item.icon && (
                  <span className={`flex-shrink-0 ${isDanger ? 'text-red-500' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

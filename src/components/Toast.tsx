'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
}

const config = {
  error: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
};

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  const { icon: Icon, bg, text, iconColor } = config[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-[70] animate-in slide-in-from-bottom-2">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${bg}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <span className={`text-sm font-medium ${text}`}>{message}</span>
        <button onClick={onClose} className="ml-2 flex-shrink-0">
          <X className={`w-4 h-4 ${text} opacity-50 hover:opacity-100`} />
        </button>
      </div>
    </div>
  );
}

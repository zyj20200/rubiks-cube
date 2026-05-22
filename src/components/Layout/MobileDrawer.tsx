'use client';

import { useState } from 'react';

interface MobileDrawerProps {
  children: React.ReactNode;
}

// In-flow collapsible panel for mobile teaching mode. Sits above the control
// bar (no overlap) and defaults to open so the action buttons are visible.
export default function MobileDrawer({ children }: MobileDrawerProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-col items-center gap-1 py-2 active:bg-gray-50 dark:active:bg-gray-700"
        aria-expanded={open}
      >
        <span className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <span className="text-xs font-medium text-blue-600">
          {open ? '收起教学面板' : '展开教学面板'}
        </span>
      </button>
      {open && (
        <div className="overflow-y-auto" style={{ maxHeight: '46vh' }}>
          {children}
        </div>
      )}
    </div>
  );
}

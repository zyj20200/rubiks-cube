'use client';

import { useState, useRef, useEffect } from 'react';

interface MobileDrawerProps {
  children: React.ReactNode;
}

export default function MobileDrawer({ children }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setDragY(0);
  }, [isOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (isOpen) {
      setDragY(Math.max(0, delta));
    } else {
      setDragY(Math.min(0, delta));
    }
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (isOpen && dragY > 80) {
      setIsOpen(false);
    } else if (!isOpen && dragY < -80) {
      setIsOpen(true);
    }
    setDragY(0);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${isOpen ? dragY : Math.min(dragY + 100, 100)}%)`,
          maxHeight: '70vh',
        }}
      >
        <div
          className="bg-white rounded-t-2xl shadow-2xl"
          style={{ transform: isOpen ? `translateY(${dragY}px)` : undefined }}
        >
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>
          {!isOpen && (
            <div className="px-4 pb-3 text-center">
              <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-600 font-medium"
              >
                展开教学面板
              </button>
            </div>
          )}
          {isOpen && (
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 40px)' }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

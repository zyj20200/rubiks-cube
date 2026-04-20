'use client';

import { useEffect } from 'react';
import { useCubeStore } from '@/store/cube-store';

const KEY_MAP: Record<string, string> = {
  r: 'R', R: 'Ri',
  l: 'L', L: 'Li',
  u: 'U', U: 'Ui',
  d: 'D', D: 'Di',
  f: 'F', F: 'Fi',
  b: 'B', B: 'Bi',
};

export function useKeyboardShortcuts() {
  const executeMove = useCubeStore((s) => s.executeMove);
  const undo = useCubeStore((s) => s.undo);
  const redo = useCubeStore((s) => s.redo);
  const scramble = useCubeStore((s) => s.scramble);
  const reset = useCubeStore((s) => s.reset);
  const isAnimating = useCubeStore((s) => s.isAnimating);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isAnimating) return;

      const move = KEY_MAP[e.key];
      if (move) {
        e.preventDefault();
        executeMove(move);
        return;
      }

      if (e.key === 'z' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === ' ') {
        e.preventDefault();
        scramble();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [executeMove, undo, redo, scramble, reset, isAnimating]);
}

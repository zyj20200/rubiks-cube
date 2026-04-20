'use client';

import { useCubeStore } from '@/store/cube-store';
import { useDarkMode } from '@/hooks/useDarkMode';
import { movesToDisplay } from '@/lib/cube-utils';

export default function ControlBar() {
  const scramble = useCubeStore((s) => s.scramble);
  const reset = useCubeStore((s) => s.reset);
  const undo = useCubeStore((s) => s.undo);
  const redo = useCubeStore((s) => s.redo);
  const mode = useCubeStore((s) => s.mode);
  const setMode = useCubeStore((s) => s.setMode);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const undoStack = useCubeStore((s) => s.undoStack);
  const redoStack = useCubeStore((s) => s.redoStack);
  const animationSpeed = useCubeStore((s) => s.animationSpeed);
  const setAnimationSpeed = useCubeStore((s) => s.setAnimationSpeed);
  const { dark, toggle: toggleDark } = useDarkMode();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-1.5">
        <button
          onClick={() => scramble()}
          disabled={isAnimating}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          打乱
        </button>
        <button
          onClick={reset}
          disabled={isAnimating}
          className="px-3 py-1.5 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          重置
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      <div className="flex gap-1.5">
        <button
          onClick={undo}
          disabled={isAnimating || undoStack.length === 0}
          className="px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          title="撤销 (Ctrl+Z)"
        >
          撤销
        </button>
        <button
          onClick={redo}
          disabled={isAnimating || redoStack.length === 0}
          className="px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          title="重做 (Ctrl+Shift+Z)"
        >
          重做
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
        {(['free', 'teaching'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === m
                ? 'bg-white dark:bg-gray-600 shadow-sm font-medium dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            {m === 'free' ? '自由' : '教学'}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span>速度</span>
        <input
          type="range"
          min={50}
          max={800}
          value={800 - animationSpeed}
          onChange={(e) => setAnimationSpeed(800 - Number(e.target.value))}
          className="w-20 h-1.5 accent-blue-600"
        />
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      <button
        onClick={toggleDark}
        className="px-2 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title={dark ? '切换浅色模式' : '切换深色模式'}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {undoStack.length > 0 && (
        <>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={movesToDisplay(undoStack)}>
            {undoStack.length} 步
          </div>
        </>
      )}
    </div>
  );
}

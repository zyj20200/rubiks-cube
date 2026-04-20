'use client';

import dynamic from 'next/dynamic';
import ControlBar from '@/components/Controls/ControlBar';
import TeachingPanel from '@/components/TeachingPanel/TeachingPanel';
import MobileDrawer from '@/components/Layout/MobileDrawer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCubeStore } from '@/store/cube-store';

const CubeScene = dynamic(() => import('@/components/Cube/CubeScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400 text-lg">加载3D场景...</div>
    </div>
  ),
});

export default function Home() {
  useKeyboardShortcuts();
  const mode = useCubeStore((s) => s.mode);

  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-1 min-h-0">
        <div className={`flex-1 relative ${mode === 'teaching' ? 'md:w-[70%]' : 'w-full'}`}>
          <CubeScene />
          <div className="absolute top-4 left-4">
            <h1 className="text-xl font-bold text-gray-700 dark:text-gray-300 opacity-60">
              魔方小课堂
            </h1>
          </div>
        </div>
        {mode === 'teaching' && (
          <div className="hidden md:flex md:w-[300px] lg:w-[340px] flex-shrink-0">
            <TeachingPanel />
          </div>
        )}
      </div>
      <ControlBar />
      {mode === 'teaching' && (
        <div className="md:hidden">
          <MobileDrawer>
            <TeachingPanel />
          </MobileDrawer>
        </div>
      )}
    </main>
  );
}

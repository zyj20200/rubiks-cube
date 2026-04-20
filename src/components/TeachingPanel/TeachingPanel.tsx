'use client';

import { useCubeStore } from '@/store/cube-store';
import { STEP_INFO } from '@/lib/solver/step-detector';
import { movesToDisplay } from '@/lib/cube-utils';

export default function TeachingPanel() {
  const mode = useCubeStore((s) => s.mode);
  const currentStep = useCubeStore((s) => s.currentStep);
  const solveNextStep = useCubeStore((s) => s.solveNextStep);
  const solveAll = useCubeStore((s) => s.solveAll);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const teachingSolution = useCubeStore((s) => s.teachingSolution);
  const teachingSolutionIndex = useCubeStore((s) => s.teachingSolutionIndex);

  if (mode !== 'teaching') return null;

  const isSolved = currentStep === 7;

  return (
    <div className="flex flex-col h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">层先法教学</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">七步还原魔方</p>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {STEP_INFO.slice(1).map((step) => (
            <div
              key={step.step}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step.step <= currentStep
                  ? 'bg-green-500'
                  : step.step === currentStep + 1
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-600'
              }`}
              title={step.nameZh}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>第 1 步</span>
          <span>第 7 步</span>
        </div>
      </div>

      {/* Current step info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {isSolved ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">&#127881;</div>
            <h3 className="text-lg font-bold text-green-600">魔方已还原！</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">恭喜你完成了层先法七步还原</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                {currentStep + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {STEP_INFO[currentStep + 1]?.nameZh}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {STEP_INFO[currentStep + 1]?.nameEn}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {STEP_INFO[currentStep + 1]?.description}
            </p>
          </>
        )}
      </div>

      {/* Solution display */}
      {teachingSolution && teachingSolution.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">解法公式</h4>
          <div className="flex flex-wrap gap-1">
            {teachingSolution.map((move, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                  i < teachingSolutionIndex
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : i === teachingSolutionIndex
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {movesToDisplay([move])}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {teachingSolutionIndex} / {teachingSolution.length} 步
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isSolved && (
        <div className="p-4 space-y-2">
          <button
            onClick={solveNextStep}
            disabled={isAnimating}
            className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            执行下一步
          </button>
          <button
            onClick={solveAll}
            disabled={isAnimating}
            className="w-full py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            自动还原
          </button>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-auto p-4 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700">
        <p className="font-medium mb-1">键盘快捷键</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span>R / Shift+R: 右面</span>
          <span>L / Shift+L: 左面</span>
          <span>U / Shift+U: 上面</span>
          <span>D / Shift+D: 下面</span>
          <span>F / Shift+F: 前面</span>
          <span>B / Shift+B: 后面</span>
          <span>Space: 打乱</span>
          <span>Esc: 重置</span>
        </div>
      </div>
    </div>
  );
}

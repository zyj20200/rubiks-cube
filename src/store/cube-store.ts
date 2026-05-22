import { create } from 'zustand';
import { Cube } from '@/lib/cube';
import { generateScramble } from '@/lib/cube-utils';
import { invertMove } from '@/lib/solver/optimizer';
import { detectCurrentStep, stepForMoveIndex } from '@/lib/solver/step-detector';
import { computeTeachingSolution } from '@/lib/solver/teaching';

export type AppMode = 'free' | 'teaching' | 'timer';

interface CubeState {
  cube: Cube;
  undoStack: string[];
  redoStack: string[];

  isAnimating: boolean;
  animationQueue: string[];
  animationSpeed: number;

  mode: AppMode;
  currentStep: number;

  timerRunning: boolean;
  timerStartTime: number | null;
  timerElapsed: number;

  teachingSolution: string[] | null;
  teachingSolutionIndex: number;
  teachingPhases: number[] | null;
  // Quarter turns already applied toward the current (half-turn) solution move,
  // so a manually-dragged R2 advances only after both swipes.
  teachingPartial: number;

  executeMove: (move: string) => void;
  executeMoves: (moves: string[], skipAnimation?: boolean) => void;
  undo: () => void;
  redo: () => void;
  scramble: (length?: number) => void;
  reset: () => void;
  setMode: (mode: AppMode) => void;
  setAnimationSpeed: (speed: number) => void;
  dequeueAnimation: () => string | null;
  finishAnimation: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  updateTimerElapsed: () => void;
  solveNextStep: () => void;
  solveAll: () => void;
  ensureTeachingSolution: () => void;
}

export const useCubeStore = create<CubeState>((set, get) => ({
  cube: Cube.createSolved(),
  undoStack: [],
  redoStack: [],

  isAnimating: false,
  animationQueue: [],
  animationSpeed: 300,

  mode: 'free',
  currentStep: 7,

  timerRunning: false,
  timerStartTime: null,
  timerElapsed: 0,

  teachingSolution: null,
  teachingSolutionIndex: 0,
  teachingPhases: null,
  teachingPartial: 0,

  executeMove: (move: string) => {
    const {
      cube, undoStack, mode,
      teachingSolution, teachingSolutionIndex, teachingPhases, teachingPartial,
    } = get();
    cube.sequence(move);
    const common = {
      undoStack: [...undoStack, move],
      redoStack: [] as string[],
      animationQueue: [move],
      isAnimating: true,
    };

    // In teaching mode, a manual move that follows the on-cube hint should
    // advance through the precomputed solution exactly like "执行下一步" —
    // not wipe the formula and trigger a fresh re-solve. Only a move that
    // deviates from the hint discards the current solution.
    if (mode === 'teaching' && teachingSolution && teachingSolutionIndex < teachingSolution.length) {
      const expected = teachingSolution[teachingSolutionIndex];
      const isHalf = expected.endsWith('2');
      const expBase = isHalf ? expected.slice(0, -1) : expected;

      if (move === expBase) {
        // A half turn (R2) takes two quarter swipes; advance only once both done.
        const stayOnMove = isHalf && teachingPartial + 1 < 2;
        const nextIndex = stayOnMove ? teachingSolutionIndex : teachingSolutionIndex + 1;
        set({
          ...common,
          teachingSolutionIndex: nextIndex,
          teachingPartial: stayOnMove ? teachingPartial + 1 : 0,
          currentStep: teachingPhases
            ? stepForMoveIndex(nextIndex, teachingPhases)
            : detectCurrentStep(cube),
        });
        return;
      }
    }

    // Free move (or off-script in teaching): drop any stale solution so it is
    // recomputed from the new state.
    set({
      ...common,
      currentStep: detectCurrentStep(cube),
      teachingSolution: null,
      teachingSolutionIndex: 0,
      teachingPhases: null,
      teachingPartial: 0,
    });
  },

  executeMoves: (moves: string[], skipAnimation = false) => {
    const { cube, undoStack } = get();
    for (const m of moves) cube.sequence(m);
    set({
      undoStack: [...undoStack, ...moves],
      redoStack: [],
      animationQueue: skipAnimation ? [] : moves,
      isAnimating: !skipAnimation && moves.length > 0,
      currentStep: detectCurrentStep(cube),
      teachingSolution: null,
      teachingSolutionIndex: 0,
      teachingPhases: null,
      teachingPartial: 0,
    });
  },

  undo: () => {
    const { cube, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    const move = undoStack[undoStack.length - 1];
    const inv = invertMove(move);
    cube.sequence(inv);
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, move],
      animationQueue: [inv],
      isAnimating: true,
      currentStep: detectCurrentStep(cube),
      teachingPartial: 0,
    });
  },

  redo: () => {
    const { cube, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    const move = redoStack[redoStack.length - 1];
    cube.sequence(move);
    set({
      undoStack: [...undoStack, move],
      redoStack: redoStack.slice(0, -1),
      animationQueue: [move],
      isAnimating: true,
      currentStep: detectCurrentStep(cube),
      teachingPartial: 0,
    });
  },

  scramble: (length = 25) => {
    const cube = Cube.createSolved();
    const moves = generateScramble(length);
    for (const m of moves) cube.sequence(m);
    set({
      cube,
      undoStack: [],
      redoStack: [],
      animationQueue: [],
      isAnimating: false,
      currentStep: detectCurrentStep(cube),
      teachingSolution: null,
      teachingSolutionIndex: 0,
      teachingPhases: null,
      teachingPartial: 0,
    });
  },

  reset: () => {
    set({
      cube: Cube.createSolved(),
      undoStack: [],
      redoStack: [],
      animationQueue: [],
      isAnimating: false,
      currentStep: 7,
      timerRunning: false,
      timerStartTime: null,
      timerElapsed: 0,
      teachingSolution: null,
      teachingSolutionIndex: 0,
      teachingPhases: null,
      teachingPartial: 0,
    });
  },

  setMode: (mode: AppMode) => {
    set({ mode });
    if (mode === 'teaching') get().ensureTeachingSolution();
  },
  setAnimationSpeed: (speed: number) => set({ animationSpeed: speed }),

  dequeueAnimation: () => {
    const { animationQueue } = get();
    if (animationQueue.length === 0) return null;
    const [next, ...rest] = animationQueue;
    set({ animationQueue: rest, isAnimating: true });
    return next;
  },

  finishAnimation: () => {
    const { animationQueue } = get();
    if (animationQueue.length === 0) {
      set({ isAnimating: false });
    }
  },

  startTimer: () => set({ timerRunning: true, timerStartTime: Date.now(), timerElapsed: 0 }),
  stopTimer: () => {
    const { timerStartTime } = get();
    set({ timerRunning: false, timerElapsed: timerStartTime ? Date.now() - timerStartTime : 0 });
  },
  resetTimer: () => set({ timerRunning: false, timerStartTime: null, timerElapsed: 0 }),
  updateTimerElapsed: () => {
    const { timerRunning, timerStartTime } = get();
    if (timerRunning && timerStartTime) {
      set({ timerElapsed: Date.now() - timerStartTime });
    }
  },

  solveNextStep: () => {
    const { cube, teachingSolution, teachingSolutionIndex, teachingPhases, teachingPartial } = get();

    if (teachingSolution && teachingSolutionIndex < teachingSolution.length) {
      const move = teachingSolution[teachingSolutionIndex];
      const isHalf = move.endsWith('2');
      const base = isHalf ? move.slice(0, -1) : move;
      // Execute only the quarter turns still owed on this move — the user may
      // already have done part of an R2 by hand.
      const baseMoves = Array((isHalf ? 2 : 1) - teachingPartial).fill(base);
      for (const b of baseMoves) cube.sequence(b);
      const animMove = baseMoves.length >= 2 ? move : base; // 180° in one go, else 90°
      const nextIndex = teachingSolutionIndex + 1;
      set({
        animationQueue: [animMove],
        isAnimating: true,
        teachingSolutionIndex: nextIndex,
        teachingPartial: 0,
        // Derive the step from the solution's phase structure (monotonic),
        // not from the live cube — algorithms transiently disturb finished
        // layers, which would make a state-based step jump backwards.
        currentStep: teachingPhases
          ? stepForMoveIndex(nextIndex, teachingPhases)
          : detectCurrentStep(cube),
        // Push quarter turns (not "R2") so undo's invertMove works on them.
        undoStack: [...get().undoStack, ...baseMoves],
        redoStack: [],
      });
      return;
    }

    try {
      const { moves, boundaries } = computeTeachingSolution(cube);
      set({
        teachingSolution: moves,
        teachingSolutionIndex: 0,
        teachingPhases: boundaries,
        teachingPartial: 0,
        currentStep: stepForMoveIndex(0, boundaries),
      });
      if (moves.length > 0) get().solveNextStep();
    } catch {
      // unsolvable
    }
  },

  // Precompute the solution (without executing) so the next-move hint can be
  // shown immediately on entering teaching mode or after a scramble.
  ensureTeachingSolution: () => {
    const { cube, teachingSolution, isAnimating } = get();
    if (teachingSolution !== null || isAnimating || cube.isSolved()) return;
    try {
      const { moves, boundaries } = computeTeachingSolution(cube);
      set({
        teachingSolution: moves,
        teachingSolutionIndex: 0,
        teachingPhases: boundaries,
        teachingPartial: 0,
        currentStep: stepForMoveIndex(0, boundaries),
      });
    } catch {
      // unsolvable
    }
  },

  solveAll: () => {
    const { cube } = get();
    try {
      const { moves, boundaries } = computeTeachingSolution(cube);
      for (const m of moves) cube.sequence(m);
      set({
        animationQueue: moves,
        isAnimating: true,
        currentStep: detectCurrentStep(cube),
        undoStack: [...get().undoStack, ...moves],
        redoStack: [],
        teachingSolution: moves,
        teachingSolutionIndex: moves.length,
        teachingPhases: boundaries,
        teachingPartial: 0,
      });
    } catch {
      // unsolvable
    }
  },
}));

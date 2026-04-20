import { create } from 'zustand';
import { Cube } from '@/lib/cube';
import { generateScramble } from '@/lib/cube-utils';
import { invertMove } from '@/lib/solver/optimizer';
import { Solver } from '@/lib/solver/solver';
import { detectCurrentStep } from '@/lib/solver/step-detector';
import { optimizeMoves } from '@/lib/solver/optimizer';

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

  executeMove: (move: string) => {
    const { cube, undoStack } = get();
    cube.sequence(move);
    set({
      undoStack: [...undoStack, move],
      redoStack: [],
      animationQueue: [move],
      isAnimating: true,
      currentStep: detectCurrentStep(cube),
      teachingSolution: null,
      teachingSolutionIndex: 0,
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
    });
  },

  setMode: (mode: AppMode) => set({ mode }),
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
    const { cube, teachingSolution, teachingSolutionIndex } = get();

    if (teachingSolution && teachingSolutionIndex < teachingSolution.length) {
      const move = teachingSolution[teachingSolutionIndex];
      cube.sequence(move);
      set({
        animationQueue: [move],
        isAnimating: true,
        teachingSolutionIndex: teachingSolutionIndex + 1,
        currentStep: detectCurrentStep(cube),
        undoStack: [...get().undoStack, move],
        redoStack: [],
      });
      return;
    }

    const clone = cube.clone();
    try {
      const solver = new Solver(clone);
      solver.solve();
      const optimized = optimizeMoves(solver.moves);
      set({ teachingSolution: optimized, teachingSolutionIndex: 0 });
      get().solveNextStep();
    } catch {
      // unsolvable
    }
  },

  solveAll: () => {
    const { cube } = get();
    const clone = cube.clone();
    try {
      const solver = new Solver(clone);
      solver.solve();
      const moves = optimizeMoves(solver.moves);
      for (const m of moves) cube.sequence(m);
      set({
        animationQueue: moves,
        isAnimating: true,
        currentStep: detectCurrentStep(cube),
        undoStack: [...get().undoStack, ...moves],
        redoStack: [],
        teachingSolution: moves,
        teachingSolutionIndex: moves.length,
      });
    } catch {
      // unsolvable
    }
  },
}));

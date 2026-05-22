import { describe, it, expect, beforeEach } from 'vitest';
import { useCubeStore } from '../cube-store';
import { Cube } from '@/lib/cube';

// Reproduces the teaching-mode bug: following the on-cube hint with a manual
// move (drag/keyboard → executeMove) used to wipe the precomputed solution and
// trigger a fresh re-solve, so the "解法公式" changed under the user's hand.
// Now a hint-matching manual move advances the solution exactly like the
// "执行下一步" button.
describe('teaching mode: manual moves follow the precomputed solution', () => {
  beforeEach(() => {
    // A fixed, non-trivial scramble keeps the solution deterministic.
    const cube = Cube.createSolved();
    for (const m of ['R', 'U', 'Ri', 'F', 'F', 'Li', 'D', 'B']) cube.sequence(m);
    useCubeStore.setState({
      cube,
      mode: 'teaching',
      undoStack: [],
      redoStack: [],
      isAnimating: false,
      teachingSolution: null,
      teachingSolutionIndex: 0,
      teachingPhases: null,
      teachingPartial: 0,
    });
    useCubeStore.getState().ensureTeachingSolution();
  });

  it('advances the index without changing the formula when the hint move is played', () => {
    const before = useCubeStore.getState();
    const solution = before.teachingSolution!;
    expect(solution.length).toBeGreaterThan(0);
    expect(before.teachingSolutionIndex).toBe(0);

    // Play the very move the hint shows.
    const expected = solution[0];
    const quarter = expected.endsWith('2') ? expected.slice(0, -1) : expected;
    useCubeStore.getState().executeMove(quarter);

    const after = useCubeStore.getState();
    // Same formula array, just progressed — not recomputed/cleared.
    expect(after.teachingSolution).toBe(solution);
    if (expected.endsWith('2')) {
      expect(after.teachingSolutionIndex).toBe(0); // half turn: still mid-move
      expect(after.teachingPartial).toBe(1);
    } else {
      expect(after.teachingSolutionIndex).toBe(1);
      expect(after.teachingPartial).toBe(0);
    }
  });

  it('playing the whole solution by hand solves the cube and keeps the formula', () => {
    const solution = useCubeStore.getState().teachingSolution!;
    for (const move of solution) {
      const quarters = move.endsWith('2') ? [move.slice(0, -1), move.slice(0, -1)] : [move];
      for (const q of quarters) useCubeStore.getState().executeMove(q);
    }
    const after = useCubeStore.getState();
    expect(after.teachingSolution).toBe(solution); // never recomputed
    expect(after.teachingSolutionIndex).toBe(solution.length);
    expect(after.cube.isSolved()).toBe(true);
  });

  it('自动还原 plays move-by-move (not all at once) and ends solved', () => {
    const store = useCubeStore.getState();
    const total = store.teachingSolution!.length;
    expect(total).toBeGreaterThan(1);

    store.solveAll();

    // Regression: the old solveAll dumped every move into the queue and
    // pre-applied them all, snapping the model to solved instantly. Now only
    // the first step is queued and the model is NOT yet solved.
    const afterStart = useCubeStore.getState();
    expect(afterStart.autoSolving).toBe(true);
    expect(afterStart.animationQueue.length).toBe(1);
    expect(afterStart.cube.isSolved()).toBe(false);

    // Drive the animation loop the way RubiksCube does: consume the queued
    // move, then signal completion (which chains to the next step).
    let guard = 0;
    while (useCubeStore.getState().isAnimating && guard++ < 5000) {
      useCubeStore.getState().dequeueAnimation();
      useCubeStore.getState().finishAnimation();
    }

    const done = useCubeStore.getState();
    expect(done.cube.isSolved()).toBe(true);
    expect(done.autoSolving).toBe(false);
    expect(done.teachingSolutionIndex).toBe(total);
  });

  it('a move that deviates from the hint discards the stale solution', () => {
    const solution = useCubeStore.getState().teachingSolution!;
    const expected = solution[0];
    const quarter = expected.endsWith('2') ? expected.slice(0, -1) : expected;
    // Play the opposite of the hinted move.
    const wrong = quarter.endsWith('i') ? quarter.slice(0, -1) : quarter + 'i';
    useCubeStore.getState().executeMove(wrong);
    expect(useCubeStore.getState().teachingSolution).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { Cube } from '../cube';
import { generateScramble } from '../cube-utils';
import { Solver } from '../solver/solver';
import { optimizePhases } from '../solver/optimizer';
import { stepForMoveIndex } from '../solver/step-detector';

describe('solver stress (phase-based teaching)', () => {
  it('solves random scrambles with monotonic step progression', () => {
    const N = 300;
    let fail = 0;
    let totalLen = 0;
    let maxLen = 0;
    let backtracked = 0;
    let badEnd = 0;

    for (let i = 0; i < N; i++) {
      const cube = Cube.createSolved();
      for (const m of generateScramble(25)) cube.sequence(m);

      let moves: string[];
      let boundaries: number[];
      try {
        const solver = new Solver(cube.clone());
        solver.solve();
        ({ moves, boundaries } = optimizePhases(solver.moves, solver.phaseBoundaries));
      } catch {
        fail++;
        continue;
      }

      // Replay the optimized solution and verify it solves the cube.
      const play = cube.clone();
      for (const m of moves) play.sequence(m);
      if (!play.isSolved()) fail++;

      // The teaching step indicator must never move backwards as moves play.
      let prev = stepForMoveIndex(0, boundaries);
      for (let idx = 1; idx <= moves.length; idx++) {
        const s = stepForMoveIndex(idx, boundaries);
        if (s < prev) backtracked++;
        prev = s;
      }
      if (prev !== 7) badEnd++;

      totalLen += moves.length;
      maxLen = Math.max(maxLen, moves.length);
    }

    console.log(
      `fail=${fail} avgLen=${(totalLen / N).toFixed(1)} maxLen=${maxLen} ` +
        `backtracked=${backtracked}/${N} badEnd=${badEnd}/${N}`,
    );
    expect(fail).toBe(0);
    expect(backtracked).toBe(0);
    expect(badEnd).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { Cube, UP } from '../cube';
import { generateScramble } from '../cube-utils';
import { Solver } from '../solver/solver';
import { optimizePhases, unrotate } from '../solver/optimizer';

// Build the teaching solution the same way the store does: rotate so the white
// (UP) face reaches the solver's base (FRONT), solve, then de-rotate the moves
// back to the original frame so the first cross is built on the white UP face.
function solveFromWhite(cube: Cube) {
  const clone = cube.clone();
  clone.sequence('Xi'); // Xi maps UP -> FRONT
  const solver = new Solver(clone);
  solver.solve();
  const reframed = unrotate('Xi', solver.moves);
  return optimizePhases(reframed, solver.phaseBoundaries);
}

// White cross on the UP face: the 4 up-face edges show the up colour on top.
function upCrossDone(cube: Cube): boolean {
  const up = cube.upColor();
  const edges: [number, number, number][] = [
    [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1],
  ];
  return edges.every((pos) => {
    const p = cube.getPiece(...pos);
    return p && p.colors[1] === up;
  });
}

describe('solve starting from the white (UP) face', () => {
  it('Xi brings the white UP face to FRONT', () => {
    const c = Cube.createSolved();
    const up = c.upColor();
    c.sequence('Xi');
    expect(c.frontColor()).toBe(up); // white now at front
  });

  it('solves and builds the white cross on the UP face first', () => {
    const N = 200;
    let fail = 0;
    let crossNotOnUp = 0;
    for (let i = 0; i < N; i++) {
      const cube = Cube.createSolved();
      for (const m of generateScramble(25)) cube.sequence(m);

      const { moves, boundaries } = solveFromWhite(cube);

      // First phase should leave a white cross on the UP face.
      const afterCross = cube.clone();
      for (let k = 0; k < boundaries[0]; k++) afterCross.sequence(moves[k]);
      if (!upCrossDone(afterCross)) crossNotOnUp++;

      // Full solution solves the cube.
      const play = cube.clone();
      for (const m of moves) play.sequence(m);
      if (!play.isSolved()) fail++;
    }
    console.log(`fail=${fail} crossNotOnUp=${crossNotOnUp} (of ${N})`);
    expect(fail).toBe(0);
    expect(crossNotOnUp).toBe(0);
  });
});

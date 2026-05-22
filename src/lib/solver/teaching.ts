import { Cube } from '../cube';
import { Solver } from './solver';
import { optimizePhases, unrotate } from './optimizer';

/**
 * Build the teaching solution for a cube.
 *
 * The solver always builds its first cross on the FRONT face, so we first
 * rotate the white (UP) face onto FRONT, solve, then de-rotate the moves back
 * to the current view. The result starts with the white cross (on the bottom
 * UP face) and contains no leading whole-cube spin.
 *
 * Returns the optimized move list plus the cumulative phase boundaries.
 */
export function computeTeachingSolution(cube: Cube): { moves: string[]; boundaries: number[] } {
  const clone = cube.clone();
  clone.sequence('Xi'); // Xi maps UP -> FRONT
  const solver = new Solver(clone);
  solver.solve();
  const reframed = unrotate('Xi', solver.moves);
  return optimizePhases(reframed, solver.phaseBoundaries);
}

const X_ROT_CW: Record<string, string> = {
  U: 'F', B: 'U', D: 'B', F: 'D',
  E: 'Si', S: 'E', Y: 'Z', Z: 'Yi',
};
const Y_ROT_CW: Record<string, string> = {
  B: 'L', R: 'B', F: 'R', L: 'F',
  S: 'Mi', M: 'S', Z: 'X', X: 'Zi',
};
const Z_ROT_CW: Record<string, string> = {
  U: 'L', R: 'U', D: 'R', L: 'D',
  E: 'Mi', M: 'E', Y: 'Xi', X: 'Y',
};

function invertMap(m: Record<string, string>): Record<string, string> {
  const inv: Record<string, string> = {};
  for (const [k, v] of Object.entries(m)) inv[v] = k;
  return inv;
}

const X_ROT_CC = invertMap(X_ROT_CW);
const Y_ROT_CC = invertMap(Y_ROT_CW);
const Z_ROT_CC = invertMap(Z_ROT_CW);

function getRotTable(rot: string): Record<string, string> | null {
  switch (rot) {
    case 'X': return X_ROT_CW;
    case 'Xi': return X_ROT_CC;
    case 'Y': return Y_ROT_CW;
    case 'Yi': return Y_ROT_CC;
    case 'Z': return Z_ROT_CW;
    case 'Zi': return Z_ROT_CC;
    default: return null;
  }
}

export function invertMove(move: string): string {
  if (move.endsWith('i')) return move.slice(0, -1);
  return move + 'i';
}

export function unrotate(rot: string, moves: string[]): string[] {
  const table = getRotTable(rot)!;
  return moves.map((move) => {
    if (move in table) return table[move];
    const inv = invertMove(move);
    if (inv in table) return invertMove(table[inv]);
    return move;
  });
}

function applyNoFullCubeRotationOptimization(moves: string[]): void {
  const rots = new Set(['X', 'Y', 'Z', 'Xi', 'Yi', 'Zi']);
  let changed = false;
  let i = 0;
  while (i < moves.length) {
    if (!rots.has(moves[i])) { i++; continue; }
    for (let j = moves.length - 1; j > i; j--) {
      if (moves[j] === invertMove(moves[i])) {
        const inner = unrotate(moves[i], moves.slice(i + 1, j));
        moves.splice(i, j - i + 1, ...inner);
        changed = true;
        break;
      }
    }
    i++;
  }
  if (changed) applyNoFullCubeRotationOptimization(moves);
}

function applyRepeatThreeOptimization(moves: string[]): void {
  let changed = false;
  let i = 0;
  while (i < moves.length - 2) {
    if (moves[i] === moves[i + 1] && moves[i] === moves[i + 2]) {
      moves.splice(i, 3, invertMove(moves[i]));
      changed = true;
    } else {
      i++;
    }
  }
  if (changed) applyRepeatThreeOptimization(moves);
}

function applyDoUndoOptimization(moves: string[]): void {
  let changed = false;
  let i = 0;
  while (i < moves.length - 1) {
    if (invertMove(moves[i]) === moves[i + 1]) {
      moves.splice(i, 2);
      changed = true;
    } else {
      i++;
    }
  }
  if (changed) applyDoUndoOptimization(moves);
}

// Which axis each layer move turns about (R/L/M → x, U/D/E → y, F/B/S → z).
// Whole-cube rotations are intentionally excluded.
const FACE_AXIS: Record<string, number> = {
  R: 0, L: 0, M: 0,
  U: 1, D: 1, E: 1,
  F: 2, B: 2, S: 2,
};

const baseFace = (m: string): string => (m.endsWith('i') ? m.slice(0, -1) : m);
const quarterTurns = (m: string): number => (m.endsWith('i') ? 3 : 1); // CW count mod 4
function turnsToMoves(face: string, n: number): string[] {
  n = ((n % 4) + 4) % 4;
  if (n === 0) return [];
  if (n === 1) return [face];
  if (n === 2) return [face, face];
  return [`${face}i`];
}

// Moves about the same axis commute, so a run of them can be reordered and the
// turns on each face combined to their net (mod 4). This cancels redundancy the
// adjacency passes miss, e.g. `R L R'` → `L`, `U D U` → `U2 D`. Method-neutral.
function applySameAxisMerge(moves: string[]): void {
  let changed = false;
  let i = 0;
  while (i < moves.length) {
    const axis = FACE_AXIS[baseFace(moves[i])];
    if (axis === undefined) {
      i++;
      continue;
    }
    let j = i;
    while (j < moves.length && FACE_AXIS[baseFace(moves[j])] === axis) j++;
    if (j - i >= 2) {
      const net: Record<string, number> = {};
      const order: string[] = [];
      for (let k = i; k < j; k++) {
        const f = baseFace(moves[k]);
        if (!(f in net)) {
          net[f] = 0;
          order.push(f);
        }
        net[f] += quarterTurns(moves[k]);
      }
      const out: string[] = [];
      for (const f of order) out.push(...turnsToMoves(f, net[f]));
      if (out.length !== j - i) {
        moves.splice(i, j - i, ...out);
        changed = true;
        continue; // re-evaluate from the same spot
      }
    }
    i = j;
  }
  if (changed) applySameAxisMerge(moves);
}

// Write adjacent identical quarter turns as a single half turn (R R → R2),
// beginner-standard notation that turns two steps into one. Run last, on a
// fully reduced quarter-turn list.
function collapseHalfTurns(moves: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < moves.length) {
    const f = baseFace(moves[i]);
    if (FACE_AXIS[f] !== undefined && i + 1 < moves.length && moves[i + 1] === moves[i]) {
      out.push(`${f}2`);
      i += 2;
    } else {
      out.push(moves[i]);
      i++;
    }
  }
  return out;
}

export function optimizeMoves(moves: string[]): string[] {
  const result = [...moves];
  let prev: number;
  do {
    prev = result.length;
    applyNoFullCubeRotationOptimization(result);
    applySameAxisMerge(result);
    applyRepeatThreeOptimization(result);
    applyDoUndoOptimization(result);
  } while (result.length < prev);
  return collapseHalfTurns(result);
}

/**
 * Optimize a solution while preserving its LBL phase structure.
 *
 * Each phase slice (delimited by `rawBoundaries`, cumulative indices into
 * `moves`) is optimized independently and concatenated. Every solver phase is
 * orientation-balanced (it starts and ends in the same cube orientation), so
 * optimizing per-phase keeps the full solution correct while producing exact
 * boundaries the teaching UI can use to report which step each move belongs to.
 *
 * Returns the optimized move list plus the cumulative boundaries within it.
 */
export function optimizePhases(
  moves: string[],
  rawBoundaries: number[],
): { moves: string[]; boundaries: number[] } {
  const out: string[] = [];
  const boundaries: number[] = [];
  let start = 0;
  for (const end of rawBoundaries) {
    out.push(...optimizeMoves(moves.slice(start, end)));
    boundaries.push(out.length);
    start = end;
  }
  return { moves: out, boundaries };
}

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

function unrotate(rot: string, moves: string[]): string[] {
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

export function optimizeMoves(moves: string[]): string[] {
  const result = [...moves];
  applyNoFullCubeRotationOptimization(result);
  applyRepeatThreeOptimization(result);
  applyDoUndoOptimization(result);
  return result;
}

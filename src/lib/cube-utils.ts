export function generateScramble(length = 25): string[] {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  const opposites: Record<string, string> = { R: 'L', L: 'R', U: 'D', D: 'U', F: 'B', B: 'F' };
  const suffixes = ['', 'i', '2'];
  const moves: string[] = [];

  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    let face: string;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (
      face === lastFace ||
      (face === opposites[lastFace] && lastFace === opposites[secondLastFace])
    );

    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const move = face + suffix;
    moves.push(move === face ? face : move.endsWith('2') ? `${face} ${face}` : `${face}i`);

    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}

export function moveToDisplay(move: string): string {
  if (move.endsWith('i')) return move.slice(0, -1) + "'";
  return move;
}

export function movesToDisplay(moves: string[]): string {
  const collapsed: string[] = [];
  let i = 0;
  while (i < moves.length) {
    if (i + 1 < moves.length && moves[i] === moves[i + 1] && moves[i].length === 1) {
      collapsed.push(moves[i] + '2');
      i += 2;
    } else {
      collapsed.push(moveToDisplay(moves[i]));
      i++;
    }
  }
  return collapsed.join(' ');
}

export function parseDisplayMove(display: string): string[] {
  return display.split(/\s+/).filter(Boolean).flatMap((m) => {
    if (m.endsWith('2')) {
      const base = m.slice(0, -1);
      return [base, base];
    }
    if (m.endsWith("'")) return [m.slice(0, -1) + 'i'];
    return [m];
  });
}

export const COLOR_MAP: Record<string, string> = {
  W: '#FAFAF6',
  Y: '#F7E44D',
  R: '#F06048',
  O: '#FBB04E',
  B: '#7DC4EC',
  G: '#B0E85A',
};

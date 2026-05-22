import { describe, it, expect } from 'vitest';
import { Cube } from '../cube';

// The scene renders the cube inside a group rotated [π,0,0], so world = (x,-y,-z)
// of the model. A drag is detected in WORLD space but the move it picks is
// executed in MODEL space — the map must account for that rotation.
type Vec = [number, number, number];
const R0 = ([x, y, z]: Vec): Vec => [x, -y, -z]; // model<->world (its own inverse)

// Current (buggy) map from useDragRotation.
const MAP_BUGGY: Record<string, string> = {
  '0,1,-1': 'R', '0,1,1': 'Ri', '0,-1,-1': 'Li', '0,-1,1': 'L', '0,0,-1': 'Mi', '0,0,1': 'M',
  '1,1,-1': 'U', '1,1,1': 'Ui', '1,-1,-1': 'Di', '1,-1,1': 'D', '1,0,-1': 'Ei', '1,0,1': 'E',
  '2,1,-1': 'F', '2,1,1': 'Fi', '2,-1,-1': 'Bi', '2,-1,1': 'B', '2,0,-1': 'S', '2,0,1': 'Si',
};

// Fixed map (move conjugated by the [π,0,0] render rotation).
const MAP_FIXED: Record<string, string> = {
  '0,1,-1': 'R', '0,1,1': 'Ri', '0,-1,-1': 'Li', '0,-1,1': 'L', '0,0,-1': 'Mi', '0,0,1': 'M',
  '1,1,-1': 'D', '1,1,1': 'Di', '1,-1,-1': 'Ui', '1,-1,1': 'U', '1,0,-1': 'E', '1,0,1': 'Ei',
  '2,1,-1': 'B', '2,1,1': 'Bi', '2,-1,-1': 'Fi', '2,-1,1': 'F', '2,0,-1': 'Si', '2,0,1': 'S',
};

function snap(v: Vec): Vec {
  const abs = v.map(Math.abs);
  const i = abs.indexOf(Math.max(...abs));
  const r: Vec = [0, 0, 0];
  r[i] = Math.sign(v[i]);
  return r;
}
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Replicates useDragRotation's move selection (in world space).
function pickMove(map: Record<string, string>, worldNormal: Vec, worldDrag: Vec, worldPos: Vec) {
  const normal = snap(worldNormal);
  const dragDir = snap(worldDrag);
  const c = cross(dragDir, normal);
  let idx = -1;
  let sign = 0;
  for (let i = 0; i < 3; i++) {
    const ci = Math.round(c[i]);
    if (ci !== 0) {
      idx = i;
      sign = -ci;
      break;
    }
  }
  if (idx === -1) return null;
  const layer = Math.round(worldPos[idx]);
  return map[`${idx},${layer},${sign}`] ?? null;
}

const colorsKey = (p: { colors: (string | null)[] }) =>
  p.colors.filter(Boolean).slice().sort().join('');

// All 6 faces with their two in-plane tangent axes.
const FACES: { n: Vec; tangents: [Vec, Vec] }[] = [
  { n: [0, 1, 0], tangents: [[1, 0, 0], [0, 0, 1]] },
  { n: [0, -1, 0], tangents: [[1, 0, 0], [0, 0, 1]] },
  { n: [1, 0, 0], tangents: [[0, 1, 0], [0, 0, 1]] },
  { n: [-1, 0, 0], tangents: [[0, 1, 0], [0, 0, 1]] },
  { n: [0, 0, 1], tangents: [[1, 0, 0], [0, 1, 0]] },
  { n: [0, 0, -1], tangents: [[1, 0, 0], [0, 1, 0]] },
];

// For each face, drag along one tangent while grabbing a piece offset along the
// other tangent (so the grabbed point genuinely moves in the drag direction).
function cases() {
  const out: { n: Vec; drag: Vec; worldPos: Vec }[] = [];
  for (const f of FACES) {
    const [t1, t2] = f.tangents;
    for (const [drag, off] of [[t1, t2], [t2, t1]] as [Vec, Vec][]) {
      for (const s of [1, -1]) {
        const dv = drag.map((c) => c * s) as Vec;
        const worldPos = f.n.map((c, i) => c + off[i]) as Vec;
        out.push({ n: f.n, drag: dv, worldPos });
      }
    }
  }
  return out;
}

// Does `move` rotate the grabbed visual layer so its surface moves toward drag?
function dragGoesRightWay(move: string, n: Vec, drag: Vec, worldPos: Vec): boolean {
  const cube = Cube.createSolved();
  const modelPos = R0(worldPos).map(Math.round) as Vec;
  const piece = cube.getPiece(modelPos[0], modelPos[1], modelPos[2]);
  if (!piece) return false;
  const key = colorsKey(piece);
  cube.sequence(move);
  const moved = cube.pieces.find((p) => colorsKey(p) === key)!;
  const newWorld = R0([moved.pos.x, moved.pos.y, moved.pos.z]);
  const disp: Vec = [newWorld[0] - worldPos[0], newWorld[1] - worldPos[1], newWorld[2] - worldPos[2]];
  // remove the face-normal component, compare with drag direction
  const dn = dot(disp, n);
  const tang: Vec = [disp[0] - n[0] * dn, disp[1] - n[1] * dn, disp[2] - n[2] * dn];
  return dot(tang, drag) > 0;
}

describe('drag → move mapping (accounts for [π,0,0] render rotation)', () => {
  it('the buggy map turns the wrong layer for top/bottom & front/back drags', () => {
    let wrong = 0;
    for (const c of cases()) {
      const move = pickMove(MAP_BUGGY, c.n, c.drag, c.worldPos);
      if (!move || !dragGoesRightWay(move, c.n, c.drag, c.worldPos)) wrong++;
    }
    expect(wrong).toBeGreaterThan(0); // confirms the reported bug exists
  });

  it('the fixed map turns the grabbed layer in the drag direction for all faces', () => {
    const failures: string[] = [];
    for (const c of cases()) {
      const move = pickMove(MAP_FIXED, c.n, c.drag, c.worldPos);
      if (!move || !dragGoesRightWay(move, c.n, c.drag, c.worldPos)) {
        failures.push(`n=${c.n} drag=${c.drag} pos=${c.worldPos} -> ${move}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

/**
 * Geometry of a single move, used to draw the directional turn hint.
 *
 * `axisIdx` is the rotation axis (0=x, 1=y, 2=z). `dir` is the sign of the
 * rotation about the +axis (right-hand rule). `layer` is the slab position
 * along the axis (-1/0/1); `whole` marks whole-cube rotations (X/Y/Z).
 *
 * Values mirror the ROTATION_AXES table in RubiksCube (axis vector positive,
 * `dir` = sign of the animation angle).
 */
export interface MoveHintGeom {
  axisIdx: 0 | 1 | 2;
  layer: -1 | 0 | 1;
  dir: 1 | -1;
  whole: boolean;
}

const TABLE: Record<string, MoveHintGeom> = {
  R:  { axisIdx: 0, layer: 1,  dir: -1, whole: false },
  Ri: { axisIdx: 0, layer: 1,  dir: 1,  whole: false },
  L:  { axisIdx: 0, layer: -1, dir: 1,  whole: false },
  Li: { axisIdx: 0, layer: -1, dir: -1, whole: false },
  U:  { axisIdx: 1, layer: 1,  dir: -1, whole: false },
  Ui: { axisIdx: 1, layer: 1,  dir: 1,  whole: false },
  D:  { axisIdx: 1, layer: -1, dir: 1,  whole: false },
  Di: { axisIdx: 1, layer: -1, dir: -1, whole: false },
  F:  { axisIdx: 2, layer: 1,  dir: -1, whole: false },
  Fi: { axisIdx: 2, layer: 1,  dir: 1,  whole: false },
  B:  { axisIdx: 2, layer: -1, dir: 1,  whole: false },
  Bi: { axisIdx: 2, layer: -1, dir: -1, whole: false },
  M:  { axisIdx: 0, layer: 0,  dir: 1,  whole: false },
  Mi: { axisIdx: 0, layer: 0,  dir: -1, whole: false },
  E:  { axisIdx: 1, layer: 0,  dir: 1,  whole: false },
  Ei: { axisIdx: 1, layer: 0,  dir: -1, whole: false },
  S:  { axisIdx: 2, layer: 0,  dir: -1, whole: false },
  Si: { axisIdx: 2, layer: 0,  dir: 1,  whole: false },
  X:  { axisIdx: 0, layer: 0,  dir: -1, whole: true },
  Xi: { axisIdx: 0, layer: 0,  dir: 1,  whole: true },
  Y:  { axisIdx: 1, layer: 0,  dir: -1, whole: true },
  Yi: { axisIdx: 1, layer: 0,  dir: 1,  whole: true },
  Z:  { axisIdx: 2, layer: 0,  dir: -1, whole: true },
  Zi: { axisIdx: 2, layer: 0,  dir: 1,  whole: true },
};

export function getMoveHintGeom(move: string): MoveHintGeom | null {
  // Half turn ("R2") shows the same face/axis arrow as its base quarter turn.
  const key = move.endsWith('2') ? move.slice(0, -1) : move;
  return TABLE[key] ?? null;
}

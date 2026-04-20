import { Point, Matrix } from './maths';

export const RIGHT = new Point(1, 0, 0);
export const LEFT = new Point(-1, 0, 0);
export const UP = new Point(0, 1, 0);
export const DOWN = new Point(0, -1, 0);
export const FRONT = new Point(0, 0, 1);
export const BACK = new Point(0, 0, -1);

export const X_AXIS = RIGHT;
export const Y_AXIS = UP;
export const Z_AXIS = FRONT;

export type PieceType = 'face' | 'edge' | 'corner';
export type Color = string | null;

export const ROT_XY_CW = new Matrix(0, 1, 0, -1, 0, 0, 0, 0, 1);
export const ROT_XY_CC = new Matrix(0, -1, 0, 1, 0, 0, 0, 0, 1);
export const ROT_XZ_CW = new Matrix(0, 0, -1, 0, 1, 0, 1, 0, 0);
export const ROT_XZ_CC = new Matrix(0, 0, 1, 0, 1, 0, -1, 0, 0);
export const ROT_YZ_CW = new Matrix(1, 0, 0, 0, 0, 1, 0, -1, 0);
export const ROT_YZ_CC = new Matrix(1, 0, 0, 0, 0, -1, 0, 1, 0);

export function getRotFromFace(face: Point): [string, string] | null {
  if (face.equals(RIGHT)) return ['R', 'Ri'];
  if (face.equals(LEFT)) return ['L', 'Li'];
  if (face.equals(UP)) return ['U', 'Ui'];
  if (face.equals(DOWN)) return ['D', 'Di'];
  if (face.equals(FRONT)) return ['F', 'Fi'];
  if (face.equals(BACK)) return ['B', 'Bi'];
  return null;
}

export class Piece {
  pos: Point;
  colors: [Color, Color, Color];
  type: PieceType;

  constructor(pos: Point, colors: [Color, Color, Color]) {
    this.pos = pos;
    this.colors = [...colors];
    const nullCount = this.colors.filter((c) => c === null).length;
    if (nullCount === 2) this.type = 'face';
    else if (nullCount === 1) this.type = 'edge';
    else if (nullCount === 0) this.type = 'corner';
    else throw new Error(`Invalid colors: ${colors}`);
  }

  rotate(matrix: Matrix): void {
    const before = this.pos;
    this.pos = matrix.mulPoint(this.pos);

    let rot = this.pos.sub(before);
    if (!rot.any()) return;

    if (rot.count(0) === 2) {
      rot = rot.add(matrix.mulPoint(rot));
    }

    const indices: number[] = [];
    for (let k = 0; k < 3; k++) {
      if (rot.get(k) !== 0) indices.push(k);
    }
    const [i, j] = indices;
    [this.colors[i], this.colors[j]] = [this.colors[j], this.colors[i]];
  }

  clone(): Piece {
    return new Piece(this.pos.clone(), [...this.colors] as [Color, Color, Color]);
  }

  toString(): string {
    const c = this.colors.filter((x) => x !== null).join('');
    return `(${this.type}, ${c}, ${this.pos})`;
  }
}

export class Cube {
  faces: Piece[];
  edges: Piece[];
  corners: Piece[];
  pieces: Piece[];

  constructor(input: string | Cube) {
    if (input instanceof Cube) {
      this.faces = input.faces.map((p) => p.clone());
      this.edges = input.edges.map((p) => p.clone());
      this.corners = input.corners.map((p) => p.clone());
      this.pieces = [...this.faces, ...this.edges, ...this.corners];
      return;
    }

    const s = input.replace(/\s/g, '');
    if (s.length !== 54) throw new Error(`Cube string must be 54 chars, got ${s.length}`);

    this.faces = [
      new Piece(RIGHT, [s[28], null, null]),
      new Piece(LEFT, [s[22], null, null]),
      new Piece(UP, [null, s[4], null]),
      new Piece(DOWN, [null, s[49], null]),
      new Piece(FRONT, [null, null, s[25]]),
      new Piece(BACK, [null, null, s[31]]),
    ];
    this.edges = [
      new Piece(RIGHT.add(UP), [s[16], s[5], null]),
      new Piece(RIGHT.add(DOWN), [s[40], s[50], null]),
      new Piece(RIGHT.add(FRONT), [s[27], null, s[26]]),
      new Piece(RIGHT.add(BACK), [s[29], null, s[30]]),
      new Piece(LEFT.add(UP), [s[10], s[3], null]),
      new Piece(LEFT.add(DOWN), [s[34], s[48], null]),
      new Piece(LEFT.add(FRONT), [s[23], null, s[24]]),
      new Piece(LEFT.add(BACK), [s[21], null, s[32]]),
      new Piece(UP.add(FRONT), [null, s[7], s[13]]),
      new Piece(UP.add(BACK), [null, s[1], s[19]]),
      new Piece(DOWN.add(FRONT), [null, s[46], s[37]]),
      new Piece(DOWN.add(BACK), [null, s[52], s[43]]),
    ];
    this.corners = [
      new Piece(RIGHT.add(UP).add(FRONT), [s[15], s[8], s[14]]),
      new Piece(RIGHT.add(UP).add(BACK), [s[17], s[2], s[18]]),
      new Piece(RIGHT.add(DOWN).add(FRONT), [s[39], s[47], s[38]]),
      new Piece(RIGHT.add(DOWN).add(BACK), [s[41], s[53], s[42]]),
      new Piece(LEFT.add(UP).add(FRONT), [s[11], s[6], s[12]]),
      new Piece(LEFT.add(UP).add(BACK), [s[9], s[0], s[20]]),
      new Piece(LEFT.add(DOWN).add(FRONT), [s[35], s[45], s[36]]),
      new Piece(LEFT.add(DOWN).add(BACK), [s[33], s[51], s[44]]),
    ];

    this.pieces = [...this.faces, ...this.edges, ...this.corners];
  }

  isSolved(): boolean {
    const check = (colors: Color[]) => colors.every((c) => c === colors[0]);
    return (
      check(this._face(FRONT).map((p) => p.colors[2])) &&
      check(this._face(BACK).map((p) => p.colors[2])) &&
      check(this._face(UP).map((p) => p.colors[1])) &&
      check(this._face(DOWN).map((p) => p.colors[1])) &&
      check(this._face(LEFT).map((p) => p.colors[0])) &&
      check(this._face(RIGHT).map((p) => p.colors[0]))
    );
  }

  _face(axis: Point): Piece[] {
    return this.pieces.filter((p) => p.pos.dot(axis) > 0);
  }

  _slice(plane: Point): Piece[] {
    let i = 0;
    for (let k = 0; k < 3; k++) {
      if (plane.get(k) === 0) {
        i = k;
        break;
      }
    }
    return this.pieces.filter((p) => p.pos.get(i) === 0);
  }

  _rotateFace(face: Point, matrix: Matrix): void {
    this._rotatePieces(this._face(face), matrix);
  }

  _rotateSlice(plane: Point, matrix: Matrix): void {
    this._rotatePieces(this._slice(plane), matrix);
  }

  _rotatePieces(pieces: Piece[], matrix: Matrix): void {
    for (const piece of pieces) {
      piece.rotate(matrix);
    }
  }

  // Face moves
  L(): void { this._rotateFace(LEFT, ROT_YZ_CC); }
  Li(): void { this._rotateFace(LEFT, ROT_YZ_CW); }
  R(): void { this._rotateFace(RIGHT, ROT_YZ_CW); }
  Ri(): void { this._rotateFace(RIGHT, ROT_YZ_CC); }
  U(): void { this._rotateFace(UP, ROT_XZ_CW); }
  Ui(): void { this._rotateFace(UP, ROT_XZ_CC); }
  D(): void { this._rotateFace(DOWN, ROT_XZ_CC); }
  Di(): void { this._rotateFace(DOWN, ROT_XZ_CW); }
  F(): void { this._rotateFace(FRONT, ROT_XY_CW); }
  Fi(): void { this._rotateFace(FRONT, ROT_XY_CC); }
  B(): void { this._rotateFace(BACK, ROT_XY_CC); }
  Bi(): void { this._rotateFace(BACK, ROT_XY_CW); }

  // Slice moves
  M(): void { this._rotateSlice(Y_AXIS.add(Z_AXIS), ROT_YZ_CC); }
  Mi(): void { this._rotateSlice(Y_AXIS.add(Z_AXIS), ROT_YZ_CW); }
  E(): void { this._rotateSlice(X_AXIS.add(Z_AXIS), ROT_XZ_CC); }
  Ei(): void { this._rotateSlice(X_AXIS.add(Z_AXIS), ROT_XZ_CW); }
  S(): void { this._rotateSlice(X_AXIS.add(Y_AXIS), ROT_XY_CW); }
  Si(): void { this._rotateSlice(X_AXIS.add(Y_AXIS), ROT_XY_CC); }

  // Whole-cube rotations
  X(): void { this._rotatePieces(this.pieces, ROT_YZ_CW); }
  Xi(): void { this._rotatePieces(this.pieces, ROT_YZ_CC); }
  Y(): void { this._rotatePieces(this.pieces, ROT_XZ_CW); }
  Yi(): void { this._rotatePieces(this.pieces, ROT_XZ_CC); }
  Z(): void { this._rotatePieces(this.pieces, ROT_XY_CW); }
  Zi(): void { this._rotatePieces(this.pieces, ROT_XY_CC); }

  sequence(moveStr: string): void {
    for (const name of moveStr.split(/\s+/).filter(Boolean)) {
      const fn = (this as unknown as Record<string, () => void>)[name];
      if (!fn) throw new Error(`Unknown move: ${name}`);
      fn.call(this);
    }
  }

  findPiece(...colors: string[]): Piece | undefined {
    if (colors.includes(null as unknown as string)) return undefined;
    return this.pieces.find(
      (p) =>
        p.colors.filter((c) => c === null).length === 3 - colors.length &&
        colors.every((c) => p.colors.includes(c)),
    );
  }

  getPiece(x: number, y: number, z: number): Piece | undefined {
    const target = new Point(x, y, z);
    return this.pieces.find((p) => p.pos.equals(target));
  }

  getItem(pos: Point): Piece | undefined {
    return this.pieces.find((p) => p.pos.equals(pos));
  }

  clone(): Cube {
    return new Cube(this);
  }

  leftColor(): string { return this.getItem(LEFT)!.colors[0]!; }
  rightColor(): string { return this.getItem(RIGHT)!.colors[0]!; }
  upColor(): string { return this.getItem(UP)!.colors[1]!; }
  downColor(): string { return this.getItem(DOWN)!.colors[1]!; }
  frontColor(): string { return this.getItem(FRONT)!.colors[2]!; }
  backColor(): string { return this.getItem(BACK)!.colors[2]!; }

  colors(): Set<string> {
    const s = new Set<string>();
    for (const p of this.pieces) {
      for (const c of p.colors) {
        if (c !== null) s.add(c);
      }
    }
    return s;
  }

  _colorList(): string[] {
    const right = this._face(RIGHT)
      .sort((a, b) => -a.pos.y + b.pos.y || -a.pos.z + b.pos.z)
      .map((p) => p.colors[0]!);
    const left = this._face(LEFT)
      .sort((a, b) => -a.pos.y + b.pos.y || a.pos.z - b.pos.z)
      .map((p) => p.colors[0]!);
    const up = this._face(UP)
      .sort((a, b) => a.pos.z - b.pos.z || a.pos.x - b.pos.x)
      .map((p) => p.colors[1]!);
    const down = this._face(DOWN)
      .sort((a, b) => -a.pos.z + b.pos.z || a.pos.x - b.pos.x)
      .map((p) => p.colors[1]!);
    const front = this._face(FRONT)
      .sort((a, b) => -a.pos.y + b.pos.y || a.pos.x - b.pos.x)
      .map((p) => p.colors[2]!);
    const back = this._face(BACK)
      .sort((a, b) => -a.pos.y + b.pos.y || -a.pos.x + b.pos.x)
      .map((p) => p.colors[2]!);

    return [
      ...up,
      ...left.slice(0, 3), ...front.slice(0, 3), ...right.slice(0, 3), ...back.slice(0, 3),
      ...left.slice(3, 6), ...front.slice(3, 6), ...right.slice(3, 6), ...back.slice(3, 6),
      ...left.slice(6, 9), ...front.slice(6, 9), ...right.slice(6, 9), ...back.slice(6, 9),
      ...down,
    ];
  }

  flatStr(): string {
    return this._colorList().join('');
  }

  equals(other: Cube): boolean {
    return this.flatStr() === other.flatStr();
  }

  getFaceColors(face: Point): string[] {
    const axis = face.equals(RIGHT) || face.equals(LEFT) ? 0
      : face.equals(UP) || face.equals(DOWN) ? 1 : 2;
    return this._face(face).map((p) => p.colors[axis]!);
  }

  static createSolved(): Cube {
    return new Cube(
      'WWWWWWWWW' +
      'OOO' + 'GGG' + 'RRR' + 'BBB' +
      'OOO' + 'GGG' + 'RRR' + 'BBB' +
      'OOO' + 'GGG' + 'RRR' + 'BBB' +
      'YYYYYYYYY',
    );
  }
}

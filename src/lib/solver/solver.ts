import { Point } from '../maths';
import { Cube, getRotFromFace, LEFT, RIGHT, UP, DOWN, FRONT, BACK } from '../cube';

export class Solver {
  cube: Cube;
  moves: string[] = [];

  private leftPiece;
  private rightPiece;
  private upPiece;
  private downPiece;
  private maxIterations = 12;

  constructor(cube: Cube) {
    this.cube = cube;
    this.leftPiece = this.cube.findPiece(this.cube.leftColor())!;
    this.rightPiece = this.cube.findPiece(this.cube.rightColor())!;
    this.upPiece = this.cube.findPiece(this.cube.upColor())!;
    this.downPiece = this.cube.findPiece(this.cube.downColor())!;
  }

  solve(): void {
    this.cross();
    this.crossCorners();
    this.secondLayer();
    this.backFaceEdges();
    this.lastLayerCornersPosition();
    this.lastLayerCornersOrientation();
    this.lastLayerEdges();
  }

  move(moveStr: string): void {
    const parts = moveStr.split(/\s+/).filter(Boolean);
    this.moves.push(...parts);
    this.cube.sequence(moveStr);
  }

  // Step 1
  cross(): void {
    const flPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor())!;
    const frPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor())!;
    const fuPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.upColor())!;
    const fdPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.downColor())!;

    this._crossLeftOrRight(flPiece, this.leftPiece, this.cube.leftColor(), 'L L', 'E L Ei Li');
    this._crossLeftOrRight(frPiece, this.rightPiece, this.cube.rightColor(), 'R R', 'Ei R E Ri');

    this.move('Z');
    this._crossLeftOrRight(fdPiece, this.downPiece, this.cube.leftColor(), 'L L', 'E L Ei Li');
    this._crossLeftOrRight(fuPiece, this.upPiece, this.cube.rightColor(), 'R R', 'Ei R E Ri');
    this.move('Zi');
  }

  private _crossLeftOrRight(
    edgePiece: import('../cube').Piece,
    facePiece: import('../cube').Piece,
    faceColor: string,
    move1: string,
    move2: string,
  ): void {
    if (
      edgePiece.pos.equals([facePiece.pos.x, facePiece.pos.y, 1]) &&
      edgePiece.colors[2] === this.cube.frontColor()
    ) {
      return;
    }

    let undoMove: string | null = null;

    if (edgePiece.pos.z === 0) {
      const pos = edgePiece.pos.clone();
      pos.x = 0;
      const [cw, cc] = getRotFromFace(pos)!;

      if (
        edgePiece.pos.equals(LEFT.add(UP)) ||
        edgePiece.pos.equals(RIGHT.add(DOWN))
      ) {
        this.move(cw);
        undoMove = cc;
      } else {
        this.move(cc);
        undoMove = cw;
      }
    } else if (edgePiece.pos.z === 1) {
      const pos = edgePiece.pos.clone();
      pos.z = 0;
      const [, cc] = getRotFromFace(pos)!;
      this.move(`${cc} ${cc}`);
      if (edgePiece.pos.x !== facePiece.pos.x) {
        const [cw2] = getRotFromFace(pos)!;
        undoMove = `${cw2} ${cw2}`;
      }
    }

    let count = 0;
    while (edgePiece.pos.x !== facePiece.pos.x || edgePiece.pos.y !== facePiece.pos.y) {
      this.move('B');
      if (++count >= this.maxIterations) throw new Error('Stuck in loop - unsolvable cube');
    }

    if (undoMove) this.move(undoMove);

    if (edgePiece.colors[0] === faceColor) {
      this.move(move1);
    } else {
      this.move(move2);
    }
  }

  // Step 2
  crossCorners(): void {
    const fldPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor(), this.cube.downColor())!;
    const fluPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor(), this.cube.upColor())!;
    const frdPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor(), this.cube.downColor())!;
    const fruPiece = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor(), this.cube.upColor())!;

    this.placeFrdCorner(frdPiece, this.rightPiece, this.downPiece, this.cube.frontColor());
    this.move('Z');
    this.placeFrdCorner(fruPiece, this.upPiece, this.rightPiece, this.cube.frontColor());
    this.move('Z');
    this.placeFrdCorner(fluPiece, this.leftPiece, this.upPiece, this.cube.frontColor());
    this.move('Z');
    this.placeFrdCorner(fldPiece, this.downPiece, this.leftPiece, this.cube.frontColor());
    this.move('Z');
  }

  private placeFrdCorner(
    cornerPiece: import('../cube').Piece,
    rightPiece: import('../cube').Piece,
    downPiece: import('../cube').Piece,
    frontColor: string,
  ): void {
    if (cornerPiece.pos.get(2) === 1) {
      const pos = cornerPiece.pos.clone();
      pos.x = 0;
      pos.z = 0;
      const [cw, cc] = getRotFromFace(pos)!;

      let count = 0;
      let undoMove = cc;
      while (cornerPiece.pos.get(2) !== -1) {
        this.move(cw);
        count++;
      }

      if (count > 1) {
        for (let i = 0; i < count; i++) this.move(cc);

        count = 0;
        while (cornerPiece.pos.get(2) !== -1) {
          this.move(cc);
          count++;
        }
        undoMove = cw;
      }

      this.move('B');
      for (let i = 0; i < count; i++) this.move(undoMove);
    }

    while (cornerPiece.pos.x !== rightPiece.pos.x || cornerPiece.pos.y !== downPiece.pos.y) {
      this.move('B');
    }

    if (cornerPiece.colors[0] === frontColor) {
      this.move('B D Bi Di');
    } else if (cornerPiece.colors[1] === frontColor) {
      this.move('Bi Ri B R');
    } else {
      this.move('Ri B B R Bi Bi D Bi Di');
    }
  }

  // Step 3
  secondLayer(): void {
    const rdPiece = this.cube.findPiece(this.cube.rightColor(), this.cube.downColor())!;
    const ruPiece = this.cube.findPiece(this.cube.rightColor(), this.cube.upColor())!;
    const ldPiece = this.cube.findPiece(this.cube.leftColor(), this.cube.downColor())!;
    const luPiece = this.cube.findPiece(this.cube.leftColor(), this.cube.upColor())!;

    this.placeMiddleLayerLdEdge(ldPiece, this.cube.leftColor(), this.cube.downColor());
    this.move('Z');
    this.placeMiddleLayerLdEdge(rdPiece, this.cube.leftColor(), this.cube.downColor());
    this.move('Z');
    this.placeMiddleLayerLdEdge(ruPiece, this.cube.leftColor(), this.cube.downColor());
    this.move('Z');
    this.placeMiddleLayerLdEdge(luPiece, this.cube.leftColor(), this.cube.downColor());
    this.move('Z');
  }

  private placeMiddleLayerLdEdge(
    ldPiece: import('../cube').Piece,
    leftColor: string,
    downColor: string,
  ): void {
    if (ldPiece.pos.z === 0) {
      let count = 0;
      while (ldPiece.pos.x !== -1 || ldPiece.pos.y !== -1) {
        this.move('Z');
        count++;
      }
      this.move('B L Bi Li Bi Di B D');
      for (let i = 0; i < count; i++) this.move('Zi');
    }

    if (ldPiece.colors[2] === leftColor) {
      while (ldPiece.pos.y !== -1) this.move('B');
      this.move('B L Bi Li Bi Di B D');
    } else if (ldPiece.colors[2] === downColor) {
      while (ldPiece.pos.x !== -1) this.move('B');
      this.move('Bi Di B D B L Bi Li');
    } else {
      throw new Error('BUG in placeMiddleLayerLdEdge');
    }
  }

  // Step 4
  backFaceEdges(): void {
    this.move('X X');

    const fc = () => this.cube.frontColor();
    const state1 = () =>
      this.cube.getPiece(0, 1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(-1, 0, 1)!.colors[2] === fc() &&
      this.cube.getPiece(0, -1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(1, 0, 1)!.colors[2] === fc();

    const state2 = () =>
      this.cube.getPiece(0, 1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(-1, 0, 1)!.colors[2] === fc();

    const state3 = () =>
      this.cube.getPiece(-1, 0, 1)!.colors[2] === fc() &&
      this.cube.getPiece(1, 0, 1)!.colors[2] === fc();

    const state4 = () =>
      this.cube.getPiece(0, 1, 1)!.colors[2] !== fc() &&
      this.cube.getPiece(-1, 0, 1)!.colors[2] !== fc() &&
      this.cube.getPiece(0, -1, 1)!.colors[2] !== fc() &&
      this.cube.getPiece(1, 0, 1)!.colors[2] !== fc();

    let count = 0;
    while (!state1()) {
      if (state4() || state2()) {
        this.move('D F R Fi Ri Di');
      } else if (state3()) {
        this.move('D R F Ri Fi Di');
      } else {
        this.move('F');
      }
      if (++count >= this.maxIterations) throw new Error('Stuck in loop - unsolvable cube');
    }

    this.move('Xi Xi');
  }

  // Step 5
  lastLayerCornersPosition(): void {
    this.move('X X');

    const move1 = 'Li Fi L D F Di Li F L F F';
    const move2 = 'F Li Fi L D F Di Li F L F';

    const c1 = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor(), this.cube.downColor())!;
    const c2 = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor(), this.cube.downColor())!;
    const c3 = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor(), this.cube.upColor())!;
    const c4 = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor(), this.cube.upColor())!;

    // place corner 4
    if (c4.pos.equals(new Point(1, -1, 1))) {
      this.move(move1 + ' Zi ' + move1 + ' Z');
    } else if (c4.pos.equals(new Point(1, 1, 1))) {
      this.move('Z ' + move2 + ' Zi');
    } else if (c4.pos.equals(new Point(-1, -1, 1))) {
      this.move('Zi ' + move1 + ' Z');
    }

    // place corner 2
    if (c2.pos.equals(new Point(1, 1, 1))) {
      this.move(move2 + ' ' + move1);
    } else if (c2.pos.equals(new Point(1, -1, 1))) {
      this.move(move1);
    }

    // place corners 3 and 1
    if (c3.pos.equals(new Point(1, -1, 1))) {
      this.move(move2);
    }

    this.move('Xi Xi');
  }

  // Step 6
  lastLayerCornersOrientation(): void {
    this.move('X X');

    const fc = () => this.cube.frontColor();

    const state1 = () =>
      this.cube.getPiece(1, 1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(-1, -1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[0] === fc();

    const state2 = () =>
      this.cube.getPiece(-1, 1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, 1, 1)!.colors[0] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[1] === fc();

    const state3 = () =>
      this.cube.getPiece(-1, -1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(-1, 1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(1, 1, 1)!.colors[2] === fc();

    const state4 = () =>
      this.cube.getPiece(-1, 1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(-1, -1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, 1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[2] === fc();

    const state5 = () =>
      this.cube.getPiece(-1, 1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[0] === fc();

    const state6 = () =>
      this.cube.getPiece(1, 1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[1] === fc() &&
      this.cube.getPiece(-1, -1, 1)!.colors[0] === fc() &&
      this.cube.getPiece(-1, 1, 1)!.colors[0] === fc();

    const state7 = () =>
      this.cube.getPiece(1, 1, 1)!.colors[0] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[0] === fc() &&
      this.cube.getPiece(-1, -1, 1)!.colors[0] === fc() &&
      this.cube.getPiece(-1, 1, 1)!.colors[0] === fc();

    const state8 = () =>
      this.cube.getPiece(1, 1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(1, -1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(-1, -1, 1)!.colors[2] === fc() &&
      this.cube.getPiece(-1, 1, 1)!.colors[2] === fc();

    const m1 = 'Ri Fi R Fi Ri F F R F F';
    const m2 = 'R F Ri F R F F Ri F F';

    let count = 0;
    while (!state8()) {
      if (state1()) this.move(m1);
      else if (state2()) this.move(m2);
      else if (state3()) this.move(m2 + ' F F ' + m1);
      else if (state4()) this.move(m2 + ' ' + m1);
      else if (state5()) this.move(m1 + ' F ' + m2);
      else if (state6()) this.move(m1 + ' Fi ' + m1);
      else if (state7()) this.move(m1 + ' F F ' + m1);
      else this.move('F');

      if (++count >= this.maxIterations) throw new Error('Stuck in loop - unsolvable cube');
    }

    const bruCorner = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor(), this.cube.upColor())!;
    while (!bruCorner.pos.equals(new Point(1, 1, 1))) {
      this.move('F');
    }

    this.move('Xi Xi');
  }

  // Step 7
  lastLayerEdges(): void {
    this.move('X X');

    const brEdge = this.cube.findPiece(this.cube.frontColor(), this.cube.rightColor())!;
    const blEdge = this.cube.findPiece(this.cube.frontColor(), this.cube.leftColor())!;
    const buEdge = this.cube.findPiece(this.cube.frontColor(), this.cube.upColor())!;
    const bdEdge = this.cube.findPiece(this.cube.frontColor(), this.cube.downColor())!;

    const state1 = () =>
      buEdge.colors[2] !== this.cube.frontColor() &&
      bdEdge.colors[2] !== this.cube.frontColor() &&
      blEdge.colors[2] !== this.cube.frontColor() &&
      brEdge.colors[2] !== this.cube.frontColor();

    const state2 = () =>
      buEdge.colors[2] === this.cube.frontColor() ||
      bdEdge.colors[2] === this.cube.frontColor() ||
      blEdge.colors[2] === this.cube.frontColor() ||
      brEdge.colors[2] === this.cube.frontColor();

    const cycleMv = 'R R F D Ui R R Di U F R R';
    const hMv = 'Ri S Ri Ri S S Ri Fi Fi R Si Si Ri Ri Si R Fi Fi';
    const fishMv = 'Di Li ' + hMv + ' L D';

    if (state1()) {
      this._handleLastLayerState1(hMv);
    }
    if (state2()) {
      this._handleLastLayerState2(cycleMv);
    }

    const hPattern1 = () =>
      this.cube.getPiece(-1, 0, 1)!.colors[0] !== this.cube.leftColor() &&
      this.cube.getPiece(1, 0, 1)!.colors[0] !== this.cube.rightColor() &&
      this.cube.getPiece(0, -1, 1)!.colors[1] === this.cube.downColor() &&
      this.cube.getPiece(0, 1, 1)!.colors[1] === this.cube.upColor();

    const hPattern2 = () =>
      this.cube.getPiece(-1, 0, 1)!.colors[0] === this.cube.leftColor() &&
      this.cube.getPiece(1, 0, 1)!.colors[0] === this.cube.rightColor() &&
      this.cube.getPiece(0, -1, 1)!.colors[1] === this.cube.frontColor() &&
      this.cube.getPiece(0, 1, 1)!.colors[1] === this.cube.frontColor();

    const fishPattern = () => {
      const fd = this.cube.getItem(FRONT.add(DOWN));
      const fr = this.cube.getItem(FRONT.add(RIGHT));
      return (
        fd !== undefined &&
        fr !== undefined &&
        fd.colors[2] === this.cube.downColor() &&
        fr.colors[2] === this.cube.rightColor() &&
        fd.colors[1] === this.cube.frontColor() &&
        fr.colors[0] === this.cube.frontColor()
      );
    };

    let count = 0;
    while (!this.cube.isSolved()) {
      for (let r = 0; r < 4; r++) {
        if (fishPattern()) {
          this.move(fishMv);
          if (this.cube.isSolved()) return;
        } else {
          this.move('Z');
        }
      }

      if (hPattern1()) {
        this.move(hMv);
      } else if (hPattern2()) {
        this.move('Z ' + hMv + ' Zi');
      } else {
        this.move(cycleMv);
      }

      if (++count >= this.maxIterations) throw new Error('Stuck in loop - unsolvable cube');
    }

    this.move('Xi Xi');
  }

  private _handleLastLayerState1(hMove: string): void {
    const checkEdgeLr = () =>
      this.cube.getItem(LEFT.add(FRONT))!.colors[2] === this.cube.leftColor();

    let count = 0;
    while (!checkEdgeLr()) {
      this.move('F');
      if (++count === 4) throw new Error('Bug: Failed to handle last layer state1');
    }

    this.move(hMove);

    for (let i = 0; i < count; i++) this.move('Fi');
  }

  private _handleLastLayerState2(cycleMove: string): void {
    const correctEdge = (): import('../cube').Piece | null => {
      let piece = this.cube.getItem(LEFT.add(FRONT))!;
      if (piece.colors[2] === this.cube.frontColor() && piece.colors[0] === this.cube.leftColor()) return piece;
      piece = this.cube.getItem(RIGHT.add(FRONT))!;
      if (piece.colors[2] === this.cube.frontColor() && piece.colors[0] === this.cube.rightColor()) return piece;
      piece = this.cube.getItem(UP.add(FRONT))!;
      if (piece.colors[2] === this.cube.frontColor() && piece.colors[1] === this.cube.upColor()) return piece;
      piece = this.cube.getItem(DOWN.add(FRONT))!;
      if (piece.colors[2] === this.cube.frontColor() && piece.colors[1] === this.cube.downColor()) return piece;
      return null;
    };

    let count = 0;
    let edge: import('../cube').Piece | null = null;
    while (true) {
      edge = correctEdge();
      if (edge !== null) break;
      this.move(cycleMove);
      count++;
      if (count % 3 === 0) this.move('Z');
      if (count >= this.maxIterations) throw new Error('Stuck in loop - unsolvable cube');
    }

    while (!edge!.pos.equals(new Point(-1, 0, 1))) {
      this.move('Z');
    }
  }
}

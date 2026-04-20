export class Point {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  add(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  sub(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  scale(s: number): Point {
    return new Point(this.x * s, this.y * s, this.z * s);
  }

  dot(other: Point): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Point): Point {
    return new Point(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  get(i: number): number {
    if (i === 0) return this.x;
    if (i === 1) return this.y;
    if (i === 2) return this.z;
    throw new RangeError('Point index out of range');
  }

  count(val: number): number {
    return +(this.x === val) + +(this.y === val) + +(this.z === val);
  }

  equals(other: Point | [number, number, number]): boolean {
    if (Array.isArray(other)) {
      return this.x === other[0] && this.y === other[1] && this.z === other[2];
    }
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  any(): boolean {
    return this.x !== 0 || this.y !== 0 || this.z !== 0;
  }

  clone(): Point {
    return new Point(this.x, this.y, this.z);
  }

  toString(): string {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}

export class Matrix {
  public vals: number[];

  constructor(...args: number[]) {
    if (args.length !== 9) {
      throw new Error(`Matrix requires 9 values, got ${args.length}`);
    }
    this.vals = args;
  }

  *rows(): Generator<[number, number, number]> {
    yield [this.vals[0], this.vals[1], this.vals[2]];
    yield [this.vals[3], this.vals[4], this.vals[5]];
    yield [this.vals[6], this.vals[7], this.vals[8]];
  }

  *cols(): Generator<[number, number, number]> {
    yield [this.vals[0], this.vals[3], this.vals[6]];
    yield [this.vals[1], this.vals[4], this.vals[7]];
    yield [this.vals[2], this.vals[5], this.vals[8]];
  }

  mulPoint(p: Point): Point {
    const r: number[] = [];
    for (const row of this.rows()) {
      r.push(p.dot(new Point(row[0], row[1], row[2])));
    }
    return new Point(r[0], r[1], r[2]);
  }

  mulMatrix(other: Matrix): Matrix {
    const result: number[] = [];
    const otherCols = [...other.cols()];
    for (const row of this.rows()) {
      for (const col of otherCols) {
        const rp = new Point(row[0], row[1], row[2]);
        const cp = new Point(col[0], col[1], col[2]);
        result.push(rp.dot(cp));
      }
    }
    return new Matrix(...result);
  }

  equals(other: Matrix): boolean {
    return this.vals.every((v, i) => v === other.vals[i]);
  }
}

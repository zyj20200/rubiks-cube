import { describe, it, expect } from 'vitest';
import { Point, Matrix } from '../maths';

describe('Point', () => {
  it('constructor and access', () => {
    const p = new Point(1, 2, 3);
    expect(p.x).toBe(1);
    expect(p.y).toBe(2);
    expect(p.z).toBe(3);
    expect(p.get(0)).toBe(1);
    expect(p.get(1)).toBe(2);
    expect(p.get(2)).toBe(3);
  });

  it('count', () => {
    const r = new Point(2, 2, 3);
    expect(r.count(2)).toBe(2);
    expect(r.count(3)).toBe(1);
    expect(r.count(5)).toBe(0);
    expect(new Point(9, 9, 9).count(9)).toBe(3);
  });

  it('equals', () => {
    const p = new Point(1, 2, 3);
    expect(p.equals(new Point(1, 2, 3))).toBe(true);
    expect(p.equals([1, 2, 3])).toBe(true);
    expect(p.equals(new Point(1, 2, 4))).toBe(false);
  });

  it('add', () => {
    expect(new Point(1, 2, 3).add(new Point(2, 5, 9)).equals(new Point(3, 7, 12))).toBe(true);
  });

  it('sub', () => {
    expect(new Point(1, 2, 3).sub(new Point(2, 5, 9)).equals(new Point(-1, -3, -6))).toBe(true);
  });

  it('scale', () => {
    expect(new Point(1, 2, 3).scale(3).equals(new Point(3, 6, 9))).toBe(true);
  });

  it('dot', () => {
    expect(new Point(1, 2, 3).dot(new Point(2, 5, 9))).toBe(39);
  });

  it('cross', () => {
    expect(new Point(1, 2, 3).cross(new Point(2, 5, 9)).equals(new Point(3, -3, 1))).toBe(true);
  });
});

describe('Matrix', () => {
  it('mulPoint', () => {
    const m = new Matrix(1, 0, 0, 0, 0, -1, 0, 1, 0);
    const p = new Point(1, 2, 3);
    const r = m.mulPoint(p);
    expect(r.equals(new Point(1, -3, 2))).toBe(true);
  });

  it('mulMatrix', () => {
    const m1 = new Matrix(1, 2, 3, 4, 5, 6, 7, 8, 9);
    const m2 = new Matrix(9, 8, 7, 6, 5, 4, 3, 2, 1);
    const r = m1.mulMatrix(m2);
    expect(r.vals).toEqual([30, 24, 18, 84, 69, 54, 138, 114, 90]);
  });
});

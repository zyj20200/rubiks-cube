import { describe, it, expect } from 'vitest';
import { Cube } from '../cube';
import { Solver } from '../solver/solver';
import { optimizeMoves } from '../solver/optimizer';

const solvableCubes = [
  'DLURRDFFUBBLDDRBRBLDLRBFRUULFBDDUFBRBBRFUDFLUDLUULFLFR',
  'GGBYOBWBBBOYRGYOYOGWROWYWGWRBRGYBGOOGBBYOYORWWRRGRWRYW',
  'BYOYYRGOWRROWGOYWGBBGOROBWGWORBBWRWYRGYBGYWOGBROYGBWYR',
  'YWYYGWWGYBBYRRBRGWOOOYWRWRBOBYROWRGOBGRWOGWBBGBGOYYGRO',
  'ROORRYOWBWWGBYGRRBYBGGGGWWOYYBRBOWBYRWOGBYORYBOWYOGRGW',
];

const unsolvableCubes = [
  'ORWOWGWYWGBGRGRBOBOWYGGBRRBYBRGOWOYGRYRBBGOOBYOYRYWYWW',
  'UUUUUUUUULLLFFFRRRBBBLLLFBFRRRBFBLLLFFFRRRBBBDDDDDDDDD',
  'UUBUUUUUULLLFFFRRRUBBLLLFFFRRRBBBLLLFFFRRRBBBDDDDDDDDD',
  'UUUUUUUUULLLFFFRRRBBBLLLFFFRRRBBBLLLFFFRRBRBBDDDDDDDDD',
  'UUUUUUUUULLLFFFRRRBBBLLFLFFRRRBBBLLLFFFRRRBBBDDDDDDDDD',
];

describe('Solver', () => {
  for (const cubeStr of solvableCubes) {
    it(`solves ${cubeStr.slice(0, 20)}...`, () => {
      const c = new Cube(cubeStr);
      const solver = new Solver(c);
      solver.solve();
      expect(c.isSolved()).toBe(true);

      // Verify the moves reproduce the solution
      const check = new Cube(cubeStr);
      check.sequence(solver.moves.join(' '));
      expect(check.isSolved()).toBe(true);
    });
  }

  for (const cubeStr of unsolvableCubes) {
    it(`rejects unsolvable ${cubeStr.slice(0, 20)}...`, () => {
      const c = new Cube(cubeStr);
      const solver = new Solver(c);
      expect(() => solver.solve()).toThrow('Stuck in loop');
    });
  }

  it('solves random scrambles', () => {
    const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
    const suffixes = ['', 'i'];

    for (let trial = 0; trial < 50; trial++) {
      const c = Cube.createSolved();
      const scramble: string[] = [];
      let lastFace = '';
      for (let i = 0; i < 25; i++) {
        let face: string;
        do { face = faces[Math.floor(Math.random() * faces.length)]; } while (face === lastFace);
        scramble.push(face + suffixes[Math.floor(Math.random() * suffixes.length)]);
        lastFace = face;
      }
      c.sequence(scramble.join(' '));

      const solver = new Solver(c);
      solver.solve();
      expect(c.isSolved()).toBe(true);
    }
  });
});

describe('Optimizer', () => {
  const movePairs: [string, string][] = [
    ['R', 'Ri'], ['L', 'Li'], ['U', 'Ui'], ['D', 'Di'],
    ['F', 'Fi'], ['B', 'Bi'], ['M', 'Mi'], ['E', 'Ei'],
    ['S', 'Si'], ['X', 'Xi'], ['Y', 'Yi'], ['Z', 'Zi'],
  ];

  it('repeat three optimization', () => {
    for (const [cw, cc] of movePairs) {
      expect(optimizeMoves([cw, cw, cw])).toEqual([cc]);
      expect(optimizeMoves([cc, cc, cc])).toEqual([cw]);
    }
  });

  it('do-undo optimization', () => {
    for (const [cw, cc] of movePairs) {
      expect(optimizeMoves([cc, cw])).toEqual([]);
      expect(optimizeMoves([cw, cc])).toEqual([]);
      expect(optimizeMoves([cw, cw, cc, cc])).toEqual([]);
    }
  });

  it('optimized moves produce same cube state', () => {
    const solvedStr = 'UUUUUUUUULLLFFFRRRBBBLLLFFFRRRBBBLLLFFFRRRBBBDDDDDDDDD';
    const moves = 'Z U L D R E M Zi'.split(' ');
    const expected = 'L D R U Mi E'.split(' ');

    const c = new Cube(solvedStr);
    c.sequence(moves.join(' '));

    const optimized = optimizeMoves([...moves]);
    const d = new Cube(solvedStr);
    d.sequence(optimized.join(' '));

    expect(optimized).toEqual(expected);
    expect(c.flatStr()).toBe(d.flatStr());
  });
});

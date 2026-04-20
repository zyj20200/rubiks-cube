import { describe, it, expect, beforeEach } from 'vitest';
import { Cube, FRONT, UP, LEFT } from '../cube';

const solvedStr =
  '    UUU\n    UUU\n    UUU\n' +
  'LLL FFF RRR BBB\nLLL FFF RRR BBB\nLLL FFF RRR BBB\n' +
  '    DDD\n    DDD\n    DDD';

const debugStr =
  '    012\n    345\n    678\n' +
  '9ab cde fgh ijk\nlmn opq rst uvw\nxyz ABC DEF GHI\n' +
  '    JKL\n    MNO\n    PQR';

function cubeStr(c: Cube): string {
  const cl = c._colorList();
  const rows = [
    `    ${cl[0]}${cl[1]}${cl[2]}`,
    `    ${cl[3]}${cl[4]}${cl[5]}`,
    `    ${cl[6]}${cl[7]}${cl[8]}`,
    `${cl[9]}${cl[10]}${cl[11]} ${cl[12]}${cl[13]}${cl[14]} ${cl[15]}${cl[16]}${cl[17]} ${cl[18]}${cl[19]}${cl[20]}`,
    `${cl[21]}${cl[22]}${cl[23]} ${cl[24]}${cl[25]}${cl[26]} ${cl[27]}${cl[28]}${cl[29]} ${cl[30]}${cl[31]}${cl[32]}`,
    `${cl[33]}${cl[34]}${cl[35]} ${cl[36]}${cl[37]}${cl[38]} ${cl[39]}${cl[40]}${cl[41]} ${cl[42]}${cl[43]}${cl[44]}`,
    `    ${cl[45]}${cl[46]}${cl[47]}`,
    `    ${cl[48]}${cl[49]}${cl[50]}`,
    `    ${cl[51]}${cl[52]}${cl[53]}`,
  ];
  return rows.join('\n');
}

describe('Cube', () => {
  let debugCube: Cube;
  let solvedCube: Cube;

  beforeEach(() => {
    debugCube = new Cube(debugStr);
    solvedCube = new Cube(solvedStr);
  });

  it('constructor from string', () => {
    expect(cubeStr(debugCube)).toBe(debugStr);
  });

  it('constructor strips whitespace', () => {
    const cube = new Cube(debugStr.split('').join(' '));
    expect(cubeStr(cube)).toBe(debugStr);
  });

  it('clone', () => {
    const c = new Cube(debugCube);
    expect(cubeStr(c)).toBe(debugStr);
  });

  it('isSolved', () => {
    expect(solvedCube.isSolved()).toBe(true);
    solvedCube.L();
    expect(solvedCube.isSolved()).toBe(false);
  });

  it('findPiece face', () => {
    const p = debugCube.findPiece('p');
    expect(p).toBeDefined();
    expect(p!.type).toBe('face');
    expect(p!.pos.equals(FRONT)).toBe(true);
  });

  it('findPiece edge', () => {
    const p = debugCube.findPiece('d', '7');
    expect(p).toBeDefined();
    expect(p!.type).toBe('edge');
    expect(p!.pos.equals(FRONT.add(UP))).toBe(true);
  });

  it('findPiece corner', () => {
    const p = debugCube.findPiece('b', '6', 'c');
    expect(p).toBeDefined();
    expect(p!.type).toBe('corner');
    expect(p!.pos.equals(FRONT.add(UP).add(LEFT))).toBe(true);
  });

  it('sequence', () => {
    solvedCube.sequence('L U M Ri X E Xi Ri D D F F Bi');
    expect(cubeStr(solvedCube)).toBe(
      '    DLU\n    RRD\n    FFU\n' +
      'BBL DDR BRB LDL\nRBF RUU LFB DDU\nFBR BBR FUD FLU\n' +
      '    DLU\n    ULF\n    LFR'
    );
  });

  // Face moves
  const moveTests: [string, string][] = [
    ['L', '    I12\n    w45\n    k78\n' +
          'xl9 0de fgh ijP\nyma 3pq rst uvM\nznb 6BC DEF GHJ\n' +
          '    cKL\n    oNO\n    AQR'],
    ['Li', '    c12\n    o45\n    A78\n' +
           'bnz Jde fgh ij6\namy Mpq rst uv3\n9lx PBC DEF GH0\n' +
           '    IKL\n    wNO\n    kQR'],
    ['R', '    01e\n    34q\n    67C\n' +
          '9ab cdL Drf 8jk\nlmn opO Esg 5vw\nxyz ABR Fth 2HI\n' +
          '    JKG\n    MNu\n    PQi'],
    ['Ri', '    01G\n    34u\n    67i\n' +
           '9ab cd2 htF Rjk\nlmn op5 gsE Ovw\nxyz AB8 frD LHI\n' +
           '    JKe\n    MNq\n    PQC'],
    ['U', '    630\n    741\n    852\n' +
          'cde fgh ijk 9ab\nlmn opq rst uvw\nxyz ABC DEF GHI\n' +
          '    JKL\n    MNO\n    PQR'],
    ['Ui', '    258\n    147\n    036\n' +
           'ijk 9ab cde fgh\nlmn opq rst uvw\nxyz ABC DEF GHI\n' +
           '    JKL\n    MNO\n    PQR'],
    ['D', '    012\n    345\n    678\n' +
          '9ab cde fgh ijk\nlmn opq rst uvw\nGHI xyz ABC DEF\n' +
          '    PMJ\n    QNK\n    ROL'],
    ['Di', '    012\n    345\n    678\n' +
           '9ab cde fgh ijk\nlmn opq rst uvw\nABC DEF GHI xyz\n' +
           '    LOR\n    KNQ\n    JMP'],
    ['F', '    012\n    345\n    znb\n' +
          '9aJ Aoc 6gh ijk\nlmK Bpd 7st uvw\nxyL Cqe 8EF GHI\n' +
          '    Drf\n    MNO\n    PQR'],
    ['Fi', '    012\n    345\n    frD\n' +
           '9a8 eqC Lgh ijk\nlm7 dpB Kst uvw\nxy6 coA JEF GHI\n' +
           '    bnz\n    MNO\n    PQR'],
    ['B', '    htF\n    345\n    678\n' +
          '2ab cde fgR Gui\n1mn opq rsQ Hvj\n0yz ABC DEP Iwk\n' +
          '    JKL\n    MNO\n    9lx'],
    ['Bi', '    xl9\n    345\n    678\n' +
           'Pab cde fg0 kwI\nQmn opq rs1 jvH\nRyz ABC DE2 iuG\n' +
           '    JKL\n    MNO\n    Fth'],
    ['M', '    0H2\n    3v5\n    6j8\n' +
          '9ab c1e fgh iQk\nlmn o4q rst uNw\nxyz A7C DEF GKI\n' +
          '    JdL\n    MpO\n    PBR'],
    ['Mi', '    0d2\n    3p5\n    6B8\n' +
           '9ab cKe fgh i7k\nlmn oNq rst u4w\nxyz AQC DEF G1I\n' +
           '    JHL\n    MvO\n    PjR'],
    ['E', '    012\n    345\n    678\n' +
          '9ab cde fgh ijk\nuvw lmn opq rst\nxyz ABC DEF GHI\n' +
          '    JKL\n    MNO\n    PQR'],
    ['Ei', '    012\n    345\n    678\n' +
           '9ab cde fgh ijk\nopq rst uvw lmn\nxyz ABC DEF GHI\n' +
           '    JKL\n    MNO\n    PQR'],
    ['S', '    012\n    yma\n    678\n' +
          '9Mb cde f3h ijk\nlNn opq r4t uvw\nxOz ABC D5F GHI\n' +
          '    JKL\n    Esg\n    PQR'],
    ['Si', '    012\n    gsE\n    678\n' +
           '95b cde fOh ijk\nl4n opq rNt uvw\nx3z ABC DMF GHI\n' +
           '    JKL\n    amy\n    PQR'],
    ['X', '    cde\n    opq\n    ABC\n' +
          'bnz JKL Drf 876\namy MNO Esg 543\n9lx PQR Fth 210\n' +
          '    IHG\n    wvu\n    kji'],
    ['Xi', '    IHG\n    wvu\n    kji\n' +
           'xl9 012 htF RQP\nyma 345 gsE ONM\nznb 678 frD LKJ\n' +
           '    cde\n    opq\n    ABC'],
    ['Y', '    630\n    741\n    852\n' +
          'cde fgh ijk 9ab\nopq rst uvw lmn\nABC DEF GHI xyz\n' +
          '    LOR\n    KNQ\n    JMP'],
    ['Yi', '    258\n    147\n    036\n' +
           'ijk 9ab cde fgh\nuvw lmn opq rst\nGHI xyz ABC DEF\n' +
           '    PMJ\n    QNK\n    ROL'],
    ['Z', '    xl9\n    yma\n    znb\n' +
          'PMJ Aoc 630 kwI\nQNK Bpd 741 jvH\nROL Cqe 852 iuG\n' +
          '    Drf\n    Esg\n    Fth'],
    ['Zi', '    htF\n    gsE\n    frD\n' +
           '258 eqC LOR Gui\n147 dpB KNQ Hvj\n036 coA JMP Iwk\n' +
           '    bnz\n    amy\n    9lx'],
  ];

  for (const [move, expected] of moveTests) {
    it(`move ${move}`, () => {
      const c = new Cube(debugStr);
      c.sequence(move);
      expect(cubeStr(c)).toBe(expected);
    });
  }

  it('move and inverse roundtrip', () => {
    const names = ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'X', 'Y', 'Z'];
    for (const name of names) {
      const c = new Cube(debugStr);
      const before = cubeStr(c);
      c.sequence(name);
      expect(cubeStr(c)).not.toBe(before);
      c.sequence(name + 'i');
      expect(cubeStr(c)).toBe(before);
    }
  });
});

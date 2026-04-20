import { Cube, FRONT, BACK, UP, DOWN, LEFT, RIGHT } from '../cube';

export function detectCurrentStep(cube: Cube): number {
  if (cube.isSolved()) return 7;

  const fc = cube.frontColor();
  const rc = cube.rightColor();
  const lc = cube.leftColor();
  const uc = cube.upColor();
  const dc = cube.downColor();
  const bc = cube.backColor();

  // Step 1: front cross
  const crossDone = (() => {
    const fl = cube.findPiece(fc, lc);
    const fr = cube.findPiece(fc, rc);
    const fu = cube.findPiece(fc, uc);
    const fd = cube.findPiece(fc, dc);
    if (!fl || !fr || !fu || !fd) return false;
    return (
      fl.pos.equals([-1, 0, 1]) && fl.colors[2] === fc &&
      fr.pos.equals([1, 0, 1]) && fr.colors[2] === fc &&
      fu.pos.equals([0, 1, 1]) && fu.colors[2] === fc &&
      fd.pos.equals([0, -1, 1]) && fd.colors[2] === fc
    );
  })();
  if (!crossDone) return 0;

  // Step 2: front corners
  const cornersDone = (() => {
    const pieces = [
      { colors: [fc, rc, dc], pos: [1, -1, 1] as [number, number, number] },
      { colors: [fc, rc, uc], pos: [1, 1, 1] as [number, number, number] },
      { colors: [fc, lc, dc], pos: [-1, -1, 1] as [number, number, number] },
      { colors: [fc, lc, uc], pos: [-1, 1, 1] as [number, number, number] },
    ];
    return pieces.every(({ colors, pos }) => {
      const p = cube.findPiece(...colors);
      return p && p.pos.equals(pos) && p.colors[2] === fc;
    });
  })();
  if (!cornersDone) return 1;

  // Step 3: second layer edges
  const secondLayerDone = (() => {
    const edges = [
      { colors: [rc, dc], pos: [1, -1, 0] as [number, number, number] },
      { colors: [rc, uc], pos: [1, 1, 0] as [number, number, number] },
      { colors: [lc, dc], pos: [-1, -1, 0] as [number, number, number] },
      { colors: [lc, uc], pos: [-1, 1, 0] as [number, number, number] },
    ];
    return edges.every(({ colors, pos }) => {
      const p = cube.findPiece(...colors);
      return p && p.pos.equals(pos);
    });
  })();
  if (!secondLayerDone) return 2;

  // Step 4: back face cross (edge orientation)
  const backCrossDone = (() => {
    const edgePositions = [
      [0, 1, -1], [0, -1, -1], [-1, 0, -1], [1, 0, -1],
    ] as [number, number, number][];
    return edgePositions.every((pos) => {
      const p = cube.getPiece(...pos);
      return p && p.colors[2] === bc;
    });
  })();
  if (!backCrossDone) return 3;

  // Step 5: back face corners position
  const cornerPositionDone = (() => {
    const cornerSpecs = [
      [bc, rc, dc], [bc, rc, uc], [bc, lc, dc], [bc, lc, uc],
    ];
    return cornerSpecs.every((colors) => {
      const p = cube.findPiece(...colors);
      if (!p) return false;
      return p.pos.z === -1;
    });
  })();
  if (!cornerPositionDone) return 4;

  // Step 6: back face corners orientation
  const cornerOrientationDone = (() => {
    const cornerPositions = [
      [1, 1, -1], [1, -1, -1], [-1, 1, -1], [-1, -1, -1],
    ] as [number, number, number][];
    return cornerPositions.every((pos) => {
      const p = cube.getPiece(...pos);
      return p && p.colors[2] === bc;
    });
  })();
  if (!cornerOrientationDone) return 5;

  // Step 7 check: back face edges position - if not solved yet, we're at step 6
  return 6;
}

export const STEP_INFO = [
  { step: 0, nameZh: '开始', nameEn: 'Start', description: '准备开始还原魔方' },
  { step: 1, nameZh: '底面十字', nameEn: 'White Cross', description: '在前面（白色面）形成十字' },
  { step: 2, nameZh: '底面角块', nameEn: 'White Corners', description: '还原前面（白色面）的四个角块' },
  { step: 3, nameZh: '中层棱块', nameEn: 'Middle Layer', description: '还原中间层的四个棱块' },
  { step: 4, nameZh: '顶面十字', nameEn: 'Yellow Cross', description: '在背面（黄色面）形成十字' },
  { step: 5, nameZh: '顶面角块方向', nameEn: 'Yellow Corners Orientation', description: '调整背面角块的朝向' },
  { step: 6, nameZh: '顶面角块位置', nameEn: 'Yellow Corners Position', description: '调整背面角块的位置' },
  { step: 7, nameZh: '顶面棱块位置', nameEn: 'Yellow Edges', description: '调整背面棱块完成还原' },
];

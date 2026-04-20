'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { COLOR_MAP } from '@/lib/cube-utils';

interface CubieProps {
  position: [number, number, number];
  colors: {
    px?: string | null;
    nx?: string | null;
    py?: string | null;
    ny?: string | null;
    pz?: string | null;
    nz?: string | null;
  };
}

const DARK = '#222222';
const GAP = 1.03;
const STICKER_SIZE = 0.82;
const STICKER_RADIUS = 0.13;
const STICKER_OFFSET = 0.476;

function faceColor(c: string | null | undefined): string | null {
  if (!c) return null;
  return COLOR_MAP[c] || null;
}

function createRoundedRectGeo(w: number, h: number, r: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(shape);
}

const stickerGeo = createRoundedRectGeo(STICKER_SIZE, STICKER_SIZE, STICKER_RADIUS);

const STICKER_DEFS: { key: keyof CubieProps['colors']; pos: [number, number, number]; rot: [number, number, number] }[] = [
  { key: 'px', pos: [STICKER_OFFSET, 0, 0], rot: [0, Math.PI / 2, 0] },
  { key: 'nx', pos: [-STICKER_OFFSET, 0, 0], rot: [0, -Math.PI / 2, 0] },
  { key: 'py', pos: [0, STICKER_OFFSET, 0], rot: [-Math.PI / 2, 0, 0] },
  { key: 'ny', pos: [0, -STICKER_OFFSET, 0], rot: [Math.PI / 2, 0, 0] },
  { key: 'pz', pos: [0, 0, STICKER_OFFSET], rot: [0, 0, 0] },
  { key: 'nz', pos: [0, 0, -STICKER_OFFSET], rot: [0, Math.PI, 0] },
];

export default function Cubie({ position, colors }: CubieProps) {
  const stickers = useMemo(() => {
    const result: { pos: [number, number, number]; rot: [number, number, number]; color: string }[] = [];
    for (const def of STICKER_DEFS) {
      const hex = faceColor(colors[def.key]);
      if (hex) {
        result.push({ pos: def.pos, rot: def.rot, color: hex });
      }
    }
    return result;
  }, [colors]);

  return (
    <group position={[position[0] * GAP, position[1] * GAP, position[2] * GAP]}>
      <RoundedBox args={[0.95, 0.95, 0.95]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={DARK} />
      </RoundedBox>
      {stickers.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} geometry={stickerGeo}>
          <meshStandardMaterial color={s.color} roughness={0.45} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

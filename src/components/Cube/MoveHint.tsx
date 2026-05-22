'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCubeStore } from '@/store/cube-store';
import { getMoveHintGeom, type MoveHintGeom } from '@/lib/move-hint';

const FILL = '#ffffff'; // arrow body — visible on every sticker colour
const EDGE = '#1e293b'; // soft dark outline (slate-800)
const GAP = 1.03; // matches Cubie spacing
const OFFSET = 0.5; // float just above the sticker surface (0.476)

const AXES = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

// Build a closed Shape through `pts` with every corner rounded by `r`
// (clamped per corner), giving a smooth, polished outline.
function roundedShape(pts: [number, number][], r: number): THREE.Shape {
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const len1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const len2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const rr = Math.min(r, len1 / 2, len2 / 2);
    const p1: [number, number] = [
      cur[0] + ((prev[0] - cur[0]) / len1) * rr,
      cur[1] + ((prev[1] - cur[1]) / len1) * rr,
    ];
    const p2: [number, number] = [
      cur[0] + ((next[0] - cur[0]) / len2) * rr,
      cur[1] + ((next[1] - cur[1]) / len2) * rr,
    ];
    if (i === 0) s.moveTo(p1[0], p1[1]);
    else s.lineTo(p1[0], p1[1]);
    s.quadraticCurveTo(cur[0], cur[1], p2[0], p2[1]);
  }
  s.closePath();
  return s;
}

// A sleek arrow pointing +Y in its local XY plane, with rounded corners.
const ARROW_GEO = (() => {
  const sh = 0.1; // shaft half-width
  const hw = 0.3; // head half-width
  const len = 1.7; // total length (spans the 3-sticker strip)
  const hl = 0.52; // head length
  const tail = -len / 2;
  const tip = len / 2;
  const neck = tip - hl;
  const pts: [number, number][] = [
    [-sh, tail], [sh, tail], [sh, neck], [hw, neck], [0, tip], [-hw, neck], [-sh, neck],
  ];
  return new THREE.ShapeGeometry(roundedShape(pts, 0.08));
})();

interface ArrowInst {
  position: [number, number, number];
  quaternion: [number, number, number, number];
}

// One big arrow on each face perpendicular to the turn axis, lying on the layer
// strip and pointing the way that strip slides. The cap faces (parallel to the
// axis) rotate rather than slide, so they get no arrow.
function buildArrows(geom: MoveHintGeom): ArrowInst[] {
  const a = geom.axisIdx;
  const band = geom.whole ? 0 : geom.layer; // coordinate of the layer along the axis
  const omega = AXES[a].clone().multiplyScalar(geom.dir);

  const out: ArrowInst[] = [];
  for (let f = 0; f < 3; f++) {
    if (f === a) continue; // skip the rotating cap faces
    const t = 3 - a - f; // the third axis (strip + motion direction)
    for (const sf of [1, -1]) {
      const p = new THREE.Vector3();
      p.setComponent(a, band);
      p.setComponent(f, sf);
      p.setComponent(t, 0);

      const v = new THREE.Vector3().crossVectors(omega, p); // surface velocity
      const dir = Math.sign(v.getComponent(t));
      if (dir === 0) continue;

      const arrowDir = AXES[t].clone().multiplyScalar(dir);
      const normal = AXES[f].clone().multiplyScalar(sf);
      const pos = p.clone().multiplyScalar(GAP).addScaledVector(normal, OFFSET);

      // local +Z → face normal, local +Y → motion direction
      const xA = new THREE.Vector3().crossVectors(arrowDir, normal).normalize();
      const m = new THREE.Matrix4().makeBasis(xA, arrowDir, normal);
      const q = new THREE.Quaternion().setFromRotationMatrix(m);

      out.push({
        position: [pos.x, pos.y, pos.z],
        quaternion: [q.x, q.y, q.z, q.w],
      });
    }
  }
  return out;
}

export default function MoveHint() {
  const mode = useCubeStore((s) => s.mode);
  const isAnimating = useCubeStore((s) => s.isAnimating);
  const teachingSolution = useCubeStore((s) => s.teachingSolution);
  const teachingSolutionIndex = useCubeStore((s) => s.teachingSolutionIndex);

  const move =
    mode === 'teaching' && !isAnimating && teachingSolution
      ? teachingSolution[teachingSolutionIndex]
      : undefined;
  const geom = move ? getMoveHintGeom(move) : null;

  const arrows = useMemo(() => (geom ? buildArrows(geom) : []), [geom]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!geom) return;
    tRef.current += delta;
    const s = 1 + 0.07 * (0.5 + 0.5 * Math.sin(tRef.current * 4)); // gentle pulse
    for (const g of groupRefs.current) {
      if (g) g.scale.setScalar(s);
    }
  });

  if (!geom) return null;

  return (
    <group>
      {arrows.map((arr, i) => (
        <group
          key={i}
          position={arr.position}
          quaternion={arr.quaternion}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          {/* soft outline for definition on light stickers */}
          <mesh geometry={ARROW_GEO} scale={1.16} renderOrder={998}>
            <meshBasicMaterial
              color={EDGE}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {/* white body, slightly more outward so it draws on top */}
          <mesh geometry={ARROW_GEO} position={[0, 0, 0.006]} renderOrder={999}>
            <meshBasicMaterial color={FILL} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

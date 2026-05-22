'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCubeStore } from '@/store/cube-store';
import { getMoveHintGeom, type MoveHintGeom } from '@/lib/move-hint';

const ARROW_COLOR = '#ffffff'; // bold white turn arrow (does not tint the cube)
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const AXES = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

const SWEEP = Math.PI * 1.55; // arc length of the turn arrow (~280°)

// A single curved arrow placed on the face being turned, oriented to read as a
// clockwise / counter-clockwise rotation matching the move. It floats above the
// face as a separate marker and never changes the sticker colours.
function buildArrow(geom: MoveHintGeom) {
  const axisUnit = AXES[geom.axisIdx];
  const faceMove = !geom.whole && geom.layer !== 0;
  const sgn = faceMove ? Math.sign(geom.layer) : 1; // which end we view from
  const normal = axisUnit.clone().multiplyScalar(sgn);

  const dist = faceMove ? 1.55 : 1.85;
  const center = normal.clone().multiplyScalar(dist);

  const radius = faceMove ? 0.5 : 0.72;
  // ω·n > 0 ⇒ rotation points toward the viewer ⇒ counter-clockwise.
  const ccw = geom.dir * sgn > 0;

  const orient = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, normal);

  const headAngle = SWEEP;
  const headPos = new THREE.Vector3(Math.cos(headAngle) * radius, Math.sin(headAngle) * radius, 0);
  const tangent = new THREE.Vector3(-Math.sin(headAngle), Math.cos(headAngle), 0); // CCW tangent
  const headQuat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, tangent);

  return {
    center: [center.x, center.y, center.z] as [number, number, number],
    orient: [orient.x, orient.y, orient.z, orient.w] as [number, number, number, number],
    // Mirror in local Y to flip CCW → CW (keeps the arc in the face plane).
    scale: [1, ccw ? 1 : -1, 1] as [number, number, number],
    radius,
    headPos: [headPos.x, headPos.y, headPos.z] as [number, number, number],
    headQuat: [headQuat.x, headQuat.y, headQuat.z, headQuat.w] as [number, number, number, number],
  };
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

  const arrow = useMemo(() => (geom ? buildArrow(geom) : null), [geom]);

  const arrowGroup = useRef<THREE.Group | null>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!arrow || !arrowGroup.current) return;
    tRef.current += delta;
    // Gentle size pulse only — purely a motion cue, never a colour change.
    const s = 1 + 0.06 * (0.5 + 0.5 * Math.sin(tRef.current * 4.5));
    arrowGroup.current.scale.set(arrow.scale[0] * s, arrow.scale[1] * s, arrow.scale[2] * s);
  });

  if (!geom || !arrow) return null;

  return (
    <group position={arrow.center} quaternion={arrow.orient}>
      <group ref={arrowGroup} scale={arrow.scale}>
        <mesh>
          <torusGeometry args={[arrow.radius, 0.05, 10, 32, SWEEP]} />
          <meshBasicMaterial color={ARROW_COLOR} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh position={arrow.headPos} quaternion={arrow.headQuat}>
          <coneGeometry args={[0.15, 0.34, 16]} />
          <meshBasicMaterial color={ARROW_COLOR} depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

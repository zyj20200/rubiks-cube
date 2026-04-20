'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import Cubie from './Cubie';
import { useCubeStore } from '@/store/cube-store';
import { useDragRotation } from '@/hooks/useDragRotation';
import type { Piece } from '@/lib/cube';

const ROTATION_AXES: Record<string, { axis: THREE.Vector3; angle: number; filter: (p: Piece) => boolean }> = {
  R:  { axis: new THREE.Vector3(1, 0, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.x === 1 },
  Ri: { axis: new THREE.Vector3(1, 0, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.x === 1 },
  L:  { axis: new THREE.Vector3(1, 0, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.x === -1 },
  Li: { axis: new THREE.Vector3(1, 0, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.x === -1 },
  U:  { axis: new THREE.Vector3(0, 1, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.y === 1 },
  Ui: { axis: new THREE.Vector3(0, 1, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.y === 1 },
  D:  { axis: new THREE.Vector3(0, 1, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.y === -1 },
  Di: { axis: new THREE.Vector3(0, 1, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.y === -1 },
  F:  { axis: new THREE.Vector3(0, 0, 1),  angle: -Math.PI / 2, filter: (p) => p.pos.z === 1 },
  Fi: { axis: new THREE.Vector3(0, 0, 1),  angle: Math.PI / 2,  filter: (p) => p.pos.z === 1 },
  B:  { axis: new THREE.Vector3(0, 0, 1),  angle: Math.PI / 2,  filter: (p) => p.pos.z === -1 },
  Bi: { axis: new THREE.Vector3(0, 0, 1),  angle: -Math.PI / 2, filter: (p) => p.pos.z === -1 },
  M:  { axis: new THREE.Vector3(1, 0, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.x === 0 },
  Mi: { axis: new THREE.Vector3(1, 0, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.x === 0 },
  E:  { axis: new THREE.Vector3(0, 1, 0),  angle: Math.PI / 2,  filter: (p) => p.pos.y === 0 },
  Ei: { axis: new THREE.Vector3(0, 1, 0),  angle: -Math.PI / 2, filter: (p) => p.pos.y === 0 },
  S:  { axis: new THREE.Vector3(0, 0, 1),  angle: -Math.PI / 2, filter: (p) => p.pos.z === 0 },
  Si: { axis: new THREE.Vector3(0, 0, 1),  angle: Math.PI / 2,  filter: (p) => p.pos.z === 0 },
  X:  { axis: new THREE.Vector3(1, 0, 0),  angle: -Math.PI / 2, filter: () => true },
  Xi: { axis: new THREE.Vector3(1, 0, 0),  angle: Math.PI / 2,  filter: () => true },
  Y:  { axis: new THREE.Vector3(0, 1, 0),  angle: -Math.PI / 2, filter: () => true },
  Yi: { axis: new THREE.Vector3(0, 1, 0),  angle: Math.PI / 2,  filter: () => true },
  Z:  { axis: new THREE.Vector3(0, 0, 1),  angle: -Math.PI / 2, filter: () => true },
  Zi: { axis: new THREE.Vector3(0, 0, 1),  angle: Math.PI / 2,  filter: () => true },
};

function getPieceColors(piece: Piece) {
  return {
    px: piece.pos.x === 1 ? piece.colors[0] : null,
    nx: piece.pos.x === -1 ? piece.colors[0] : null,
    py: piece.pos.y === 1 ? piece.colors[1] : null,
    ny: piece.pos.y === -1 ? piece.colors[1] : null,
    pz: piece.pos.z === 1 ? piece.colors[2] : null,
    nz: piece.pos.z === -1 ? piece.colors[2] : null,
  };
}

export default function RubiksCube() {
  const cube = useCubeStore((s) => s.cube);
  const animationQueue = useCubeStore((s) => s.animationQueue);
  const animationSpeed = useCubeStore((s) => s.animationSpeed);
  const dequeueAnimation = useCubeStore((s) => s.dequeueAnimation);
  const finishAnimation = useCubeStore((s) => s.finishAnimation);
  const { onPointerDown } = useDragRotation();

  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const animStartTime = useRef(0);
  const processingRef = useRef(false);

  const startNextAnimation = useCallback(() => {
    if (processingRef.current) return;
    const move = dequeueAnimation();
    if (move) {
      processingRef.current = true;
      setCurrentMove(move);
      setAnimProgress(0);
      animStartTime.current = performance.now();
    } else {
      finishAnimation();
    }
  }, [dequeueAnimation, finishAnimation]);

  useEffect(() => {
    if (animationQueue.length > 0 && !currentMove) {
      startNextAnimation();
    }
  }, [animationQueue, currentMove, startNextAnimation]);

  useFrame(() => {
    if (!currentMove) return;

    const elapsed = performance.now() - animStartTime.current;
    const duration = animationSpeed;
    const progress = Math.min(elapsed / duration, 1);
    setAnimProgress(progress);

    if (progress >= 1) {
      setCurrentMove(null);
      processingRef.current = false;
      setRenderKey((k) => k + 1);
      setTimeout(startNextAnimation, 0);
    }
  });

  const pieces = cube.pieces;

  const rotatingIndices = new Set<number>();
  let animAxis: THREE.Vector3 | null = null;
  let animAngle = 0;

  if (currentMove && ROTATION_AXES[currentMove]) {
    const { axis, angle, filter } = ROTATION_AXES[currentMove];
    animAxis = axis;
    animAngle = angle * (easeInOut(animProgress) - 1);
    pieces.forEach((piece, idx) => {
      if (filter(piece)) rotatingIndices.add(idx);
    });
  }

  return (
    <group rotation={[Math.PI, 0, 0]}>
      <group key={renderKey} onPointerDown={onPointerDown}>
        {animAxis && (
          <group rotation={new THREE.Euler(
            animAxis.x * animAngle,
            animAxis.y * animAngle,
            animAxis.z * animAngle,
          )}>
            {pieces.filter((_, i) => rotatingIndices.has(i)).map((piece, i) => (
              <Cubie
                key={`anim-${i}`}
                position={[piece.pos.x, piece.pos.y, piece.pos.z]}
                colors={getPieceColors(piece)}
              />
            ))}
          </group>
        )}
        {pieces.filter((_, i) => !rotatingIndices.has(i)).map((piece, i) => (
          <Cubie
            key={`static-${i}`}
            position={[piece.pos.x, piece.pos.y, piece.pos.z]}
            colors={getPieceColors(piece)}
          />
        ))}
      </group>
    </group>
  );
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

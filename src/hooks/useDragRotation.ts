'use client';

import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useCubeStore } from '@/store/cube-store';

const GAP = 1.03;
const DRAG_THRESHOLD = 0.3;

const MOVE_MAP: Record<string, string> = {
  '0,1,-1': 'R', '0,1,1': 'Ri',
  '0,-1,-1': 'Li', '0,-1,1': 'L',
  '0,0,-1': 'Mi', '0,0,1': 'M',
  '1,1,-1': 'U', '1,1,1': 'Ui',
  '1,-1,-1': 'Di', '1,-1,1': 'D',
  '1,0,-1': 'Ei', '1,0,1': 'E',
  '2,1,-1': 'F', '2,1,1': 'Fi',
  '2,-1,-1': 'Bi', '2,-1,1': 'B',
  '2,0,-1': 'S', '2,0,1': 'Si',
};

function snapToAxis(v: THREE.Vector3): THREE.Vector3 {
  const abs = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
  const maxIdx = abs.indexOf(Math.max(...abs));
  const result = new THREE.Vector3();
  result.setComponent(maxIdx, Math.sign(v.getComponent(maxIdx)));
  return result;
}

interface DragState {
  faceNormal: THREE.Vector3;
  startPoint: THREE.Vector3;
  piecePos: [number, number, number];
  committed: boolean;
}

export function useDragRotation() {
  const { camera, gl, controls } = useThree();
  const executeMove = useCubeStore((s) => s.executeMove);
  const isAnimating = useCubeStore((s) => s.isAnimating);

  const dragState = useRef<DragState | null>(null);
  const plane = useRef(new THREE.Plane());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const getPlaneIntersection = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.current.setFromCamera(mouse.current, camera);
    const target = new THREE.Vector3();
    return raycaster.current.ray.intersectPlane(plane.current, target);
  }, [camera, gl]);

  const onPointerDown = useCallback((e: { face?: THREE.Face; point?: THREE.Vector3; object?: THREE.Object3D; stopPropagation: () => void }) => {
    if (isAnimating) return;
    if (!e.face || !e.point || !e.object) return;

    e.stopPropagation();

    const worldNormal = e.face.normal.clone()
      .transformDirection(e.object.matrixWorld)
      .normalize();
    const snappedNormal = snapToAxis(worldNormal);

    const worldPos = new THREE.Vector3();
    e.object.getWorldPosition(worldPos);
    const piecePos: [number, number, number] = [
      Math.round(worldPos.x / GAP),
      Math.round(worldPos.y / GAP),
      Math.round(worldPos.z / GAP),
    ];

    plane.current.setFromNormalAndCoplanarPoint(snappedNormal, e.point);

    dragState.current = {
      faceNormal: snappedNormal,
      startPoint: e.point.clone(),
      piecePos,
      committed: false,
    };

    if (controls) (controls as any).enabled = false;

    const onMove = (me: PointerEvent) => {
      if (!dragState.current || dragState.current.committed) return;

      const worldPoint = getPlaneIntersection(me.clientX, me.clientY);
      if (!worldPoint) return;

      const dragVec = worldPoint.clone().sub(dragState.current.startPoint);
      const normal = dragState.current.faceNormal;
      dragVec.sub(normal.clone().multiplyScalar(dragVec.dot(normal)));

      if (dragVec.length() < DRAG_THRESHOLD) return;

      const dragDir = snapToAxis(dragVec);
      const cross = new THREE.Vector3().crossVectors(dragDir, normal);

      let rotAxisIdx = -1;
      let angleSign = 0;
      for (let i = 0; i < 3; i++) {
        const c = Math.round(cross.getComponent(i));
        if (c !== 0) {
          rotAxisIdx = i;
          angleSign = -c;
          break;
        }
      }

      if (rotAxisIdx === -1) return;

      const layer = dragState.current.piecePos[rotAxisIdx];
      const move = MOVE_MAP[`${rotAxisIdx},${layer},${angleSign}`];

      if (move) {
        dragState.current.committed = true;
        executeMove(move);
      }
    };

    const onUp = () => {
      dragState.current = null;
      if (controls) (controls as any).enabled = true;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [isAnimating, controls, getPlaneIntersection, executeMove]);

  return { onPointerDown };
}

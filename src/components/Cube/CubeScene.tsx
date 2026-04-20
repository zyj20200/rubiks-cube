'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import RubiksCube from './RubiksCube';

export default function CubeScene() {
  return (
    <Canvas
      camera={{ position: [4, 3, 4], fov: 45 }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-3, -2, -3]} intensity={0.8} />
      <Suspense fallback={null}>
        <RubiksCube />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={12}
        dampingFactor={0.1}
        enableDamping
      />
    </Canvas>
  );
}

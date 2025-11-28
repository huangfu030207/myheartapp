import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleShape, HandGesture } from '../types';

interface ParticleSystemProps {
  shape: ParticleShape;
  gesture: HandGesture;
}

const COUNT = 3000;

// Math helpers
const randomSpherePoint = () => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = 10;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

const heartPoint = () => {
  const t = Math.random() * Math.PI * 2;
  const r = Math.random(); 
  // Heart formula
  let x = 16 * Math.pow(Math.sin(t), 3);
  let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  let z = (Math.random() - 0.5) * 5; // Thickness
  
  // Scale down
  const scale = 0.5;
  return new THREE.Vector3(x * scale, y * scale, z * scale);
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, gesture }) => {
  const points = useRef<THREE.Points>(null);
  
  // Generate target positions based on shape
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      let vec;
      if (shape === ParticleShape.HEART) {
        vec = heartPoint();
        color.setHSL(0.95 + Math.random() * 0.1, 1, 0.5); // Red/Pink
      } else {
        vec = randomSpherePoint();
        color.setHSL(Math.random(), 1, 0.5); // Rainbow fireworks
      }
      
      pos[i * 3] = vec.x;
      pos[i * 3 + 1] = vec.y;
      pos[i * 3 + 2] = vec.z;

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: col };
  }, [shape]);

  // Store original positions for lerping
  const originalPositions = useMemo(() => positions.slice(), [positions]);
  
  // Animation state
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  useFrame((state, delta) => {
    if (!points.current) return;

    // Gesture control logic
    if (gesture === HandGesture.OPEN) {
      targetScale.current = 2.5; // Expand
    } else {
      targetScale.current = 0.5; // Contract
    }

    // Smooth lerp for scale
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, delta * 5);

    const positionsArray = points.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Base position
      const ox = originalPositions[ix];
      const oy = originalPositions[iy];
      const oz = originalPositions[iz];

      // Add some noise/movement
      const time = state.clock.elapsedTime;
      const noise = Math.sin(time * 2 + i) * 0.2;

      // Apply scale
      positionsArray[ix] = ox * currentScale.current + noise;
      positionsArray[iy] = oy * currentScale.current + noise;
      positionsArray[iz] = oz * currentScale.current + noise;
    }

    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.rotation.y += delta * 0.1; // Slow rotation
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

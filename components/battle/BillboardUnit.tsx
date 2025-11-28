
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TextureErrorBoundary, FallbackUnit } from './Shared';
import { ASSETS } from '../../constants';

const SpriteComponent = ({ url }: { url: string }) => {
    const safeUrl = (url && url.length > 5) ? url : ASSETS.UNITS.PLAYER;
    const [textureUrl, setTextureUrl] = useState(safeUrl);
    
    const texture = useTexture(textureUrl, (txt) => {
        txt.magFilter = THREE.NearestFilter;
        txt.minFilter = THREE.NearestFilter;
        txt.colorSpace = THREE.SRGBColorSpace;
    });

    // Fallback logic if texture fails is handled by ErrorBoundary wrapping this,
    // but we can also use a useEffect to check validity if needed.

    return (
        <group position={[0, 1.15, 0]}>
             <mesh position={[0, 0, -0.01]} scale={[1.05, 1.05, 1]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial map={texture} transparent alphaTest={0.5} color="black" side={THREE.DoubleSide} />
            </mesh>
            <mesh>
                <planeGeometry args={[2, 2]} />
                <meshStandardMaterial map={texture} transparent alphaTest={0.5} color={'white'} side={THREE.DoubleSide} roughness={0.8} />
            </mesh>
        </group>
    )
}

export const BillboardUnit = React.memo(({ position, color, spriteUrl, isCurrentTurn, hp, maxHp, onUnitClick }: any) => {
  const safeMaxHp = maxHp || 1; 
  const hpPercent = Math.max(0, Math.min(1, hp / safeMaxHp));
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
      if (groupRef.current) {
          const phase = (position[0] + position[2]) * 0.5;
          const hover = Math.sin(state.clock.elapsedTime * 2 + phase) * 0.05;
          groupRef.current.position.y = position[1] + hover;
      }
  });

  const handleClick = (e: any) => {
      e.stopPropagation();
      onUnitClick(position[0], position[2]); 
  };

  return (
    <group ref={groupRef} position={position}>
        {isCurrentTurn && (
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.4, 0.45, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
        )}
        
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]} scale={[1.2, 0.8, 1]}>
            <circleGeometry args={[0.35, 16]} />
            <meshBasicMaterial color="black" transparent opacity={0.4} depthWrite={false} />
        </mesh>

        <Billboard follow={true} lockX={true} lockY={false} lockZ={true}>
            <group onClick={handleClick}>
                <TextureErrorBoundary fallback={<FallbackUnit color={color} />}>
                    <SpriteComponent url={spriteUrl} />
                </TextureErrorBoundary>
            </group>
        </Billboard>
        
        <group position={[0, 2.0, 0]}>
            <Billboard>
                <mesh position={[0, 0, -0.01]}><planeGeometry args={[1.05, 0.15]} /><meshBasicMaterial color="#0f172a" /></mesh>
                {hpPercent > 0 && (
                    <mesh position={[-0.5 + (1.0 * hpPercent) / 2, 0, 0]}>
                        <planeGeometry args={[1.0 * hpPercent, 0.1]} />
                        <meshBasicMaterial color={hpPercent > 0.5 ? "#22c55e" : "#ef4444"} toneMapped={false} />
                    </mesh>
                )}
            </Billboard>
        </group>
    </group>
  );
});

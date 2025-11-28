
import React, { useRef, useMemo, Suspense, useLayoutEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';
import { BATTLE_MAP_SIZE } from '../../constants'; // Check imports
import { TextureErrorBoundary } from './Shared';

// Fix circular import or missing type definition if needed
// Assuming BattleCell is in types, but generated in BattleSlice normally
import { BattleCell as BattleCellType } from '../../types';

const _tempObj = new THREE.Object3D();
const _tempColor = new THREE.Color();

const InstancedVoxelCluster = React.memo(({ data, textureUrl, isShadowRealm }: any) => {
    if (!textureUrl) return null;
    const texture = useTexture(textureUrl);
    useMemo(() => { if(texture) { texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.colorSpace = THREE.SRGBColorSpace; } }, [texture]);

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = data.length;

    useLayoutEffect(() => {
        if (!meshRef.current || count === 0) return;
        for (let i = 0; i < count; i++) {
            const block = data[i];
            const y = block.offsetY + block.height / 2;
            _tempObj.position.set(block.x, y, block.z);
            _tempObj.scale.set(1, block.height, 1);
            _tempObj.updateMatrix();
            meshRef.current.setMatrixAt(i, _tempObj.matrix);
            _tempColor.set(block.color);
            meshRef.current.setColorAt(i, _tempColor);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [data, count]);

    if (count === 0) return null;
    return ( <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow={!isShadowRealm} receiveShadow={!isShadowRealm} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial map={texture} color="white" roughness={0.7} metalness={0.1} emissive={isShadowRealm ? '#7c3aed' : 'black'} emissiveIntensity={isShadowRealm ? 0.2 : 0} /></instancedMesh> );
});

export const TerrainLayer = React.memo(({ mapData, isShadowRealm }: any) => {
    const grouped = useMemo(() => {
        const g: Record<string, BattleCellType[]> = {};
        if (!mapData) return g;
        mapData.forEach((b: BattleCellType) => { const k = b.textureUrl && b.textureUrl.length > 5 ? b.textureUrl : 'default'; if (k === 'default') return; if (!g[k]) g[k] = []; g[k].push(b); });
        return g;
    }, [mapData]);
    if (!mapData || mapData.length === 0) return null;
    const center = BATTLE_MAP_SIZE / 2; // BATTLE_MAP_SIZE imported from constants
    return (
        <group>
            {Object.entries(grouped).map(([url, blocks]) => ( <TextureErrorBoundary key={url} fallback={null}><Suspense fallback={null}><InstancedVoxelCluster textureUrl={url} data={blocks} isShadowRealm={isShadowRealm} /></Suspense></TextureErrorBoundary> ))}
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[center, -0.5, center]} receiveShadow={!isShadowRealm}><planeGeometry args={[100, 100]} /><meshStandardMaterial color={isShadowRealm ? "#1e1b4b" : "#0f172a"} roughness={1} /></mesh>
        </group>
    );
});

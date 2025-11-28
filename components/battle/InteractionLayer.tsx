
import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { BattleCell } from '../../types';
import { BATTLE_MAP_SIZE } from '../../constants';

const _tempObj = new THREE.Object3D();

const InstancedOverlay = React.memo(({ points, color, mapData, scale = 0.8 }: { points: PositionComponent[], color: string, mapData: BattleCell[], scale?: number }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = points ? points.length : 0;
    useLayoutEffect(() => {
        if (!meshRef.current || count === 0 || !mapData) return;
        for (let i = 0; i < count; i++) {
            const p = points[i];
            const cell = mapData.find((c: BattleCell) => c.x === p.x && c.z === p.y);
            const y = cell ? cell.offsetY + cell.height : 0.5; 
            _tempObj.position.set(p.x, y + 0.01, p.y);
            _tempObj.rotation.set(-Math.PI / 2, 0, 0);
            _tempObj.scale.set(scale, scale, 1); 
            _tempObj.updateMatrix();
            meshRef.current.setMatrixAt(i, _tempObj.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [points, mapData, count, scale]);
    if (count === 0) return null;
    return ( <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}><circleGeometry args={[0.4, 32]} /><meshBasicMaterial color={color} opacity={0.4} transparent depthWrite={false} side={THREE.DoubleSide} /></instancedMesh> );
});

export const InteractionLayer = ({ mapData, validMoves, validTargets, onTileClick, onTileHover }: any) => {
    if (!mapData || mapData.length === 0) return null;
    const center = BATTLE_MAP_SIZE / 2;
    const handlePointerMove = (e: any) => { e.stopPropagation(); const x = Math.round(e.point.x); const z = Math.round(e.point.z); if (x >= 0 && x < BATTLE_MAP_SIZE && z >= 0 && z < BATTLE_MAP_SIZE) onTileHover(x, z); };
    const handleClick = (e: any) => { e.stopPropagation(); const x = Math.round(e.point.x); const z = Math.round(e.point.z); if (x >= 0 && x < BATTLE_MAP_SIZE && z >= 0 && z < BATTLE_MAP_SIZE) onTileClick(x, z); };
    return (
        <group>
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center - 0.5, 0.5, center - 0.5]} visible={false} onPointerMove={handlePointerMove} onClick={handleClick}><planeGeometry args={[BATTLE_MAP_SIZE, BATTLE_MAP_SIZE]} /><meshBasicMaterial /></mesh>
             <InstancedOverlay points={validMoves} color="#3b82f6" mapData={mapData} scale={0.9} />
             <InstancedOverlay points={validTargets} color="#ef4444" mapData={mapData} scale={0.9} />
             {useGameStore.getState().selectedTile && (() => { const t = useGameStore.getState().selectedTile; if(!t) return null; const cell = mapData.find((c: BattleCell) => c.x === t.x && c.z === t.z); const y = cell ? cell.offsetY + cell.height : 0.5; return ( <mesh position={[t.x, y + 0.02, t.z]} rotation={[-Math.PI/2, 0, 0]}><ringGeometry args={[0.35, 0.45, 32]} /><meshBasicMaterial color="white" opacity={0.8} transparent side={THREE.DoubleSide} /></mesh> ) })()}
        </group>
    )
};

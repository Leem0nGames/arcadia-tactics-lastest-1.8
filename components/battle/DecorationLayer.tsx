
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useTexture } from '@react-three/drei';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { BATTLE_MAP_SIZE, ASSETS } from '../../constants';
import { TerrainType, BattleCell } from '../../types';

// Optimized Pseudo-Random for deterministic placement
const pseudoRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

// Render a single type of decoration in batch
const InstancedDecoration = React.memo(({ type, positions, scaleRange = [0.8, 1.2] }: { type: string, positions: THREE.Vector3[], scaleRange?: [number, number] }) => {
    if (!type || positions.length === 0) return null;
    
    const texture = useTexture(type);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useMemo(() => {
        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture]);

    useLayoutEffect(() => {
        if (!meshRef.current || positions.length === 0) return;

        positions.forEach((pos, i) => {
            dummy.position.copy(pos);
            
            // Scale variation
            const s = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
            dummy.scale.set(s, s, s);
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [positions, scaleRange]);

    // Cross-plane geometry for 2.5D look
    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial map={texture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
            </instancedMesh>
             {/* Second plane for cross effect (X shape) */}
            <instancedMesh args={[undefined, undefined, positions.length]} 
                           instanceMatrix={meshRef.current?.instanceMatrix} 
                           rotation={[0, Math.PI/2, 0]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial map={texture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
});

export const DecorationLayer = React.memo(({ mapData }: { mapData: BattleCell[] }) => {
    const decorationGroups = useMemo(() => {
        const groups: Record<string, THREE.Vector3[]> = {
            GRASS: [],
            FLOWER: [],
            ROCK: [],
            MUSHROOM: []
        };

        mapData.forEach(cell => {
            // Simple hash for determinism
            const rng = pseudoRandom(cell.x * 73856093 ^ cell.z * 19349663);
            const y = cell.offsetY + cell.height;

            // Don't decorate obstacles or water directly (unless lilypads later)
            if (cell.textureUrl.includes('water') || cell.textureUrl.includes('lava')) return;

            // Grass on GRASS, FOREST, PLAINS
            if (cell.textureUrl.includes('grass')) {
                // 40% chance of detail
                if (rng() > 0.6) {
                    const type = rng() > 0.9 ? 'FLOWER' : 'GRASS';
                    const ox = (rng() - 0.5) * 0.6;
                    const oz = (rng() - 0.5) * 0.6;
                    groups[type].push(new THREE.Vector3(cell.x + ox, y + 0.4, cell.z + oz));
                }
            }
            
            // Rocks on MOUNTAIN, CAVE
            if (cell.textureUrl.includes('stone') || cell.textureUrl.includes('cobble')) {
                 if (rng() > 0.9) {
                     groups.ROCK.push(new THREE.Vector3(cell.x, y + 0.4, cell.z));
                 }
            }

            // Mushrooms on FUNGUS, SWAMP
            if (cell.textureUrl.includes('mycelium') || cell.textureUrl.includes('podzol')) {
                if (rng() > 0.8) {
                    groups.MUSHROOM.push(new THREE.Vector3(cell.x, y + 0.4, cell.z));
                }
            }
        });

        return groups;
    }, [mapData]);

    return (
        <group>
            <InstancedDecoration type={ASSETS.DECORATIONS.GRASS_1} positions={decorationGroups.GRASS} />
            <InstancedDecoration type={ASSETS.DECORATIONS.FLOWER_1} positions={decorationGroups.FLOWER} />
            <InstancedDecoration type={ASSETS.DECORATIONS.ROCK_1} positions={decorationGroups.ROCK} />
            <InstancedDecoration type={ASSETS.DECORATIONS.MUSHROOM} positions={decorationGroups.MUSHROOM} />
        </group>
    );
});

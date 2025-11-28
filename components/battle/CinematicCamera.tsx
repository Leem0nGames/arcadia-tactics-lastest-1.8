
import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { BATTLE_MAP_SIZE } from '../../constants';

const _targetLookAt = new THREE.Vector3();

export const CinematicCamera = () => {
    const { isActionAnimating, battleEntities, turnOrder, currentTurnIndex, selectedTile, selectedAction } = useGameStore();
    const { camera, controls } = useThree();
    const center = BATTLE_MAP_SIZE / 2;

    useFrame((state, delta) => {
        if (!controls) return;
        const orbit = controls as any; 

        const activeId = turnOrder[currentTurnIndex];
        const activeEntity = battleEntities.find(e => e.id === activeId);
        
        let idealLookAtX = center;
        let idealLookAtZ = center;

        if (activeEntity) {
            idealLookAtX = activeEntity.position.x;
            idealLookAtZ = activeEntity.position.y; 

            if (isActionAnimating) {
                // Focus logic
            } else if (selectedTile && selectedAction) {
                idealLookAtX = (activeEntity.position.x + selectedTile.x) / 2;
                idealLookAtZ = (activeEntity.position.y + selectedTile.z) / 2;
            }
        }

        const dampFactor = 4.0; 
        _targetLookAt.set(idealLookAtX, 1.0, idealLookAtZ); 
        
        orbit.target.lerp(_targetLookAt, delta * dampFactor);

        let distance = 25; 
        let height = 20;

        if (isActionAnimating) {
            distance = 12; 
            height = 8;   
        } else if (selectedTile) {
            distance = 22; 
        }

        const currentPos = camera.position.clone();
        const offset = currentPos.sub(orbit.target); 
        
        const currentDist = offset.length();
        const idealDist = Math.sqrt(distance * distance + height * height);
        
        const newDist = THREE.MathUtils.lerp(currentDist, idealDist, delta * 2.0);
        
        offset.setLength(newDist);
        
        const newCamPos = new THREE.Vector3().copy(orbit.target).add(offset);
        
        camera.position.lerp(newCamPos, delta * 3.0);

        const targetFov = isActionAnimating ? 28 : 35;
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 2.0);
        camera.updateProjectionMatrix();

        orbit.update();
    });

    return null;
};

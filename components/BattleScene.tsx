
import React, { Suspense } from 'react';
import { Canvas, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Html, SpotLight } from '@react-three/drei';
import { Entity, Dimension, WeatherType } from '../types';
import { useGameStore } from '../store/gameStore';
import { WeatherOverlay } from './OverworldMap';
import { BATTLE_MAP_SIZE } from '../constants';

// Modular Components
import { FogController } from './battle/FogController';
import { CinematicCamera } from './battle/CinematicCamera';
import { VoidParticles } from './battle/VoidParticles';
import { TerrainLayer } from './battle/TerrainLayer';
import { DecorationLayer } from './battle/DecorationLayer';
import { InteractionLayer } from './battle/InteractionLayer';
import { BillboardUnit } from './battle/BillboardUnit';
import { SpellEffectsRenderer } from './battle/SpellEffectsRenderer';
import { LootDropVisual } from './battle/LootDropVisual';

export const BattleScene = ({ entities, weather, currentTurnEntityId, onTileClick, validMoves, validTargets }: any) => {
    const { battleMap, damagePopups, handleTileHover, dimension, hasActed, hasMoved, activeSpellEffect, lootDrops } = useGameStore();
    const isShadowRealm = dimension === Dimension.UPSIDE_DOWN;
    const activeEntity = entities.find((e: Entity) => e.id === currentTurnEntityId);
    const center = BATTLE_MAP_SIZE / 2;

    return (
        <div className="w-full h-full bg-slate-950 relative overflow-hidden">
            <WeatherOverlay type={weather} />
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]" />
            <div className="absolute top-0 left-0 right-0 h-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />

            <Canvas shadows dpr={[1, 1.5]} camera={{ position: [center, 25, center + 45], fov: 35, near: 0.1, far: 1000 }}>
                <FogController isShadowRealm={isShadowRealm} />
                <CinematicCamera />
                
                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    maxDistance={200} 
                    minDistance={10} 
                    target={[center, 1.0, center]} 
                    minAzimuthAngle={-Math.PI / 3} 
                    maxAzimuthAngle={Math.PI / 3} 
                    maxPolarAngle={Math.PI / 2.1} 
                    minPolarAngle={0.1} 
                />
                
                <hemisphereLight color={isShadowRealm ? "#4c1d95" : "#ffffff"} groundColor={isShadowRealm ? "#000000" : "#1e293b"} intensity={isShadowRealm ? 0.3 : 0.6} />
                <ambientLight intensity={isShadowRealm ? 0.2 : 0.5} color={isShadowRealm ? "#2e1065" : "#ffffff"} />
                <directionalLight position={[10, 20, 5]} intensity={isShadowRealm ? 0.5 : 1.5} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.04} />

                {activeEntity && (
                    <SpotLight position={[activeEntity.position.x, 12, activeEntity.position.y]} target-position={[activeEntity.position.x, 0, activeEntity.position.y]} intensity={isShadowRealm ? 5 : 4} angle={0.6} penumbra={0.5} castShadow color={isShadowRealm ? "#a855f7" : "#ffedd5"} distance={30} attenuation={10} anglePower={5} />
                )}
                
                <TerrainLayer mapData={battleMap} isShadowRealm={isShadowRealm} />
                
                <Suspense fallback={null}>
                     <DecorationLayer mapData={battleMap} />
                </Suspense>
                
                <InteractionLayer mapData={battleMap} validMoves={validMoves} validTargets={validTargets} onTileClick={onTileClick} onTileHover={handleTileHover} />
                
                <Suspense fallback={null}>
                     <SpellEffectsRenderer activeSpellEffect={activeSpellEffect} />
                </Suspense>

                {lootDrops && lootDrops.map(drop => (
                    <LootDropVisual key={drop.id} drop={drop} />
                ))}

                {entities.map((ent: any) => {
                    const isTurn = ent.id === currentTurnEntityId;
                    const isActivePlayer = isTurn && ent.type === 'PLAYER';
                    return (
                        <BillboardUnit 
                            key={ent.id} 
                            position={[ent.position.x, 0.5, ent.position.y]} 
                            color={ent.visual.color} 
                            spriteUrl={ent.visual.spriteUrl} 
                            isCurrentTurn={isTurn} 
                            isActivePlayer={isActivePlayer}
                            hp={ent.stats.hp} 
                            maxHp={ent.stats.maxHp}
                            onUnitClick={onTileClick}
                            hasActed={hasActed}
                            hasMoved={hasMoved}
                        />
                    );
                })}

                {damagePopups.map((p: any) => (
                    <Html key={p.id} position={[p.position[0], p.position[2] + 2, p.position[1]]} center zIndexRange={[100, 0]}>
                        <div className={`font-serif font-bold text-2xl drop-shadow-md ${p.isCrit ? 'text-amber-300 text-3xl' : 'text-white'}`} style={{ textShadow: '0 0 4px black' }}>{p.amount}</div>
                    </Html>
                ))}
                
                {(isShadowRealm || weather === WeatherType.ASH) && <VoidParticles color={isShadowRealm ? "#d8b4fe" : "#57534e"} floatUp={isShadowRealm} />}
            </Canvas>
        </div>
    );
};

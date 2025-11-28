
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, QuadraticBezierLine, useTexture, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { SpellEffectData } from '../../types';
import { ASSETS } from '../../constants';

const AnimatedSprite = ({ frames, duration, opacity = 1, color = 'white' }: { frames: string[], duration: number, opacity?: number, color?: string }) => {
    const textures = useTexture(frames);
    const meshRef = useRef<THREE.Mesh>(null);

    useMemo(() => {
        // @ts-ignore
        if (Array.isArray(textures)) {
             textures.forEach(t => {
                t.magFilter = THREE.NearestFilter;
                t.minFilter = THREE.NearestFilter;
                t.colorSpace = THREE.SRGBColorSpace;
             });
        }
    }, [textures]);

    useFrame((state) => {
        if (meshRef.current && Array.isArray(textures)) {
             const timePerFrame = (duration / 1000) / frames.length;
             const idx = Math.floor((state.clock.elapsedTime / timePerFrame) % frames.length);
             if (textures[idx]) {
                 (meshRef.current.material as THREE.MeshBasicMaterial).map = textures[idx];
                 (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
             }
        }
    });

    return (
        <Billboard follow={true}>
            <mesh ref={meshRef}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial 
                    // @ts-ignore
                    map={textures[0]} 
                    transparent 
                    opacity={opacity} 
                    color={color} 
                    depthWrite={false} 
                    blending={THREE.AdditiveBlending} 
                />
            </mesh>
        </Billboard>
    );
};

const HaloEffect = ({ url, color }: { url: string, color: string }) => {
    const texture = useTexture(url);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z -= 0.05; 
            const scale = 1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
            meshRef.current.scale.set(scale, scale, 1);
        }
    });

    return (
        <Billboard follow={true}>
            <mesh ref={meshRef}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial map={texture} transparent opacity={0.8} color={color} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </Billboard>
    );
};

export const SpellEffectsRenderer = React.memo(({ activeSpellEffect }: { activeSpellEffect: SpellEffectData | null }) => {
    const meshRef = useRef<THREE.Group>(null);
    const progressRef = useRef(0);
    const projectileUrl = activeSpellEffect?.projectileSprite || null;
    const projectileTexture = projectileUrl ? useTexture(projectileUrl) : null;
    
    useMemo(() => {
        if(projectileTexture) {
            projectileTexture.magFilter = THREE.NearestFilter;
            projectileTexture.minFilter = THREE.NearestFilter;
            projectileTexture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [projectileTexture]);

    useFrame((state, delta) => {
        if (!activeSpellEffect || !meshRef.current) {
            progressRef.current = 0;
            return;
        }

        const speed = 1.0 / (activeSpellEffect.duration / 1000); 
        progressRef.current = Math.min(1, progressRef.current + delta * speed);

        const start = new THREE.Vector3(...activeSpellEffect.startPos);
        const end = new THREE.Vector3(...activeSpellEffect.endPos);

        if (activeSpellEffect.type === 'PROJECTILE') {
            meshRef.current.position.lerpVectors(start, end, progressRef.current);
            meshRef.current.position.y += Math.sin(progressRef.current * Math.PI) * 2;
            meshRef.current.lookAt(end);
        } else if (activeSpellEffect.type === 'BURST') {
            meshRef.current.position.copy(end);
        }
    });

    if (!activeSpellEffect) return null;
    const animationFrames = activeSpellEffect.animationKey ? ASSETS.ANIMATIONS[activeSpellEffect.animationKey] : null;

    return (
        <group>
            {activeSpellEffect.type === 'PROJECTILE' && (
                <group ref={meshRef} position={activeSpellEffect.startPos}>
                     {projectileTexture ? (
                         <group rotation={[0, 0, Math.PI / 2]}>
                            <Billboard follow={true}>
                                <mesh>
                                    <planeGeometry args={[1, 1]} />
                                    <meshBasicMaterial map={projectileTexture} transparent />
                                </mesh>
                            </Billboard>
                         </group>
                     ) : (
                        <mesh>
                            <sphereGeometry args={[0.3, 16, 16]} />
                            <meshStandardMaterial color={activeSpellEffect.color} emissive={activeSpellEffect.color} emissiveIntensity={2} />
                        </mesh>
                     )}
                    
                    <Trail width={0.4} length={4} color={new THREE.Color(activeSpellEffect.color)} attenuation={(t) => t * t}>
                        <mesh visible={false}><sphereGeometry args={[0.1]} /><meshBasicMaterial /></mesh>
                    </Trail>
                    <pointLight color={activeSpellEffect.color} intensity={2} distance={5} />
                    {activeSpellEffect.textureUrl && (
                         <HaloEffect url={activeSpellEffect.textureUrl} color={activeSpellEffect.color} />
                    )}
                </group>
            )}

            {activeSpellEffect.type === 'BEAM' && (
                <QuadraticBezierLine
                    start={activeSpellEffect.startPos}
                    end={activeSpellEffect.endPos}
                    mid={[
                        (activeSpellEffect.startPos[0] + activeSpellEffect.endPos[0]) / 2,
                        4, 
                        (activeSpellEffect.startPos[2] + activeSpellEffect.endPos[2]) / 2
                    ]}
                    color={activeSpellEffect.color}
                    lineWidth={3}
                    dashed={false}
                />
            )}

            {/* Thunderwave / Area Burst Effect */}
            {activeSpellEffect.variant === 'BURST' && !animationFrames && (
                 <group position={activeSpellEffect.endPos}>
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[progressRef.current * 1, progressRef.current * 3, 32]} />
                        <meshBasicMaterial color={activeSpellEffect.color} transparent opacity={1 - progressRef.current} side={THREE.DoubleSide} />
                    </mesh>
                    <Sparkles count={30} scale={4} size={4} speed={0.4} opacity={1 - progressRef.current} color={activeSpellEffect.color} />
                 </group>
            )}

            {/* Generic Burst or Cure Wounds */}
            {(activeSpellEffect.type === 'BURST' || progressRef.current > 0.8) && (
                <group position={activeSpellEffect.endPos}>
                    {animationFrames ? (
                        <group position={[0, 0.5, 0]}>
                            <AnimatedSprite frames={animationFrames} duration={activeSpellEffect.duration} color={activeSpellEffect.color} />
                        </group>
                    ) : (
                        <Sparkles count={20} scale={3} size={4} speed={0.4} opacity={1 - progressRef.current} color={activeSpellEffect.color} />
                    )}
                    {activeSpellEffect.textureUrl && !animationFrames && (
                         <group position={[0, 0.5, 0]}>
                             <HaloEffect url={activeSpellEffect.textureUrl} color={activeSpellEffect.color} />
                         </group>
                    )}
                </group>
            )}
        </group>
    );
});

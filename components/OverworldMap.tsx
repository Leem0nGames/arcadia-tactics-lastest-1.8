
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { HexCell, TerrainType, PositionComponent, WeatherType, Dimension, GameState } from '../types';
import { HEX_SIZE, TERRAIN_COLORS, ASSETS, TERRAIN_PRIORITY, getWesnothTransition, TRANSITION_COMBINATIONS, DIRECTION_ORDER } from '../constants';
import { useGameStore } from '../store/gameStore';
import { findPath } from '../services/pathfinding';
import { WorldGenerator } from '../services/WorldGenerator';

interface OverworldMapProps {
  mapData: HexCell[]; // Deprecated, only used for Town now. Overworld uses Generator.
  playerPos: PositionComponent;
  onMove: (q: number, r: number) => void;
  dimension: Dimension;
  width: number;  // Screen/Logical width props, not world width
  height: number;
}

// --- CONFIGURATION ---
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const HORIZ_DIST = HEX_SIZE * 1.5;
const VERT_DIST = HEX_HEIGHT;
const OVERLAY_OFFSET_Y = 0;

// Coordinate Conversion
const hexToPixel = (q: number, r: number) => ({ x: q * HORIZ_DIST, y: (r + q / 2) * VERT_DIST });

const pixelToAxial = (x: number, y: number) => {
  const q = (2 / 3 * x) / HEX_SIZE;
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEX_SIZE;
  return axialRound(q, r);
};

const axialRound = (q: number, r: number) => {
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(-q - r);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - (-q - r));

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
};

const buildKey = (q: number, r: number) => `${q},${r}`;

// Neighbor offsets
const NEIGHBOR_OFFSETS = [
  { dq: 1, dr: 0, dir: 'se' },
  { dq: 0, dr: 1, dir: 's' },
  { dq: -1, dr: 1, dir: 'sw' },
  { dq: -1, dr: 0, dir: 'nw' },
  { dq: 0, dr: -1, dir: 'n' },
  { dq: 1, dr: -1, dir: 'ne' }
];

// Hex Polygon Path
const HEX_POINTS = (() => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i;
    const angle_rad = (Math.PI / 180) * angle_deg;
    points.push(`${HEX_SIZE * Math.cos(angle_rad)},${HEX_SIZE * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
})();

export const WeatherOverlay = ({ type }: { type: WeatherType }) => {
    if (type === WeatherType.NONE) return null;
    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {type === WeatherType.RAIN && (
                <div className="w-full h-full opacity-40" 
                     style={{ backgroundImage: `url(${ASSETS.WEATHER.RAIN})`, backgroundSize: '200px 200px', animation: 'fall 0.8s linear infinite' }} />
            )}
            {type === WeatherType.SNOW && (
                <div className="w-full h-full bg-white/20 opacity-30" 
                     style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '40px 40px', animation: 'fall 4s linear infinite' }} />
            )}
            {type === WeatherType.FOG && (
                <div className="w-full h-full bg-slate-300/20 mix-blend-overlay opacity-50 animate-pulse" 
                     style={{ backdropFilter: 'blur(2px)' }} />
            )}
             {type === WeatherType.ASH && (
                <div className="w-full h-full opacity-50" 
                     style={{ backgroundImage: 'radial-gradient(circle, #d8b4fe 1px, transparent 1px), radial-gradient(circle, #581c87 1.5px, transparent 1.5px)', backgroundSize: '120px 120px', animation: 'ashFloat 12s linear infinite' }} />
            )}
            <style>{`
                @keyframes fall { from { background-position: 0 0; } to { background-position: 50px 200px; } }
                @keyframes ashFloat { 0% { background-position: 0 0; opacity: 0.4; } 50% { background-position: 20px -50px; opacity: 0.6; } 100% { background-position: 40px -100px; opacity: 0.4; } }
            `}</style>
        </div>
    );
};

export const OverworldMap: React.FC<OverworldMapProps> = ({ mapData: townMapData, playerPos, onMove, dimension, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  const tileCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const transitionCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  
  const [viewport, setViewport] = useState({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
  const pan = useRef({ x: 0, y: 0 });
  const targetPan = useRef({ x: 0, y: 0 }); // Target for smooth camera
  
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const needsRedraw = useRef(true);

  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<HexCell[]>([]);
  
  // State from Store
  const { exploredTiles, gameState, activeOverworldEnemies, gracePeriodEndTime } = useGameStore();
  const isUpsideDown = dimension === Dimension.UPSIDE_DOWN;
  const isTown = gameState === GameState.TOWN_EXPLORATION;
  const [now, setNow] = useState(Date.now());

  // Update time for grace period check
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 500);
      return () => clearInterval(interval);
  }, []);

  const isGracePeriod = now < gracePeriodEndTime;

  // --- CHUNK / VIEWPORT CALCULATION ---
  const visibleCells = useMemo(() => {
      if (isTown && townMapData) return townMapData;

      const cells: HexCell[] = [];
      const { x: cx, y: cy } = pan.current;
      const { w, h } = viewport;
      
      const margin = 2; 
      const tl = pixelToAxial(cx - w/2 - 100, cy - h/2 - 100);
      const br = pixelToAxial(cx + w/2 + 100, cy + h/2 + 100);
      
      const minQ = Math.min(tl.q, br.q) - margin;
      const maxQ = Math.max(tl.q, br.q) + margin;
      const minR = Math.min(tl.r, br.r) - margin;
      const maxR = Math.max(tl.r, br.r) + margin;

      const explored = exploredTiles[dimension];
      if (!explored) return [];

      for (let q = minQ; q <= maxQ; q++) {
          for (let r = minR; r <= maxR; r++) {
              // Only get tile if explored to save performance
              const key = `${q},${r}`;
              if (explored.has(key)) {
                  const cell = WorldGenerator.getTile(q, r, dimension);
                  cell.isExplored = true;
                  const dist = (Math.abs(q - playerPos.x) + Math.abs(q + r - playerPos.x - playerPos.y) + Math.abs(r - playerPos.y)) / 2;
                  cell.isVisible = dist <= (dimension === Dimension.UPSIDE_DOWN ? 1.5 : 2);
                  cells.push(cell);
              }
          }
      }
      return cells;
  }, [pan.current.x, pan.current.y, viewport, isTown, townMapData, playerPos, dimension, exploredTiles]);

  // Filter enemies visible in current view
  const visibleEnemies = useMemo(() => {
      if (isTown) return [];
      return activeOverworldEnemies.filter(e => e.dimension === dimension);
  }, [activeOverworldEnemies, dimension, isTown]);

  const currentPlayerCell = useMemo(() => {
      if (isTown) return { weather: WeatherType.NONE };
      return WorldGenerator.getTile(playerPos.x, playerPos.y, dimension);
  }, [playerPos, dimension, isTown]);

  const currentWeather = currentPlayerCell.weather;

  // --- PATHFINDING PREVIEW ---
  useEffect(() => {
      if (!hoveredCellKey || isDragging.current) {
          setPreviewPath([]);
          return;
      }
      const [q, r] = hoveredCellKey.split(',').map(Number);
      if (q === playerPos.x && r === playerPos.y) {
          setPreviewPath([]);
          return;
      }

      let path;
      if (isTown && townMapData) {
          path = findPath({q: playerPos.x, r: playerPos.y}, {q, r}, townMapData);
      } else {
          path = findPath({q: playerPos.x, r: playerPos.y}, {q, r}, undefined, (tq, tr) => WorldGenerator.getTile(tq, tr, dimension));
      }
      setPreviewPath(path || []);
  }, [hoveredCellKey, playerPos, dimension, isTown, townMapData]);

  // --- CAMERA & RESIZE ---
  useEffect(() => {
    // Initial Center
    const center = hexToPixel(playerPos.x, playerPos.y);
    pan.current = { x: center.x, y: center.y };
    targetPan.current = { x: center.x, y: center.y };
    updateViewport();
    needsRedraw.current = true;
  }, []); // Run ONCE on mount to set initial position

  // Update Target when Player Moves
  useEffect(() => {
    const center = hexToPixel(playerPos.x, playerPos.y);
    targetPan.current = { x: center.x, y: center.y };
    
    // Snap if far (Teleport / Initial Load correction)
    const dist = Math.abs(targetPan.current.x - pan.current.x) + Math.abs(targetPan.current.y - pan.current.y);
    if (dist > 1000) {
        pan.current = { ...targetPan.current };
    }
    
    needsRedraw.current = true;
  }, [playerPos.x, playerPos.y]);

  useEffect(() => {
    const handleResize = () => { updateViewport(); needsRedraw.current = true; };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateViewport = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setViewport({ x: pan.current.x - clientWidth / 2, y: pan.current.y - clientHeight / 2, w: clientWidth, h: clientHeight });
      }
  };

  // --- ASSET LOADING ---
  const loadImage = useCallback((src: string): Promise<HTMLImageElement | null> => {
    if (!src) return Promise.resolve(null);
    if (imgCache.current.has(src)) return Promise.resolve(imgCache.current.get(src)!);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imgCache.current.set(src, img); resolve(img); };
      img.onerror = () => { resolve(null); }; // Resolve null on error so we can handle fallback
      img.src = src;
    });
  }, []);

  const prebuildTerrainTile = useCallback(async (terrain: TerrainType) => {
    const key = `base-${terrain}`;
    if (tileCache.current.has(key)) return;
    const size = Math.ceil(HEX_SIZE * 2.2);
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const src = ASSETS.TERRAIN[terrain];
    
    let loaded = false;
    if (src) {
        const img = await loadImage(src);
        if (img) {
            ctx.drawImage(img, 0, 0, size, size);
            loaded = true;
        }
    }
    
    // Fallback if image missing or failed to load
    if (!loaded) {
        ctx.fillStyle = TERRAIN_COLORS[terrain] || '#ff00ff';
        ctx.beginPath();
        // Draw slightly smaller to imply hex shape if possible, but circle is fine for fallback
        ctx.arc(size / 2, size / 2, HEX_SIZE * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }
    
    tileCache.current.set(key, canvas);
  }, [loadImage]);

  const prebuildTransition = useCallback(async (terrain: TerrainType, combo: string) => {
      const key = `trans-${terrain}-${combo}`;
      if (transitionCache.current.has(key)) return;
      const url = getWesnothTransition(terrain, combo);
      if (!url) return;
      const img = await loadImage(url);
      if (!img) return; // If transition fails, just skip it (don't draw fallback block)
      const size = Math.ceil(HEX_SIZE * 2.2);
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      transitionCache.current.set(key, canvas);
  }, [loadImage]);

  // Preload assets for visible tiles
  useEffect(() => {
    const loadVisible = async () => {
        const terrains = new Set<TerrainType>();
        visibleCells.forEach(c => {
            terrains.add(c.terrain);
            const overlayDef = ASSETS.OVERLAYS[c.terrain];
            if (overlayDef) (Array.isArray(overlayDef) ? overlayDef : [overlayDef]).forEach(url => loadImage(url));
        });
        await Promise.all(Array.from(terrains).map(t => prebuildTerrainTile(t)));
        
        // Transitions logic
        const transPromises: Promise<any>[] = [];
        for (const cell of visibleCells) {
            if (!cell.isExplored) continue;
            const priorityNeighbors: Record<string, string[]> = {};
            NEIGHBOR_OFFSETS.forEach(offset => {
                let neighborTerrain;
                if (isTown && townMapData) {
                    const n = townMapData.find(tc => tc.q === cell.q + offset.dq && tc.r === cell.r + offset.dr);
                    neighborTerrain = n?.terrain;
                } else {
                    neighborTerrain = WorldGenerator.getTile(cell.q + offset.dq, cell.r + offset.dr, dimension).terrain;
                }

                if (neighborTerrain && TERRAIN_PRIORITY[neighborTerrain] > TERRAIN_PRIORITY[cell.terrain]) {
                     if (!priorityNeighbors[neighborTerrain]) priorityNeighbors[neighborTerrain] = [];
                     priorityNeighbors[neighborTerrain].push(offset.dir);
                }
            });

            for (const [tStr, dirs] of Object.entries(priorityNeighbors)) {
                const terrain = tStr as TerrainType;
                let activeDirs = [...dirs].sort((a, b) => DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b));
                TRANSITION_COMBINATIONS.forEach(combo => {
                    if (activeDirs.length === 0) return;
                    const parts = combo.split('-');
                    if (parts.every(p => activeDirs.includes(p))) {
                        transPromises.push(prebuildTransition(terrain, combo));
                        activeDirs = activeDirs.filter(d => !parts.includes(d));
                    }
                });
            }
        }
        await Promise.all(transPromises);
        needsRedraw.current = true;
    };
    loadVisible();
  }, [visibleCells, dimension, prebuildTerrainTile, prebuildTransition, loadImage, isTown]);


  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    let animationFrameId = 0;

    const render = () => {
        // --- CAMERA SMOOTHING ---
        // Interpolate current pan towards target pan
        const lerp = 0.1;
        const diffX = targetPan.current.x - pan.current.x;
        const diffY = targetPan.current.y - pan.current.y;
        
        if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
            pan.current.x += diffX * lerp;
            pan.current.y += diffY * lerp;
            needsRedraw.current = true;
            
            // Manually update SVG ViewBox for smooth syncing
            if (svgRef.current) {
                const vbX = pan.current.x - viewport.w / 2;
                const vbY = pan.current.y - viewport.h / 2;
                svgRef.current.setAttribute('viewBox', `${vbX} ${vbY} ${viewport.w} ${viewport.h}`);
            }
        }

        if (!needsRedraw.current) { animationFrameId = requestAnimationFrame(render); return; }
        needsRedraw.current = false;

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== viewport.w * dpr || canvas.height !== viewport.h * dpr) {
            canvas.width = viewport.w * dpr; canvas.height = viewport.h * dpr;
            canvas.style.width = `${viewport.w}px`; canvas.style.height = `${viewport.h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // Clear Background
        ctx.fillStyle = isUpsideDown ? '#0a0010' : '#020617';
        ctx.fillRect(0, 0, viewport.w, viewport.h);

        const offsetX = (pan.current.x - viewport.w / 2);
        const offsetY = (pan.current.y - viewport.h / 2);
        
        const imgSize = Math.ceil(HEX_SIZE * 2.2);
        const halfSize = imgSize / 2;

        visibleCells.forEach(cell => {
            const { x, y } = hexToPixel(cell.q, cell.r);
            const screenX = x - offsetX;
            const screenY = y - offsetY;

            if (screenX < -imgSize || screenX > viewport.w + imgSize || screenY < -imgSize || screenY > viewport.h + imgSize) return;

            ctx.save();
            ctx.translate(screenX, screenY);

            if (cell.isExplored) {
                // 1. Base (Fallback handled in prebuild)
                const baseCanvas = tileCache.current.get(`base-${cell.terrain}`);
                if (baseCanvas) { 
                    ctx.drawImage(baseCanvas, -halfSize, -halfSize); 
                } else {
                    // Ultimate backup if cache missed entirely
                    ctx.fillStyle = TERRAIN_COLORS[cell.terrain] || '#ff00ff'; 
                    ctx.beginPath(); 
                    ctx.arc(0,0,HEX_SIZE,0,Math.PI*2); 
                    ctx.fill(); 
                }

                // 2. Transitions
                const priorityNeighbors: Record<string, string[]> = {};
                NEIGHBOR_OFFSETS.forEach(offset => {
                    let neighborTerrain;
                    if (isTown && townMapData) {
                        const n = townMapData.find(tc => tc.q === cell.q + offset.dq && tc.r === cell.r + offset.dr);
                        neighborTerrain = n?.terrain;
                    } else {
                        neighborTerrain = WorldGenerator.getTile(cell.q + offset.dq, cell.r + offset.dr, dimension).terrain;
                    }
                    if (neighborTerrain && TERRAIN_PRIORITY[neighborTerrain] > TERRAIN_PRIORITY[cell.terrain]) {
                        if (!priorityNeighbors[neighborTerrain]) priorityNeighbors[neighborTerrain] = [];
                        priorityNeighbors[neighborTerrain].push(offset.dir);
                    }
                });

                for (const [tStr, dirs] of Object.entries(priorityNeighbors)) {
                    let activeDirs = [...dirs].sort((a, b) => DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b));
                    TRANSITION_COMBINATIONS.forEach(combo => {
                        if (activeDirs.length === 0) return;
                        const parts = combo.split('-');
                        if (parts.every(p => activeDirs.includes(p))) {
                            const transCanvas = transitionCache.current.get(`trans-${tStr}-${combo}`);
                            if (transCanvas) ctx.drawImage(transCanvas, -halfSize, -halfSize);
                            activeDirs = activeDirs.filter(d => !parts.includes(d));
                        }
                    });
                }

                // 3. Overlays
                const overlayDef = ASSETS.OVERLAYS[cell.terrain];
                if (overlayDef) {
                    let url = '';
                    if (Array.isArray(overlayDef)) {
                        const hash = Math.abs((cell.q * 13) ^ (cell.r * 7));
                        url = overlayDef[hash % overlayDef.length];
                    } else url = overlayDef;
                    const img = imgCache.current.get(url);
                    if (img) ctx.drawImage(img, -halfSize, -halfSize + OVERLAY_OFFSET_Y, imgSize, imgSize);
                }

                // 4. Fog
                if (!cell.isVisible) {
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = 60 * i * (Math.PI / 180);
                        ctx.lineTo(HEX_SIZE * Math.cos(angle), HEX_SIZE * Math.sin(angle));
                    }
                    ctx.fill();
                }

            }
            ctx.restore();
        });

        animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [visibleCells, viewport, dimension, isTown, townMapData]);

  // --- INTERACTION ---
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      isDragging.current = true; dragDistance.current = 0;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      lastMousePos.current = { x: clientX, y: clientY };
      setPreviewPath([]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const dx = clientX - lastMousePos.current.x;
      const dy = clientY - lastMousePos.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
      
      // Update pans directly for responsive drag
      pan.current.x -= dx; pan.current.y -= dy;
      targetPan.current.x = pan.current.x; // Sync target to avoid snap back
      targetPan.current.y = pan.current.y;
      
      lastMousePos.current = { x: clientX, y: clientY };
      updateViewport(); needsRedraw.current = true;
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handleClick = (e: React.MouseEvent) => {
      if (dragDistance.current > 10) return; 
      const rect = containerRef.current!.getBoundingClientRect();
      const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top;
      const worldX = clickX + (pan.current.x - viewport.w / 2);
      const worldY = clickY + (pan.current.y - viewport.h / 2);
      const { q, r } = pixelToAxial(worldX, worldY);
      onMove(q, r);
  };

  const handleMouseMoveOverlay = (e: React.MouseEvent) => {
      if (isDragging.current) return; 
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
      const worldX = mouseX + (pan.current.x - viewport.w / 2);
      const worldY = mouseY + (pan.current.y - viewport.h / 2);
      const { q, r } = pixelToAxial(worldX, worldY);
      setHoveredCellKey(`${q},${r}`);
  };

  const regionTitle = useMemo(() => isUpsideDown ? 'The Shadow Realm' : 'Arcadia', [isUpsideDown]);
  const playerSprite = useGameStore.getState().party[0]?.visual.spriteUrl || ASSETS.UNITS.PLAYER;

  return (
    <div ref={containerRef} className={`w-full h-full bg-slate-950 relative overflow-hidden select-none transition-all duration-1000 ${isUpsideDown ? 'grayscale-[0.3] brightness-75 contrast-125 hue-rotate-[240deg]' : ''}`}
        onMouseDown={handlePointerDown} onMouseMove={(e) => { handlePointerMove(e); handleMouseMoveOverlay(e); }} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp} onClick={handleClick}>
        
        {/* OPTIMIZATION: Use simple overlay div instead of expensive hue-rotate/grayscale CSS filter */}
        {isUpsideDown && (
             <div className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply bg-indigo-900/80" />
        )}

        <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />
        <svg ref={svgRef} className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%" viewBox={`${pan.current.x - viewport.w / 2} ${pan.current.y - viewport.h / 2} ${viewport.w} ${viewport.h}`} preserveAspectRatio="xMidYMid slice">
             <defs>
                 <radialGradient id="portalGlow">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
                 <polygon id="hex-shape-ui" points={HEX_POINTS} />
             </defs>
             {visibleCells.map(cell => {
                 if (!cell.isExplored || !cell.isVisible) return null;
                 const { x, y } = hexToPixel(cell.q, cell.r);
                 if (cell.hasPortal) {
                     return (
                         <g key={`portal-${cell.q}-${cell.r}`} transform={`translate(${x}, ${y})`}>
                            <circle r={HEX_SIZE * 0.6} fill="url(#portalGlow)" opacity="0.4" />
                            <circle r={HEX_SIZE * 0.4} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5, 3" opacity="0.8">
                                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" />
                            </circle>
                         </g>
                     )
                 }
                 return null;
             })}
             
             {visibleEnemies.map(enemy => {
                 if (!visibleCells.some(c => c.q === enemy.q && c.r === enemy.r && c.isVisible)) return null;
                 const { x, y } = hexToPixel(enemy.q, enemy.r);
                 const distToPlayer = (Math.abs(enemy.q - playerPos.x) + Math.abs(enemy.q + enemy.r - playerPos.x - playerPos.y) + Math.abs(enemy.r - playerPos.y)) / 2;
                 const isAggro = distToPlayer <= enemy.visionRange;

                 return (
                     <g key={enemy.id} transform={`translate(${x}, ${y})`}>
                         {/* Aggro Ring disabled during grace period visually too */}
                         {isAggro && !isGracePeriod && (
                             <circle r={HEX_SIZE * 0.8} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" className="animate-pulse" opacity={0.5} />
                         )}
                         <image href={enemy.sprite} x={-HEX_SIZE * 0.8} y={-HEX_SIZE} width={HEX_SIZE * 1.6} height={HEX_SIZE * 1.6} className="drop-shadow-lg" style={{ imageRendering: 'pixelated' }} />
                         <rect x={-10} y={-HEX_SIZE - 5} width={20} height={3} fill="#ef4444" rx={1} />
                     </g>
                 );
             })}

             {previewPath.length > 0 && (
                 <g className="pointer-events-none">
                     <polyline points={[ (() => { const {x, y} = hexToPixel(playerPos.x, playerPos.y); return `${x},${y}`; })(), ...previewPath.map(cell => { const {x, y} = hexToPixel(cell.q, cell.r); return `${x},${y}`; }) ].join(' ')} fill="none" stroke={isUpsideDown ? "#d8b4fe" : "#fbbf24"} strokeWidth="3" strokeDasharray="8,6" strokeOpacity="0.6" strokeLinecap="round" />
                     {previewPath.map((cell, i) => { const {x, y} = hexToPixel(cell.q, cell.r); return ( <circle key={`path-${i}`} cx={x} cy={y} r={4} fill={isUpsideDown ? "#d8b4fe" : "#fbbf24"} fillOpacity="0.8" /> ); })}
                 </g>
             )}
             {hoveredCellKey && (() => {
                 const [q, r] = hoveredCellKey.split(',').map(Number);
                 const { x, y } = hexToPixel(q, r);
                 return ( <use href="#hex-shape-ui" x={x} y={y} stroke={isUpsideDown ? "#d8b4fe" : "#fbbf24"} strokeWidth="2" fill={isUpsideDown ? "#a855f7" : "#fbbf24"} fillOpacity="0.1" className="animate-pulse" /> );
             })()}
            {(() => {
                const { x, y } = hexToPixel(playerPos.x, playerPos.y);
                const PLAYER_SCALE = 2.0;
                return (
                    <g 
                        className="transition-transform duration-200 ease-linear will-change-transform"
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                        {/* Grace Period Shield Effect */}
                        {isGracePeriod && (
                            <circle r={HEX_SIZE * 1.2} fill="none" stroke="#60a5fa" strokeWidth="2" className="animate-ping" opacity={0.6} />
                        )}
                        {isGracePeriod && (
                            <circle r={HEX_SIZE * 1.1} fill="#3b82f6" opacity={0.2} />
                        )}
                        <use href="#hex-shape-ui" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.6" fill="none" className="animate-pulse" />
                        <image href={playerSprite} x={-(HEX_SIZE * PLAYER_SCALE) / 2} y={-(HEX_SIZE * PLAYER_SCALE) * 0.75} height={HEX_SIZE * PLAYER_SCALE} width={HEX_SIZE * PLAYER_SCALE} className="drop-shadow-2xl" style={{ imageRendering: 'pixelated', opacity: isGracePeriod ? 0.7 : 1 }} />
                    </g>
                );
            })()}
        </svg>
        
        <WeatherOverlay type={currentWeather} />
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none text-center">
             <span className={`text-[10px] tracking-[0.3em] uppercase font-bold mb-1 ${isUpsideDown ? 'text-purple-400' : 'text-amber-500/80'}`}> {isUpsideDown ? 'Dimension' : 'Region'} </span>
            <h2 className={`text-xl md:text-2xl font-serif drop-shadow-lg opacity-90 ${isUpsideDown ? 'text-purple-200' : 'text-amber-100'}`}> {regionTitle} </h2>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold opacity-70"> {currentWeather === WeatherType.ASH ? 'Corrupted Air' : currentWeather === WeatherType.RAIN ? 'Heavy Rain' : currentWeather === WeatherType.FOG ? 'Dense Fog' : currentWeather === WeatherType.SNOW ? 'Snowfall' : 'Clear'} </span>
            {isGracePeriod && <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-2 animate-pulse bg-blue-900/50 px-2 py-1 rounded border border-blue-500/30 inline-block">Safe Passage Active</div>}
        </div>
        <button onClick={() => { const center = hexToPixel(playerPos.x, playerPos.y); pan.current = { x: center.x, y: center.y }; targetPan.current = { ...pan.current }; updateViewport(); needsRedraw.current = true; }} className="absolute bottom-48 right-4 z-20 bg-slate-900/80 border border-amber-500/30 p-3 rounded-full shadow-lg text-amber-400 hover:bg-slate-800 hover:scale-105 transition-all" title="Recenter Camera">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at center, transparent 50%, ${isUpsideDown ? '#0a0010' : '#020617'} 100%)`, opacity: 0.95 }} />
    </div>
  );
};

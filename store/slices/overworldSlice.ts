
import { StateCreator } from 'zustand';
import { GameState, Dimension, Difficulty, HexCell, PositionComponent, WeatherType, OverworldEntity, Quest, GameStateData, TerrainType } from '../../types';
import { WorldGenerator } from '../../services/WorldGenerator';
import { findPath } from '../../services/pathfinding';
import { calculateVisionRange } from '../../services/dndRules';
import { sfx } from '../../services/SoundSystem';
import { useContentStore } from '../contentStore';
import { GameStore } from '../gameStore';
import { DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT, TERRAIN_MOVEMENT_COST } from '../../constants';

// CONSTANTS FOR SAVE SYSTEM
const SAVE_KEY = 'arcadia_tactics_save_v2'; 
const CURRENT_SAVE_VERSION = 3;

interface SaveFile {
    version: number;
    timestamp: number;
    checksum?: string;
    data: GameStateData;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Simple deterministic checksum (FNV-1a 32-bit) over JSON.stringify(data)
const calculateChecksum = (obj: GameStateData): string => {
    try {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        let hash = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619) >>> 0;
        }
        return (hash >>> 0).toString(16);
    } catch (e) {
        return '';
    }
};

export interface OverworldSlice {
  gameState: GameState;
  dimension: Dimension;
  difficulty: Difficulty;
  exploredTiles: Record<Dimension, Set<string>>;
  visitedTowns: Record<string, boolean>;
  clearedEncounters: Set<string>;
  townMapData: HexCell[] | null;
  activeOverworldEnemies: OverworldEntity[];
  playerPos: PositionComponent;
  isPlayerMoving: boolean;
  lastOverworldPos: PositionComponent | null;
  mapDimensions: { width: number; height: number };
  quests: Quest[];
  standingOnPortal: boolean;
  standingOnSettlement: boolean;
  isMapOpen: boolean;
  gracePeriodEndTime: number;

  setGameState: (state: GameState) => void;
  initializeWorld: () => void;
  movePlayerOverworld: (q: number, r: number) => Promise<void>;
  usePortal: () => void;
  enterSettlement: () => void;
  exitSettlement: () => void;
  toggleMap: () => void;
  saveGame: () => void;
  loadGame: () => void;
  quitToMenu: () => void;
}

const generateTownMap = (): HexCell[] => {
    const width = 12;
    const height = 12;
    const cells: HexCell[] = [];
    
    for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
            let terrain = TerrainType.GRASS;
            let poiType: HexCell['poiType'] = undefined;
            if (q >= 4 && q <= 7 && r >= 4 && r <= 7) {
                terrain = TerrainType.COBBLESTONE;
                if (q === 5 && r === 5) poiType = 'PLAZA';
            } else if (q === 5 || q === 6 || r === 5 || r === 6) {
                terrain = TerrainType.DIRT_ROAD;
            } else if (Math.random() > 0.4) {
                 terrain = TerrainType.COBBLESTONE; 
                 if (Math.random() > 0.8) poiType = 'SHOP';
                 else if (Math.random() > 0.9) poiType = 'INN';
            }
            if (q === 0 || q === width-1 || r === 0 || r === height-1) {
                poiType = 'EXIT';
                terrain = TerrainType.DIRT_ROAD;
            }
            cells.push({ q, r, terrain, isExplored: true, isVisible: true, weather: WeatherType.NONE, poiType });
        }
    }
    return cells;
};

const updateExploration = (center: PositionComponent, dimension: Dimension, radius: number, currentSet: Set<string>): Set<string> => {
    const newSet = new Set(currentSet);
    for (let q = center.x - radius; q <= center.x + radius; q++) {
        for (let r = center.y - radius; r <= center.y + radius; r++) {
            const dist = (Math.abs(q - center.x) + Math.abs(q + r - center.x - center.y) + Math.abs(r - center.y)) / 2;
            if (dist <= radius) {
                newSet.add(`${q},${r}`);
            }
        }
    }
    return newSet;
};

export const createOverworldSlice: StateCreator<GameStore, [], [], OverworldSlice> = (set, get) => ({
  gameState: GameState.CHARACTER_CREATION,
  dimension: Dimension.NORMAL,
  difficulty: Difficulty.NORMAL,
  exploredTiles: { [Dimension.NORMAL]: new Set(), [Dimension.UPSIDE_DOWN]: new Set() },
  visitedTowns: {},
  clearedEncounters: new Set(),
  townMapData: null,
  activeOverworldEnemies: [],
  playerPos: { x: 0, y: 0 },
  isPlayerMoving: false,
  lastOverworldPos: null,
  mapDimensions: { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT },
  quests: [],
  standingOnPortal: false,
  standingOnSettlement: false,
  isMapOpen: false,
  gracePeriodEndTime: 0,

  setGameState: (state) => set({ gameState: state }),
  
  initializeWorld: () => {
       // Generator init happens in gameStore/init or implicitly via WorldGenerator class static
       WorldGenerator.init(12345);
  },

  toggleMap: () => { 
      sfx.playUiClick(); 
      set(state => ({ isMapOpen: !state.isMapOpen, isInventoryOpen: false })); 
  },

  movePlayerOverworld: async (q, r) => {
        const { isPlayerMoving, playerPos, dimension, gameState, townMapData, activeOverworldEnemies, party, clearedEncounters, exploredTiles, gracePeriodEndTime } = get();
        
        // Check if movement is redundant BUT allow if not explored
        const currentKey = `${q},${r}`;
        const isAlreadyThere = playerPos.x === q && playerPos.y === r;
        const isTileExplored = exploredTiles[dimension].has(currentKey);
        
        // Grace Period Logic
        const isGracePeriod = Date.now() < gracePeriodEndTime;

        if (isPlayerMoving) return;
        
        if (isAlreadyThere && isTileExplored) return;

        let path: PositionComponent[] | null = [];
        
        if (gameState === GameState.TOWN_EXPLORATION && townMapData) {
            path = findPath({q: playerPos.x, r: playerPos.y}, {q, r}, townMapData);
        } else {
            path = findPath({q: playerPos.x, r: playerPos.y}, {q, r}, undefined, (q, r) => WorldGenerator.getTile(q, r, dimension));
        }

        if (!path || path.length === 0) {
             if (isAlreadyThere) path = [{ q, r, terrain: WorldGenerator.getTile(q, r, dimension).terrain }];
             else return;
        }
        
        // Disable Chase interruption if in Grace Period
        if (!isGracePeriod) {
            const isChaseMode = activeOverworldEnemies.some(e => {
                if (e.dimension !== dimension) return false;
                const dist = (Math.abs(e.q - playerPos.x) + Math.abs(e.q + e.r - playerPos.x - playerPos.y) + Math.abs(e.r - playerPos.y)) / 2;
                return dist <= e.visionRange;
            });

            if (isChaseMode && path.length > 1) {
                path = [path[0]]; 
            }
        }

        set({ isPlayerMoving: true }); 
        if (!isAlreadyThere) sfx.playUiClick();
        
        for (const stepCell of path) {
            if (get().gameState !== GameState.OVERWORLD && get().gameState !== GameState.TOWN_EXPLORATION) break;
            
            // Check Collision with Enemies (Only if not in grace period)
            if (!isGracePeriod) {
                const enemyOnTile = get().activeOverworldEnemies.find(e => e.q === stepCell.q && e.r === stepCell.r && e.dimension === dimension);
                if (enemyOnTile) {
                    get().startBattle(stepCell.terrain, stepCell.weather, enemyOnTile.id);
                    break;
                }
            }

            if (!isAlreadyThere) sfx.playStep();
            
            const { dimension: currentDim, exploredTiles: currentExplored } = get();
            
            if (get().gameState === GameState.TOWN_EXPLORATION && stepCell.poiType === 'EXIT') {
                 get().exitSettlement();
                 break;
            }

            let newExploredSet = currentExplored[currentDim];
            let newEnemies = [...get().activeOverworldEnemies];

            if (get().gameState === GameState.OVERWORLD) {
                const leader = party[0];
                const visionRadius = calculateVisionRange(leader.stats.attributes.WIS);
                
                // Exploration Logic
                for (let vq = stepCell.q - visionRadius; vq <= stepCell.q + visionRadius; vq++) {
                    for (let vr = stepCell.r - visionRadius; vr <= stepCell.r + visionRadius; vr++) {
                        const dist = (Math.abs(vq - stepCell.q) + Math.abs(vq + vr - stepCell.q - stepCell.r) + Math.abs(vr - stepCell.r)) / 2;
                        if (dist <= visionRadius) {
                            const key = `${vq},${vr}`;
                            if (!newExploredSet.has(key)) {
                                newExploredSet.add(key);
                                const tile = WorldGenerator.getTile(vq, vr, currentDim);
                                const encounterKey = `${currentDim}:${vq},${vr}`;
                                
                                // Spawn Logic - DISABLED DURING GRACE PERIOD for cleaner escape
                                if (!isGracePeriod && tile.hasEncounter && !clearedEncounters.has(encounterKey)) {
                                    if (!newEnemies.some(e => e.q === vq && e.r === vr && e.dimension === currentDim)) {
                                        const distToPlayer = (Math.abs(vq - stepCell.q) + Math.abs(vq + vr - stepCell.q - stepCell.r) + Math.abs(vr - stepCell.r)) / 2;
                                        if (distToPlayer >= 2) {
                                            const nearbyEnemiesCount = newEnemies.filter(e => {
                                                if (e.dimension !== currentDim) return false;
                                                return (Math.abs(e.q - vq) < 8 && Math.abs(e.r - vr) < 8);
                                            }).length;

                                            if (nearbyEnemiesCount < 2) {
                                                const { enemies, encounters } = useContentStore.getState();
                                                const possibleEnemies = encounters[tile.terrain] || Object.keys(enemies);
                                                const enemyDefId = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
                                                const enemyDef = enemies[enemyDefId] || Object.values(enemies)[0];
                                                newEnemies.push({
                                                    id: generateId(),
                                                    defId: enemyDefId,
                                                    name: enemyDef.name,
                                                    sprite: enemyDef.sprite,
                                                    dimension: currentDim,
                                                    q: vq,
                                                    r: vr,
                                                    visionRange: 4
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                set({ 
                    playerPos: { x: stepCell.q, y: stepCell.r },
                    exploredTiles: { ...currentExplored, [currentDim]: newExploredSet },
                    activeOverworldEnemies: newEnemies,
                    standingOnPortal: !!stepCell.hasPortal,
                    standingOnSettlement: (stepCell.terrain === TerrainType.VILLAGE || stepCell.terrain === TerrainType.CASTLE)
                });

                // --- ENEMY AI ---
                let updatedEnemies = [...get().activeOverworldEnemies];
                let combatTriggered = false;
                let triggeringEnemyId: string | undefined;

                updatedEnemies = updatedEnemies.map(e => {
                    if (e.dimension !== currentDim) return e;
                    
                    // IF GRACE PERIOD IS ACTIVE, ENEMIES DO NOT MOVE/CHASE
                    if (isGracePeriod) return e;

                    const dist = (Math.abs(e.q - stepCell.q) + Math.abs(e.q + e.r - stepCell.q - stepCell.r) + Math.abs(e.r - stepCell.r)) / 2;
                    
                    if (dist <= e.visionRange && dist > 0) {
                        const neighbors = [
                            { dq: 1, dr: 0 }, { dq: 1, dr: -1 }, { dq: 0, dr: -1 },
                            { dq: -1, dr: 0 }, { dq: -1, dr: 1 }, { dq: 0, dr: 1 }
                        ];

                        let bestMove = { q: e.q, r: e.r };
                        let minDistanceToPlayer = dist;
                        let willAttack = false;

                        for (const n of neighbors) {
                            const targetQ = e.q + n.dq;
                            const targetR = e.r + n.dr;
                            if (targetQ === stepCell.q && targetR === stepCell.r) { willAttack = true; break; }

                            const targetTile = WorldGenerator.getTile(targetQ, targetR, currentDim);
                            const movementCost = TERRAIN_MOVEMENT_COST[targetTile.terrain] || 1;
                            if (movementCost >= 99) continue;

                            const isOccupied = get().activeOverworldEnemies.some(other => other.id !== e.id && other.q === targetQ && other.r === targetR && other.dimension === currentDim);
                            if (isOccupied) continue;

                            const distFromNeighbor = (Math.abs(targetQ - stepCell.q) + Math.abs(targetQ + targetR - stepCell.q - stepCell.r) + Math.abs(targetR - stepCell.r)) / 2;
                            if (distFromNeighbor < minDistanceToPlayer) {
                                minDistanceToPlayer = distFromNeighbor;
                                bestMove = { q: targetQ, r: targetR };
                            }
                        }

                        if (willAttack) {
                            combatTriggered = true;
                            triggeringEnemyId = e.id;
                            return e;
                        }
                        
                        return { ...e, q: bestMove.q, r: bestMove.r };
                    }
                    return e;
                });

                set({ activeOverworldEnemies: updatedEnemies });
                if (combatTriggered) {
                    get().startBattle(stepCell.terrain, stepCell.weather, triggeringEnemyId);
                    break;
                }

            } else {
                set({ 
                    playerPos: { x: stepCell.q, y: stepCell.r },
                    standingOnPortal: false,
                    standingOnSettlement: false
                });
            }

            if (stepCell.hasPortal && get().gameState === GameState.OVERWORLD) { sfx.playMagic(); break; }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        set({ isPlayerMoving: false });
  },

  enterSettlement: () => {
        const { playerPos } = get();
        sfx.playUiClick();
        const townMap = generateTownMap();
        set({ 
            gameState: GameState.TOWN_EXPLORATION, 
            lastOverworldPos: playerPos,
            townMapData: townMap,
            playerPos: { x: 0, y: 6 }, 
            standingOnSettlement: false,
            mapDimensions: { width: 12, height: 12 }
        });
        get().addLog("Entered settlement.", "narrative");
  },

  exitSettlement: () => {
        const { lastOverworldPos } = get();
        if (!lastOverworldPos) return;
        sfx.playUiClick();
        set({ 
            gameState: GameState.OVERWORLD,
            townMapData: null,
            playerPos: lastOverworldPos,
            lastOverworldPos: null,
            mapDimensions: { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }
        });
        get().addLog("Returned to the wild.", "narrative");
  },

  usePortal: () => {
        const { dimension, playerPos, exploredTiles, party } = get();
        const targetDimension = dimension === Dimension.NORMAL ? Dimension.UPSIDE_DOWN : Dimension.NORMAL;
        sfx.playMagic(); get().addLog("Dimension Hop!", "narrative");
        
        const vision = calculateVisionRange(party[0].stats.attributes.WIS);
        const newExploredSet = updateExploration(playerPos, targetDimension, vision, exploredTiles[targetDimension]);
        
        set({ 
            dimension: targetDimension, 
            exploredTiles: { ...exploredTiles, [targetDimension]: newExploredSet }
        });
  },

  saveGame: () => { 
        try { 
            const state = get();
            const exploredNormal = Array.from(state.exploredTiles[Dimension.NORMAL]);
            const exploredUpsideDown = Array.from(state.exploredTiles[Dimension.UPSIDE_DOWN]);
            const clearedEncountersArray = Array.from(state.clearedEncounters);
            
            const saveData: GameStateData = { 
                ...state, 
                // @ts-ignore
                exploredTiles: { 
                    [Dimension.NORMAL]: exploredNormal, 
                    [Dimension.UPSIDE_DOWN]: exploredUpsideDown 
                },
                // @ts-ignore
                clearedEncounters: clearedEncountersArray
            };

            const saveFile: SaveFile = {
                version: CURRENT_SAVE_VERSION,
                timestamp: Date.now(),
                data: saveData,
                checksum: calculateChecksum(saveData)
            };

            // Persist with checksum
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveFile));
            get().addLog("Game Saved Successfully.", "info");
        } catch (e) {
            console.error("Save Failed:", e);
            get().addLog("Failed to save game.", "combat");
        } 
  },

  loadGame: () => { 
        try { 
            const str = localStorage.getItem(SAVE_KEY);
            if(!str) {
                get().addLog("No save game found.", "info");
                return;
            }

            let parsed: SaveFile = JSON.parse(str);
            // Backwards compatibility: older saves might not have version/checksum
            if (!parsed.version && parsed.party) {
                parsed = { version: 0, data: parsed };
            }

            // If the save contains a checksum, validate it
            if (parsed.checksum) {
                const expected = calculateChecksum(parsed.data);
                if (!expected || expected !== parsed.checksum) {
                    // Dev override: if developer wants to force-load a mismatched save,
                    // set localStorage key `${SAVE_KEY}_force_load` = 'true' (ONLY FOR DEV TESTING)
                    const forceKey = `${SAVE_KEY}_force_load`;
                    const force = typeof localStorage !== 'undefined' && localStorage.getItem(forceKey) === 'true';
                    console.warn('Save checksum mismatch.', { expected, actual: parsed.checksum, force });
                    get().addLog('Save file failed integrity check.', 'combat');
                    if (!force) {
                        get().addLog(`To force load for testing, set localStorage['${forceKey}']='true' and retry.`, 'info');
                        return;
                    } else {
                        get().addLog('Force-loading save despite checksum mismatch (dev override).', 'info');
                    }
                }
            }

            let data = parsed.data;
            let version = parsed.version || 0;

            if (version < 1) { data.difficulty = data.difficulty || Difficulty.NORMAL; version = 1; }
            if (version < 2) { if (!data.inventory) data.inventory = []; version = 2; }
            if (version < 3) { if (!data.mapDimensions) data.mapDimensions = { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT }; version = 3; }

            const exploredTiles = {
                [Dimension.NORMAL]: new Set<string>(data.exploredTiles?.[Dimension.NORMAL] || []),
                [Dimension.UPSIDE_DOWN]: new Set<string>(data.exploredTiles?.[Dimension.UPSIDE_DOWN] || [])
            };
            const clearedEncounters = new Set<string>(data.clearedEncounters || []);

            const sanitizedData: Partial<GameStateData> = {
                ...data,
                exploredTiles,
                clearedEncounters,
                party: data.party || [],
                inventory: data.inventory || [],
                visitedTowns: data.visitedTowns || {},
                mapDimensions: data.mapDimensions || { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT },
                activeOverworldEnemies: data.activeOverworldEnemies || [],
                logs: [],
                gameState: GameState.OVERWORLD,
                quests: data.quests || [],
                gracePeriodEndTime: 0 // Reset grace period on load
            };

            set(sanitizedData as GameStateData);
            sfx.playVictory();
            get().addLog("Game Loaded.", "info");

        } catch(e) {
            console.error("Load Failed:", e);
            get().addLog("Save file corrupted.", "combat");
        } 
  },

  quitToMenu: () => { sfx.playUiClick(); set({ gameState: GameState.CHARACTER_CREATION, logs: [], party: [] }); }
});

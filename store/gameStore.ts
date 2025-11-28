
import { create } from 'zustand';
import { 
    GameState, Dimension, TerrainType, Entity, GameStateData, 
    BattleCell, Attributes, CharacterClass, CharacterRace, Difficulty, EquipmentSlot 
} from '../types';
import { BATTLE_MAP_SIZE, BASE_STATS } from '../constants';
import { createPlayerSlice, PlayerSlice } from './slices/playerSlice';
import { createInventorySlice, InventorySlice } from './slices/inventorySlice';
import { createOverworldSlice, OverworldSlice } from './slices/overworldSlice';
import { createBattleSlice, BattleSlice } from './slices/battleSlice';

type GameActions = {
    addLog: (message: string, type?: 'info' | 'combat' | 'loot' | 'narrative' | 'levelup' | 'roll') => void;
};

export type GameStore = GameStateData & PlayerSlice & InventorySlice & OverworldSlice & BattleSlice & GameActions;

export const useGameStore = create<GameStore>((set, get, api) => ({
    // Initial Data State
    gameState: GameState.CHARACTER_CREATION,
    difficulty: Difficulty.NORMAL,
    dimension: Dimension.NORMAL,
    playerPos: { x: 0, y: 0 },
    exploredTiles: { [Dimension.NORMAL]: new Set(), [Dimension.UPSIDE_DOWN]: new Set() },
    battleMap: [],
    turnOrder: [],
    currentTurnIndex: 0,
    party: [],
    inventory: [],
    logs: [],
    
    // Slice Merging
    ...createPlayerSlice(set, get, api),
    ...createInventorySlice(set, get, api),
    ...createOverworldSlice(set, get, api),
    ...createBattleSlice(set, get, api),

    // Common Actions
    addLog: (message, type = 'info') => {
        set(state => {
            const logs = [...(state.logs || []), { message, type, timestamp: Date.now() }];
            // Mantener máximo 1000 logs para evitar memory leaks
            return { logs: logs.slice(-1000) };
        });
    }
}));

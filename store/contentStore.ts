
import { create } from 'zustand';
import { ITEMS, BASE_STATS, ASSETS } from '../constants';
import { Item, CharacterClass, TerrainType, CombatStatsComponent } from '../types';

interface GameConfig {
    mapScale: number;
    moistureOffset: number;
    tempOffset: number;
}

export interface EnemyDefinition {
    id: string;
    name: string;
    sprite: string; // URL
    hp: number;
    ac: number;
    xpReward: number;
    damage: number; // Base damage (e.g. 4 = 1d4 approx)
    initiativeBonus: number;
}

interface ContentState {
    items: Record<string, Item>;
    classStats: Record<CharacterClass, any>;
    gameConfig: GameConfig;
    
    // New: Dynamic Enemy Data
    enemies: Record<string, EnemyDefinition>;
    encounters: Partial<Record<TerrainType, string[]>>; // Terrain -> List of Enemy IDs

    // Actions
    updateItem: (id: string, data: Item) => void;
    createItem: (item: Item) => void;
    deleteItem: (id: string) => void;
    
    updateEnemy: (id: string, data: EnemyDefinition) => void;
    createEnemy: (enemy: EnemyDefinition) => void;
    deleteEnemy: (id: string) => void;
    
    updateEncounterTable: (terrain: TerrainType, enemyIds: string[]) => void;

    updateClassStats: (cls: CharacterClass, stats: Partial<CombatStatsComponent>) => void;
    updateConfig: (config: Partial<GameConfig>) => void;
    exportData: () => string;
    resetToDefaults: () => void;
}

// Default Enemies (Bootstrapping the DB)
const DEFAULT_ENEMIES: Record<string, EnemyDefinition> = {
    'goblin_spearman': { id: 'goblin_spearman', name: 'Goblin Spearman', sprite: ASSETS.UNITS.GOBLIN, hp: 7, ac: 12, xpReward: 25, damage: 4, initiativeBonus: 2 },
    'orc_grunt': { id: 'orc_grunt', name: 'Orc Grunt', sprite: ASSETS.UNITS.ORC, hp: 15, ac: 13, xpReward: 50, damage: 6, initiativeBonus: 1 },
    'skeleton_warrior': { id: 'skeleton_warrior', name: 'Skeleton', sprite: ASSETS.UNITS.SKELETON, hp: 13, ac: 12, xpReward: 35, damage: 5, initiativeBonus: 0 },
    'necromancer': { id: 'necromancer', name: 'Dark Adept', sprite: ASSETS.UNITS.NECROMANCER, hp: 22, ac: 11, xpReward: 100, damage: 8, initiativeBonus: 3 },
    'wolf': { id: 'wolf', name: 'Dire Wolf', sprite: ASSETS.UNITS.WOLF, hp: 11, ac: 13, xpReward: 30, damage: 5, initiativeBonus: 3 },
};

// Default Encounters
const DEFAULT_ENCOUNTERS: Partial<Record<TerrainType, string[]>> = {
    [TerrainType.GRASS]: ['goblin_spearman', 'wolf'],
    [TerrainType.FOREST]: ['goblin_spearman', 'orc_grunt', 'wolf'],
    [TerrainType.MOUNTAIN]: ['orc_grunt', 'wolf'],
    [TerrainType.RUINS]: ['skeleton_warrior', 'necromancer'],
    [TerrainType.SWAMP]: ['skeleton_warrior', 'goblin_spearman'],
    [TerrainType.CAVE_FLOOR]: ['skeleton_warrior', 'orc_grunt'], // Upside Down defaults
};

// Load from LocalStorage or Fallback to Constants
const loadInitialState = () => {
    const saved = localStorage.getItem('arcadia_admin_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return {
                items: parsed.items || { ...ITEMS },
                classStats: parsed.classStats || { ...BASE_STATS },
                gameConfig: parsed.gameConfig || { mapScale: 0.12, moistureOffset: 150, tempOffset: 300 },
                enemies: parsed.enemies || DEFAULT_ENEMIES,
                encounters: parsed.encounters || DEFAULT_ENCOUNTERS
            };
        } catch (e) {
            console.error("Failed to load admin data", e);
        }
    }
    return {
        items: { ...ITEMS },
        classStats: { ...BASE_STATS },
        gameConfig: { mapScale: 0.12, moistureOffset: 150, tempOffset: 300 },
        enemies: DEFAULT_ENEMIES,
        encounters: DEFAULT_ENCOUNTERS
    };
};

export const useContentStore = create<ContentState>((set, get) => ({
    ...loadInitialState(),

    // --- ITEMS ---
    updateItem: (id, data) => {
        set(state => {
            const newItems = { ...state.items, [id]: data };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, items: newItems }));
            return { items: newItems };
        });
    },
    createItem: (item) => {
        set(state => {
            const newItems = { ...state.items, [item.id]: item };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, items: newItems }));
            return { items: newItems };
        });
    },
    deleteItem: (id) => {
        set(state => {
            const newItems = { ...state.items };
            delete newItems[id];
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, items: newItems }));
            return { items: newItems };
        });
    },

    // --- ENEMIES ---
    updateEnemy: (id, data) => {
        set(state => {
            const newEnemies = { ...state.enemies, [id]: data };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, enemies: newEnemies }));
            return { enemies: newEnemies };
        });
    },
    createEnemy: (enemy) => {
        set(state => {
            const newEnemies = { ...state.enemies, [enemy.id]: enemy };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, enemies: newEnemies }));
            return { enemies: newEnemies };
        });
    },
    deleteEnemy: (id) => {
        set(state => {
            const newEnemies = { ...state.enemies };
            delete newEnemies[id];
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, enemies: newEnemies }));
            return { enemies: newEnemies };
        });
    },

    // --- ENCOUNTERS ---
    updateEncounterTable: (terrain, enemyIds) => {
        set(state => {
            const newEncounters = { ...state.encounters, [terrain]: enemyIds };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, encounters: newEncounters }));
            return { encounters: newEncounters };
        });
    },

    // --- CONFIG & CLASSES ---
    updateClassStats: (cls, stats) => {
        set(state => {
            const newStats = { ...state.classStats, [cls]: stats };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, classStats: newStats }));
            return { classStats: newStats };
        });
    },
    updateConfig: (config) => {
        set(state => {
            const newConfig = { ...state.gameConfig, ...config };
            localStorage.setItem('arcadia_admin_data', JSON.stringify({ ...state, gameConfig: newConfig }));
            return { gameConfig: newConfig };
        });
    },

    exportData: () => {
        const state = get();
        return JSON.stringify({
            ITEMS: state.items,
            BASE_STATS: state.classStats,
            CONFIG: state.gameConfig,
            ENEMIES: state.enemies,
            ENCOUNTERS: state.encounters
        }, null, 2);
    },

    resetToDefaults: () => {
        const defaults = {
            items: { ...ITEMS },
            classStats: { ...BASE_STATS },
            gameConfig: { mapScale: 0.12, moistureOffset: 150, tempOffset: 300 },
            enemies: DEFAULT_ENEMIES,
            encounters: DEFAULT_ENCOUNTERS
        };
        set(defaults);
        localStorage.removeItem('arcadia_admin_data');
    }
}));


import { TerrainType, CharacterClass, Attributes, CharacterRace, Item, ItemRarity, EquipmentSlot, Spell, SpellType, Ability } from './types';

export const HEX_SIZE = 20;
export const BATTLE_MAP_SIZE = 14;
export const DEFAULT_MAP_WIDTH = 20;
export const DEFAULT_MAP_HEIGHT = 15;

export const TERRAIN_COLORS: Record<TerrainType, string> = {
    [TerrainType.GRASS]: '#4ade80',
    [TerrainType.PLAINS]: '#fde047',
    [TerrainType.FOREST]: '#166534',
    [TerrainType.JUNGLE]: '#064e3b',
    [TerrainType.MOUNTAIN]: '#57534e',
    [TerrainType.WATER]: '#3b82f6',
    [TerrainType.CASTLE]: '#94a3b8',
    [TerrainType.VILLAGE]: '#fbbf24',
    [TerrainType.DESERT]: '#fcd34d',
    [TerrainType.SWAMP]: '#3f6212',
    [TerrainType.RUINS]: '#78716c',
    [TerrainType.TUNDRA]: '#e2e8f0',
    [TerrainType.TAIGA]: '#3f6212',
    [TerrainType.COBBLESTONE]: '#64748b',
    [TerrainType.DIRT_ROAD]: '#b45309',
    [TerrainType.STONE_FLOOR]: '#475569',
    [TerrainType.CAVE_FLOOR]: '#1f2937',
    [TerrainType.FUNGUS]: '#a855f7',
    [TerrainType.LAVA]: '#ef4444',
    [TerrainType.CHASM]: '#000000',
    [TerrainType.WALL_HOUSE]: '#78350f',
    [TerrainType.WOOD_FLOOR]: '#451a03'
};

// --- RARITY COLORS ---
export const RARITY_COLORS: Record<ItemRarity, string> = {
    [ItemRarity.COMMON]: '#9ca3af',     // Slate-400
    [ItemRarity.UNCOMMON]: '#22c55e',   // Green
    [ItemRarity.RARE]: '#3b82f6',       // Blue
    [ItemRarity.VERY_RARE]: '#a855f7',  // Purple
    [ItemRarity.LEGENDARY]: '#f59e0b',  // Orange/Gold
};

export const TERRAIN_MOVEMENT_COST: Record<TerrainType, number> = {
    [TerrainType.GRASS]: 1, [TerrainType.PLAINS]: 1, [TerrainType.FOREST]: 2, [TerrainType.JUNGLE]: 2,
    [TerrainType.MOUNTAIN]: 3, [TerrainType.WATER]: 99, [TerrainType.CASTLE]: 1, [TerrainType.VILLAGE]: 1,
    [TerrainType.DESERT]: 2, [TerrainType.SWAMP]: 3, [TerrainType.RUINS]: 2, [TerrainType.TUNDRA]: 2,
    [TerrainType.TAIGA]: 2, [TerrainType.COBBLESTONE]: 1, [TerrainType.DIRT_ROAD]: 1, [TerrainType.STONE_FLOOR]: 1,
    [TerrainType.CAVE_FLOOR]: 1, [TerrainType.FUNGUS]: 2, [TerrainType.LAVA]: 99, [TerrainType.CHASM]: 99,
    [TerrainType.WALL_HOUSE]: 99, [TerrainType.WOOD_FLOOR]: 1
};

export const BASE_STATS: Record<CharacterClass, Attributes> = {
    [CharacterClass.FIGHTER]: { STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 10 },
    [CharacterClass.WIZARD]: { STR: 8, DEX: 14, CON: 12, INT: 16, WIS: 12, CHA: 10 },
    [CharacterClass.ROGUE]: { STR: 10, DEX: 16, CON: 12, INT: 12, WIS: 10, CHA: 14 },
    [CharacterClass.CLERIC]: { STR: 12, DEX: 10, CON: 14, INT: 10, WIS: 16, CHA: 12 },
    [CharacterClass.RANGER]: { STR: 12, DEX: 16, CON: 12, INT: 10, WIS: 14, CHA: 10 },
    [CharacterClass.BARBARIAN]: { STR: 16, DEX: 12, CON: 16, INT: 8, WIS: 10, CHA: 8 },
    [CharacterClass.PALADIN]: { STR: 16, DEX: 10, CON: 14, INT: 8, WIS: 10, CHA: 16 },
    [CharacterClass.SORCERER]: { STR: 8, DEX: 14, CON: 14, INT: 10, WIS: 10, CHA: 16 },
    [CharacterClass.WARLOCK]: { STR: 10, DEX: 14, CON: 12, INT: 10, WIS: 12, CHA: 16 },
    [CharacterClass.DRUID]: { STR: 10, DEX: 12, CON: 14, INT: 10, WIS: 16, CHA: 10 },
    [CharacterClass.BARD]: { STR: 8, DEX: 14, CON: 12, INT: 12, WIS: 10, CHA: 16 },
};

export const RACE_BONUS: Record<CharacterRace, Partial<Attributes>> = {
    [CharacterRace.HUMAN]: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    [CharacterRace.ELF]: { DEX: 2, INT: 1 },
    [CharacterRace.DWARF]: { CON: 2, STR: 1 },
    [CharacterRace.HALFLING]: { DEX: 2, CHA: 1 },
    [CharacterRace.DRAGONBORN]: { STR: 2, CHA: 1 },
    [CharacterRace.GNOME]: { INT: 2, DEX: 1 },
    [CharacterRace.TIEFLING]: { CHA: 2, INT: 1 },
    [CharacterRace.HALF_ORC]: { STR: 2, CON: 1 }
};

export const XP_TABLE = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];

export const DIFFICULTY_SETTINGS = {
    EASY: { enemyStatMod: 0.8, xpMod: 1.2, goldMod: 1.5 },
    NORMAL: { enemyStatMod: 1.0, xpMod: 1.0, goldMod: 1.0 },
    HARD: { enemyStatMod: 1.3, xpMod: 0.8, goldMod: 0.7 }
};

// ASSET PATHS
export const USE_LOCAL_ASSETS = true;

const REMOTE_WESNOTH_URL = "https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/images";
const LOCAL_WESNOTH_URL = "/assets/wesnoth";

const REMOTE_MC_URL = "https://raw.githubusercontent.com/Poudingue/Vanilla-Normals-Renewed/master/assets/minecraft/textures/block";
const LOCAL_MC_URL = "/assets/minecraft";

export const WESNOTH_BASE_URL = USE_LOCAL_ASSETS ? LOCAL_WESNOTH_URL : REMOTE_WESNOTH_URL;
export const MC_BASE_URL = USE_LOCAL_ASSETS ? LOCAL_MC_URL : REMOTE_MC_URL;

export const ASSETS = {
    UNITS: {
        PLAYER: 'assets/wesnoth/units/human-loyalists/lieutenant.png',
        GOBLIN: 'assets/wesnoth/units/goblins/spearman.png',
        ORC: 'assets/wesnoth/units/orcs/grunt.png',
        SKELETON: 'assets/wesnoth/units/undead-skeletal/skeleton.png',
        NECROMANCER: 'assets/wesnoth/units/undead-necromancers/dark-sorcerer.png',
        WOLF: 'assets/wesnoth/units/monsters/wolf.png',

        PLAYER_FIGHTER: `${WESNOTH_BASE_URL}/units/human-loyalists/swordsman.png`,
        PLAYER_WIZARD: `${WESNOTH_BASE_URL}/units/human-magi/red-mage.png`,
        PLAYER_ROGUE: `${WESNOTH_BASE_URL}/units/human-outlaws/thief.png`,
        PLAYER_CLERIC: `${WESNOTH_BASE_URL}/units/human-magi/white-mage.png`,
        PLAYER_BARBARIAN: `${WESNOTH_BASE_URL}/units/human-outlaws/thug.png`,
        PLAYER_BARD: `${WESNOTH_BASE_URL}/units/human-loyalists/fencer.png`,
        PLAYER_DRUID: `${WESNOTH_BASE_URL}/units/elves-wood/shaman.png`,
        PLAYER_PALADIN: `${WESNOTH_BASE_URL}/units/human-loyalists/paladin.png`,
        PLAYER_RANGER: `${WESNOTH_BASE_URL}/units/human-loyalists/huntsman.png`,
        PLAYER_SORCERER: `${WESNOTH_BASE_URL}/units/human-magi/silver-mage.png`,
        PLAYER_WARLOCK: `${WESNOTH_BASE_URL}/units/undead-necromancers/dark-adept.png`, // Fixed Path

        ELF_FIGHTER: `${WESNOTH_BASE_URL}/units/elves-wood/hero.png`,
        ELF_ARCHER: `${WESNOTH_BASE_URL}/units/elves-wood/archer.png`,
        DWARF_FIGHTER: `${WESNOTH_BASE_URL}/units/dwarves/steelclad.png`,
        DWARF_GUARD: `${WESNOTH_BASE_URL}/units/dwarves/guardsman.png`,

        PLAYER_HALFLING: `${WESNOTH_BASE_URL}/units/human-outlaws/footpad.png`,
        PLAYER_DRAGONBORN: `${WESNOTH_BASE_URL}/units/drakes/fighter.png`,
        PLAYER_GNOME: `${WESNOTH_BASE_URL}/units/dwarves/thunderer.png`,
        PLAYER_TIEFLING: `${WESNOTH_BASE_URL}/units/undead-necromancers/dark-adept.png`, // Fixed Path
        PLAYER_HALF_ORC: `${WESNOTH_BASE_URL}/units/orcs/warrior.png`,
    },
    TERRAIN: {
        [TerrainType.GRASS]: `${WESNOTH_BASE_URL}/terrain/grass/green.png`,
        [TerrainType.PLAINS]: `${WESNOTH_BASE_URL}/terrain/grass/semi-dry.png`,
        [TerrainType.TAIGA]: `${WESNOTH_BASE_URL}/terrain/grass/dry.png`,
        [TerrainType.JUNGLE]: `${WESNOTH_BASE_URL}/terrain/grass/green.png`,
        [TerrainType.TUNDRA]: `${WESNOTH_BASE_URL}/terrain/frozen/snow.png`,
        [TerrainType.FOREST]: `${WESNOTH_BASE_URL}/terrain/grass/green.png`,
        [TerrainType.WATER]: `${WESNOTH_BASE_URL}/terrain/water/coast.png`,
        [TerrainType.MOUNTAIN]: `${WESNOTH_BASE_URL}/terrain/mountains/basic.png`,
        [TerrainType.VILLAGE]: `${WESNOTH_BASE_URL}/terrain/village/human-cottage.png`,
        [TerrainType.CASTLE]: `${WESNOTH_BASE_URL}/terrain/flat/dirt.png`,
        [TerrainType.RUINS]: `${WESNOTH_BASE_URL}/terrain/flat/dirt.png`,
        [TerrainType.DESERT]: `${WESNOTH_BASE_URL}/terrain/sand/desert.png`,
        [TerrainType.SWAMP]: `${WESNOTH_BASE_URL}/terrain/swamp/water-tile.png`,
        [TerrainType.CAVE_FLOOR]: `${WESNOTH_BASE_URL}/terrain/cave/floor.png`,
        [TerrainType.FUNGUS]: `${WESNOTH_BASE_URL}/terrain/cave/fungus-tile.png`,
        [TerrainType.LAVA]: `${WESNOTH_BASE_URL}/terrain/chasm/lava.png`,
        [TerrainType.CHASM]: `${WESNOTH_BASE_URL}/terrain/chasm/earthy.png`,
        // Fixed Paths
        [TerrainType.COBBLESTONE]: `${WESNOTH_BASE_URL}/terrain/flat/road.png`,
        [TerrainType.DIRT_ROAD]: `${WESNOTH_BASE_URL}/terrain/flat/dirt.png`,

        [TerrainType.WOOD_FLOOR]: `${WESNOTH_BASE_URL}/terrain/interior/wooden.png`,
        [TerrainType.STONE_FLOOR]: `${WESNOTH_BASE_URL}/terrain/interior/stone.png`,
        [TerrainType.WALL_HOUSE]: `${WESNOTH_BASE_URL}/terrain/walls/stone.png`,
    },
    BLOCK_TEXTURES: {
        [TerrainType.GRASS]: '/assets/minecraft/grass_block_top.png',
        [TerrainType.WATER]: '/assets/minecraft/blue_concrete.png',
        [TerrainType.MOUNTAIN]: '/assets/minecraft/stone.png',
        [TerrainType.DESERT]: '/assets/minecraft/sand.png',
        [TerrainType.CASTLE]: '/assets/minecraft/stone_bricks.png',
        [TerrainType.LAVA]: '/assets/minecraft/lava_still.png',
        [TerrainType.SWAMP]: '/assets/minecraft/mycelium_top.png',
        [TerrainType.STONE_FLOOR]: '/assets/minecraft/stone.png',
        [TerrainType.VILLAGE]: '/assets/minecraft/oak_planks.png',
        [TerrainType.COBBLESTONE]: '/assets/minecraft/cobblestone.png',
        [TerrainType.DIRT_ROAD]: '/assets/minecraft/podzol_top.png',
        [TerrainType.PLAINS]: '/assets/minecraft/grass_block_top.png',
        [TerrainType.FOREST]: '/assets/minecraft/grass_block_top.png',
        [TerrainType.JUNGLE]: '/assets/minecraft/grass_block_top.png',
        [TerrainType.TAIGA]: '/assets/minecraft/podzol_top.png',
        [TerrainType.TUNDRA]: '/assets/minecraft/snow.png',
        [TerrainType.RUINS]: '/assets/minecraft/mossy_cobblestone.png',
        [TerrainType.CAVE_FLOOR]: '/assets/minecraft/cobblestone.png',
        [TerrainType.FUNGUS]: '/assets/minecraft/mycelium_top.png',
        [TerrainType.CHASM]: '/assets/minecraft/black_concrete.png',
        [TerrainType.WOOD_FLOOR]: '/assets/minecraft/oak_planks.png',
        [TerrainType.WALL_HOUSE]: '/assets/minecraft/bricks.png',
    },
    OVERLAYS: {
        [TerrainType.FOREST]: [
            `${WESNOTH_BASE_URL}/terrain/forest/pine-tile.png`,
            `${WESNOTH_BASE_URL}/terrain/forest/deciduous-summer-tile.png`
        ],
        [TerrainType.JUNGLE]: `${WESNOTH_BASE_URL}/terrain/forest/rainforest-tile.png`,
        [TerrainType.TAIGA]: `${WESNOTH_BASE_URL}/terrain/forest/snow-forest-tile.png`,
        [TerrainType.MOUNTAIN]: [
            `${WESNOTH_BASE_URL}/terrain/mountains/basic-tile.png`,
            `${WESNOTH_BASE_URL}/terrain/mountains/dry-tile.png`
        ],
        [TerrainType.VILLAGE]: `${WESNOTH_BASE_URL}/terrain/village/human-cottage.png`,
        [TerrainType.CASTLE]: `${WESNOTH_BASE_URL}/terrain/castle/castle.png`,
        [TerrainType.RUINS]: `${WESNOTH_BASE_URL}/terrain/castle/ruin.png`,
        [TerrainType.FUNGUS]: `${WESNOTH_BASE_URL}/terrain/cave/fungus-tile.png`,
        [TerrainType.COBBLESTONE]: `${WESNOTH_BASE_URL}/terrain/village/human-city-tile.png`,
    },
    PROJECTILES: {
        NECRO_BOLT: 'assets/wesnoth/items/staff-ruby.png',
        MAGIC_MISSILE: 'assets/wesnoth/items/staff.png',
        FIREBALL: 'assets/wesnoth/items/potion-red.png',
        ARROW: 'assets/wesnoth/items/bow.png'
    },
    ANIMATIONS: {
        HEAL: [
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-1.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-2.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-3.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-4.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-5.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-6.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-7.png`,
            `${WESNOTH_BASE_URL}/halo/elven/nature-halo-8.png`
        ],
        DARK_AURA: [
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-1.png`,
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-2.png`,
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-3.png`,
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-4.png`,
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-5.png`,
            `${WESNOTH_BASE_URL}/halo/undead/dark-magic-6.png`
        ],
        LIGHTNING: [
            `${WESNOTH_BASE_URL}/halo/lightning-bolt-1-1.png`,
            `${WESNOTH_BASE_URL}/halo/lightning-bolt-1-2.png`,
            `${WESNOTH_BASE_URL}/halo/lightning-bolt-1-3.png`,
            `${WESNOTH_BASE_URL}/halo/lightning-bolt-1-4.png`
        ],
        EXPLOSION: [
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-1.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-2.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-3.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-4.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-5.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-6.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-7.png`,
            `${WESNOTH_BASE_URL}/projectiles/fire-burst-small-8.png`
        ]
    },
    WEATHER: {
        RAIN: 'assets/wesnoth/weather/rain-heavy.png'
    },
    DECORATIONS: {
        GRASS_1: 'assets/minecraft/grass.png',
        FLOWER_1: 'assets/minecraft/red_mushroom.png',
        ROCK_1: 'assets/minecraft/stone.png',
        MUSHROOM: 'assets/minecraft/red_mushroom.png'
    }
};

export const TERRAIN_PRIORITY: Record<string, number> = {
    [TerrainType.WATER]: 0,
    [TerrainType.GRASS]: 1,
    [TerrainType.PLAINS]: 1,
    [TerrainType.FOREST]: 2,
    [TerrainType.MOUNTAIN]: 3
};

export const TRANSITION_COMBINATIONS: string[] = [
    'n-ne-se-s-sw-nw',
    'n-ne-se-s-sw', 'ne-se-s-sw-nw', 'se-s-sw-nw-n', 's-sw-nw-n-ne', 'sw-nw-n-ne-se', 'nw-n-ne-se-s',
    'n-ne-se-s', 'ne-se-s-sw', 'se-s-sw-nw', 's-sw-nw-n', 'sw-nw-n-ne', 'nw-n-ne-se',
    'n-ne-se', 'ne-se-s', 'se-s-sw', 's-sw-nw', 'sw-nw-n', 'nw-n-ne',
    'n-ne', 'ne-se', 'se-s', 's-sw', 'sw-nw', 'nw-n',
    'n', 'ne', 'se', 's', 'sw', 'nw'
];
export const DIRECTION_ORDER: string[] = ['n', 'ne', 'se', 's', 'sw', 'nw'];
export const getWesnothTransition = (t: string, c: string) => `assets/wesnoth/terrain/${t}-${c}.png`;

export const getSprite = (race: CharacterRace, cls: CharacterClass) => ASSETS.UNITS.PLAYER;

export const SPELLS: Record<string, Spell> = {
    'MAGIC_MISSILE': { id: 'magic_missile', name: 'Magic Missile', level: 1, type: SpellType.DAMAGE, diceCount: 3, diceSides: 4, description: 'Fires 3 missiles.', range: 6 },
    'CURE_WOUNDS': { id: 'cure_wounds', name: 'Cure Wounds', level: 1, type: SpellType.HEAL, diceCount: 1, diceSides: 8, description: 'Heals a creature.', range: 1 },
    'FIREBALL': { id: 'fireball', name: 'Fireball', level: 3, type: SpellType.DAMAGE, diceCount: 8, diceSides: 6, description: 'Explosive fire.', range: 6 },
    'THUNDERWAVE': { id: 'thunderwave', name: 'Thunderwave', level: 1, type: SpellType.DAMAGE, diceCount: 2, diceSides: 8, description: 'Thunderous force.', range: 2 },
    'FIRE_BOLT': { id: 'firebolt', name: 'Fire Bolt', level: 0, type: SpellType.DAMAGE, diceCount: 1, diceSides: 10, description: 'Hurls a mote of fire.', range: 12 }
};

export const CLASS_SPELLS: Record<CharacterClass, string[]> = {
    [CharacterClass.WIZARD]: ['FIRE_BOLT', 'MAGIC_MISSILE', 'FIREBALL'],
    [CharacterClass.CLERIC]: ['CURE_WOUNDS'],
    [CharacterClass.FIGHTER]: [],
    [CharacterClass.ROGUE]: [],
    [CharacterClass.RANGER]: [],
    [CharacterClass.BARBARIAN]: [],
    [CharacterClass.PALADIN]: ['CURE_WOUNDS'],
    [CharacterClass.SORCERER]: ['FIRE_BOLT', 'MAGIC_MISSILE'],
    [CharacterClass.WARLOCK]: ['FIRE_BOLT', 'MAGIC_MISSILE'],
    [CharacterClass.DRUID]: ['CURE_WOUNDS', 'THUNDERWAVE'],
    [CharacterClass.BARD]: ['CURE_WOUNDS', 'THUNDERWAVE']
};

export const ITEMS: Record<string, Item> = {
    'POTION_HEALING': { id: 'potion_healing', name: 'Healing Potion', type: 'consumable', rarity: ItemRarity.COMMON, description: 'Restores HP', icon: 'assets/wesnoth/items/potion-red.png', effect: { type: 'heal_hp', amount: 10 } },
    'POTION_MANA': { id: 'potion_mana', name: 'Mana Potion', type: 'consumable', rarity: ItemRarity.UNCOMMON, description: 'Restores Mana', icon: 'assets/wesnoth/items/potion-blue.png', effect: { type: 'restore_mana', amount: 2 } },
    'RATION': { id: 'ration', name: 'Rations', type: 'consumable', rarity: ItemRarity.COMMON, description: 'Food', icon: 'assets/wesnoth/items/potion-orange.png', effect: { type: 'heal_hp', amount: 2 } },

    'LONGSWORD': { id: 'longsword', name: 'Longsword', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Versatile blade', icon: 'assets/wesnoth/items/sword.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 8 } },
    'DAGGER': { id: 'dagger', name: 'Dagger', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Simple blade', icon: 'assets/wesnoth/items/dagger.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 4, properties: ['Finesse'] } },
    'GREATAXE': { id: 'greataxe', name: 'Greataxe', type: 'equipment', rarity: ItemRarity.UNCOMMON, description: 'Heavy axe', icon: 'assets/wesnoth/attacks/battleaxe.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 12 } },
    'MACE': { id: 'mace', name: 'Mace', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Blunt force', icon: 'assets/wesnoth/attacks/mace.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 6 } },
    'QUARTERSTAFF': { id: 'quarterstaff', name: 'Quarterstaff', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Simple staff', icon: 'assets/wesnoth/items/staff.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 6 } },
    'SHORTSWORD': { id: 'shortsword', name: 'Shortsword', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Light blade', icon: 'assets/wesnoth/items/sword.png', equipmentStats: { slot: EquipmentSlot.MAIN_HAND, diceCount: 1, diceSides: 6, properties: ['Finesse'] } },

    'CHAIN_MAIL': { id: 'chain_mail', name: 'Chain Mail', type: 'equipment', rarity: ItemRarity.UNCOMMON, description: 'Heavy armor', icon: 'assets/wesnoth/items/armor.png', equipmentStats: { slot: EquipmentSlot.BODY, ac: 16 } },
    'LEATHER_ARMOR': { id: 'leather_armor', name: 'Leather Armor', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Light armor', icon: 'assets/wesnoth/items/armor.png', equipmentStats: { slot: EquipmentSlot.BODY, ac: 11 } },
    'CHAIN_SHIRT': { id: 'chain_shirt', name: 'Chain Shirt', type: 'equipment', rarity: ItemRarity.UNCOMMON, description: 'Medium armor', icon: 'assets/wesnoth/items/armor.png', equipmentStats: { slot: EquipmentSlot.BODY, ac: 13 } },
    'SHIELD': { id: 'shield', name: 'Shield', type: 'equipment', rarity: ItemRarity.COMMON, description: 'Protection', icon: 'assets/wesnoth/items/shield.png', equipmentStats: { slot: EquipmentSlot.OFF_HAND, ac: 2 } }
};

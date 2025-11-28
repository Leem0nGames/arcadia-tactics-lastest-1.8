import { TerrainType, Difficulty, Item, ItemRarity } from '../types';
import { ITEMS } from '../constants';

type LootCategory = { common: Item[]; uncommon?: Item[]; rare?: Item[]; very_rare?: Item[]; legendary?: Item[] };

const makeList = (keys: string[]) => keys.map(k => (ITEMS as any)[k]).filter(Boolean) as Item[];

// Expanded loot tables: more items per biome and explicit rarities.
export const LOOT_TABLES: Record<TerrainType, LootCategory> = {
  [TerrainType.GRASS]: {
    common: makeList(['RATION', 'POTION_HEALING', 'DAGGER', 'SHORTSWORD']),
    uncommon: makeList(['LEATHER_ARMOR', 'SHORTSWORD', 'QUARTERSTAFF']),
    rare: makeList(['LONGSWORD', 'GREATAXE']),
    very_rare: makeList(['CHAIN_SHIRT']),
    legendary: []
  },
  [TerrainType.FOREST]: {
    common: makeList(['RATION', 'POTION_HEALING', 'DAGGER']),
    uncommon: makeList(['SHORTSWORD', 'QUARTERSTAFF', 'POTION_MANA']),
    rare: makeList(['LONGSWORD', 'MACE']),
    very_rare: makeList(['CHAIN_SHIRT']),
    legendary: []
  },
  [TerrainType.MOUNTAIN]: {
    common: makeList(['RATION']),
    uncommon: makeList(['CHAIN_SHIRT', 'SHIELD']),
    rare: makeList(['CHAIN_MAIL', 'GREATAXE']),
    very_rare: makeList(['LONGSWORD']),
    legendary: []
  },
  [TerrainType.VILLAGE]: {
    common: makeList(['RATION', 'POTION_HEALING']),
    uncommon: makeList(['LEATHER_ARMOR', 'SHORTSWORD']),
    rare: makeList(['CHAIN_SHIRT', 'MACE']),
    very_rare: [],
    legendary: []
  },
  [TerrainType.CASTLE]: {
    common: makeList(['RATION']),
    uncommon: makeList(['CHAIN_SHIRT', 'SHIELD']),
    rare: makeList(['CHAIN_MAIL', 'LONGSWORD']),
    very_rare: makeList(['GREATAXE']),
    legendary: []
  },
  [TerrainType.SWAMP]: {
    common: makeList(['RATION', 'DAGGER']),
    uncommon: makeList(['POTION_HEALING']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.DESERT]: {
    common: makeList(['RATION']),
    uncommon: makeList(['DAGGER']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.PLAINS]: {
    common: makeList(['RATION', 'DAGGER', 'SHORTSWORD']),
    uncommon: makeList(['LEATHER_ARMOR']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.TAIGA]: {
    common: makeList(['RATION', 'POTION_HEALING']),
    uncommon: makeList(['SHORTSWORD']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.JUNGLE]: {
    common: makeList(['RATION']),
    uncommon: makeList(['DAGGER', 'POTION_HEALING']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.TUNDRA]: {
    common: makeList(['RATION']),
    uncommon: makeList(['SHORTSWORD']),
    rare: [],
    very_rare: [],
    legendary: []
  },
  [TerrainType.RUINS]: {
    common: makeList(['RATION']),
    uncommon: makeList(['SHORTSWORD', 'POTION_HEALING']),
    rare: makeList(['LONGSWORD', 'CHAIN_SHIRT']),
    very_rare: makeList(['CHAIN_MAIL']),
    legendary: []
  },
  [TerrainType.COBBLESTONE]: { common: makeList(['RATION']), uncommon: makeList(['SHORTSWORD']), rare: [], very_rare: [], legendary: [] },
  [TerrainType.DIRT_ROAD]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.CAVE_FLOOR]: { common: makeList(['RATION']), uncommon: makeList(['QUARTERSTAFF', 'POTION_HEALING']), rare: [], very_rare: [], legendary: [] },
  [TerrainType.FUNGUS]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.LAVA]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.WATER]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.WOOD_FLOOR]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.STONE_FLOOR]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] },
  [TerrainType.WALL_HOUSE]: { common: makeList(['RATION']), uncommon: [], rare: [], very_rare: [], legendary: [] }
};

// Choose rarity based on level and difficulty modifiers
export function dropLoot(terrain: TerrainType, playerLevel: number, difficulty: Difficulty): { items: Item[]; gold: number; rarity: ItemRarity } {
  const table = LOOT_TABLES[terrain] || LOOT_TABLES[TerrainType.GRASS];
  const diffMod = difficulty === Difficulty.HARD ? 1.25 : difficulty === Difficulty.EASY ? 0.8 : 1.0;

  // Gold scaled by playerLevel and difficulty
  const gold = Math.floor((Math.random() * 10 + 5) * Math.max(1, playerLevel) * diffMod);

  const roll = Math.random();
  let chosenRarity = ItemRarity.COMMON;
  // base probabilities shifted by playerLevel
  const rareChance = Math.min(0.25, 0.02 + Math.max(0, playerLevel - 1) * 0.01 * diffMod);
  const veryRareChance = Math.min(0.07, 0.002 + Math.max(0, playerLevel - 1) * 0.005 * diffMod);
  const legendaryChance = Math.min(0.01, 0.0005 + Math.max(0, playerLevel - 1) * 0.001 * diffMod);

  if (roll < legendaryChance) chosenRarity = ItemRarity.LEGENDARY;
  else if (roll < legendaryChance + veryRareChance) chosenRarity = ItemRarity.VERY_RARE;
  else if (roll < legendaryChance + veryRareChance + rareChance) chosenRarity = ItemRarity.RARE;
  else if (roll < legendaryChance + veryRareChance + rareChance + 0.25) chosenRarity = ItemRarity.UNCOMMON;
  else chosenRarity = ItemRarity.COMMON;

  const pool: Item[] = [];
  if (chosenRarity === ItemRarity.COMMON) pool.push(...(table.common || []));
  if (chosenRarity === ItemRarity.UNCOMMON) pool.push(...(table.uncommon || table.common || []));
  if (chosenRarity === ItemRarity.RARE) pool.push(...(table.rare || table.uncommon || table.common || []));
  if (chosenRarity === ItemRarity.VERY_RARE) pool.push(...(table.very_rare || table.rare || table.uncommon || table.common || []));
  if (chosenRarity === ItemRarity.LEGENDARY) pool.push(...(table.legendary || table.very_rare || table.rare || table.uncommon || table.common || []));

  const items: Item[] = [];
  // Increase chance to drop at higher levels
  const dropChance = Math.min(0.95, 0.5 + (Math.max(0, playerLevel - 1) * 0.03));
  if (pool.length > 0 && Math.random() < dropChance) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) items.push(pick);
  }

  return { items, gold, rarity: chosenRarity };
}

export default { LOOT_TABLES, dropLoot };

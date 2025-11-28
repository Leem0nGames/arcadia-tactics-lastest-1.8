

export enum GameState {
  LOGIN,
  CHARACTER_CREATION,
  OVERWORLD,
  TOWN_EXPLORATION,
  BATTLE_INIT,
  BATTLE_TACTICAL,
  BATTLE_RESOLUTION,
  BATTLE_VICTORY,
  BATTLE_DEFEAT,
  LOCAL_MAP
}

export enum Dimension {
  NORMAL = 'NORMAL',
  UPSIDE_DOWN = 'UPSIDE_DOWN'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export enum TerrainType {
  GRASS = 'grass',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  WATER = 'water',
  CASTLE = 'castle',
  VILLAGE = 'village',
  DESERT = 'desert',
  SWAMP = 'swamp',
  PLAINS = 'plains',
  TAIGA = 'taiga',
  JUNGLE = 'jungle',
  TUNDRA = 'tundra',
  RUINS = 'ruins',
  CAVE_FLOOR = 'cave_floor',
  FUNGUS = 'fungus',
  LAVA = 'lava',
  CHASM = 'chasm',
  COBBLESTONE = 'cobblestone',
  DIRT_ROAD = 'dirt_road',
  WOOD_FLOOR = 'wood_floor',
  STONE_FLOOR = 'stone_floor',
  WALL_HOUSE = 'wall_house'
}

export enum WeatherType {
  NONE = 'NONE',
  RAIN = 'RAIN',
  SNOW = 'SNOW',
  FOG = 'FOG',
  ASH = 'ASH'
}

export enum Ability {
  STR = 'STR',
  DEX = 'DEX',
  CON = 'CON',
  INT = 'INT',
  WIS = 'WIS',
  CHA = 'CHA'
}

export interface Attributes {
  [Ability.STR]: number;
  [Ability.DEX]: number;
  [Ability.CON]: number;
  [Ability.INT]: number;
  [Ability.WIS]: number;
  [Ability.CHA]: number;
}

export enum CharacterClass {
  FIGHTER = 'Fighter',
  WIZARD = 'Wizard',
  ROGUE = 'Rogue',
  CLERIC = 'Cleric',
  BARBARIAN = 'Barbarian',
  BARD = 'Bard',
  DRUID = 'Druid',
  PALADIN = 'Paladin',
  RANGER = 'Ranger',
  SORCERER = 'Sorcerer',
  WARLOCK = 'Warlock'
}

export enum CharacterRace {
  HUMAN = 'Human',
  ELF = 'Elf',
  DWARF = 'Dwarf',
  HALFLING = 'Halfling',
  DRAGONBORN = 'Dragonborn',
  GNOME = 'Gnome',
  TIEFLING = 'Tiefling',
  HALF_ORC = 'Half-Orc'
}

export enum BattleAction {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  MAGIC = 'MAGIC',
  ITEM = 'ITEM',
  WAIT = 'WAIT',
  RUN = 'RUN',
  LOOT = 'LOOT'
}

export enum SpellType {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  BUFF = 'BUFF'
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  range: number;
  type: SpellType;
  diceCount: number;
  diceSides: number;
  description: string;
  animation?: string;
}

export enum EquipmentSlot {
  MAIN_HAND = 'main_hand',
  OFF_HAND = 'off_hand',
  BODY = 'body'
}

export enum ItemRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  VERY_RARE = 'Very Rare',
  LEGENDARY = 'Legendary'
}

// DEFINITION SCHEMA: Static Data
export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'equipment' | 'key';
  rarity: ItemRarity;
  description: string;
  flavorText?: string;
  icon: string;
  effect?: {
      type: 'heal_hp' | 'restore_mana' | 'buff_str';
      amount: number;
  };
  equipmentStats?: {
      slot: EquipmentSlot;
      ac?: number;
      diceCount?: number;
      diceSides?: number;
      modifiers?: Partial<Attributes>;
      properties?: string[];
  }
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export enum AIBehavior {
  BASIC_MELEE = 'BASIC_MELEE',
  AGRESSIVE_BEAST = 'AGRESSIVE_BEAST',
  SPELLCASTER = 'SPELLCASTER',
  DEFENSIVE = 'DEFENSIVE'
}

// INSTANCE SCHEMA: Runtime Objects
export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'ENEMY' | 'NPC';
  equipment: Partial<Record<EquipmentSlot, Item>>; 
  aiBehavior?: AIBehavior;
  // If it's an enemy, we might link back to its definition
  defId?: string;
}

export interface OverworldEntity {
    id: string;
    defId: string;
    q: number;
    r: number;
    dimension: Dimension;
    sprite: string;
    name: string;
    visionRange: number;
}

export interface PositionComponent {
  x: number;
  y: number;
  z?: number;
}

export interface CombatStatsComponent {
  level: number;
  class: CharacterClass;
  race?: CharacterRace;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  ac: number;
  initiativeBonus: number;
  speed: number;
  attributes: Attributes;
  baseAttributes: Attributes;
  spellSlots: {
      current: number;
      max: number;
  };
}

export interface VisualComponent {
  spriteUrl?: string;
  color: string;
  modelType: 'billboard' | 'voxel';
}

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  isExplored: boolean;
  isVisible: boolean;
  hasEncounter?: boolean;
  hasPortal?: boolean;
  weather: WeatherType;
  poiType?: 'SHOP' | 'INN' | 'PLAZA' | 'EXIT';
}

export interface BattleCell {
  x: number;
  z: number;
  height: number;
  offsetY: number;
  color: string;
  textureUrl: string;
  isObstacle: boolean;
}

export interface LootDrop {
    id: string;
    position: PositionComponent;
    items: Item[];
    gold: number;
    rarity: ItemRarity;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  type: 'MAIN' | 'SIDE';
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'narrative' | 'roll' | 'levelup' | 'loot';
  timestamp: number;
}

export interface DamagePopup {
  id: string;
  position: [number, number, number];
  amount: string | number;
  color: string;
  isCrit: boolean;
  icon?: string; 
  timestamp: number;
}

export interface SpellEffectData {
  id: string;
  type: 'PROJECTILE' | 'BEAM' | 'BURST';
  startPos: [number, number, number];
  endPos: [number, number, number];
  color: string;
  duration: number; 
  timestamp: number;
  variant?: 'PROJECTILE' | 'BEAM' | 'BURST';
  projectileSprite?: string; 
  animationKey?: string; 
  textureUrl?: string; 
}

export interface GameStateData {
    gameState: GameState;
    dimension: Dimension;
    difficulty: Difficulty;
    exploredTiles: Record<Dimension, Set<string>>;
    visitedTowns: Record<string, boolean>; 
    clearedEncounters: Set<string>;
    activeOverworldEnemies: OverworldEntity[];
    townMapData: HexCell[] | null;
    playerPos: PositionComponent;
    isPlayerMoving: boolean;
    lastOverworldPos: PositionComponent | null;
    mapDimensions: { width: number; height: number };
    gracePeriodEndTime: number;
    party: (Entity & { stats: CombatStatsComponent, visual: VisualComponent })[];
    inventory: InventorySlot[];
    isInventoryOpen: boolean;
    isMapOpen: boolean;
    activeInventoryCharacterId: string | null; 
    battleEntities: (Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent })[];
    turnOrder: string[];
    currentTurnIndex: number;
    battleTerrain: TerrainType;
    battleWeather: WeatherType;
    battleRewards: { xp: number, gold: number, items: Item[] };
    battleMap: BattleCell[]; 
    lootDrops: LootDrop[];
    selectedAction: BattleAction | null;
    selectedSpell: Spell | null;
    hasMoved: boolean;
    hasActed: boolean;
    selectedTile: { x: number, z: number } | null;
    hoveredEntity: Entity | null;
    standingOnPortal: boolean;
    standingOnSettlement: boolean;
    runAvailable: boolean;
    logs: GameLogEntry[];
    damagePopups: DamagePopup[];
    activeSpellEffect: SpellEffectData | null;
    isActionAnimating: boolean;
    isSkillSelectionMode: boolean; 
    quests: Quest[];
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

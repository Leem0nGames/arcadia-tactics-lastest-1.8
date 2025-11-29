import { StateCreator } from 'zustand';
import { GameState, TerrainType, WeatherType, BattleCell, BattleAction, Spell, Entity, CombatStatsComponent, PositionComponent, DamagePopup, SpellEffectData, SpellType, CharacterClass, VisualComponent, AIBehavior, LootDrop, ItemRarity, Item, EquipmentSlot, Dimension } from '../../types';
import { findBattlePath } from '../../services/pathfinding';
import { rollD20, rollDice, checkLineOfSight, calculateAttackRoll, calculateDamage, calculateEnemyStats } from '../../services/dndRules';
import { dropLoot } from '../../services/lootTables';
import { sfx } from '../../services/SoundSystem';
import { ASSETS, BASE_STATS, BATTLE_MAP_SIZE, TERRAIN_COLORS, DIFFICULTY_SETTINGS, ITEMS } from '../../constants';
import { useContentStore } from '../contentStore';
import { GameStore, useGameStore } from '../gameStore';

const generateId = () => Math.random().toString(36).substr(2, 9);

export interface BattleSlice {
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
  runAvailable: boolean;
  damagePopups: DamagePopup[];
  activeSpellEffect: SpellEffectData | null;
  isActionAnimating: boolean;
  isSkillSelectionMode: boolean;

  startBattle: (terrain: TerrainType, weather: WeatherType, enemyId?: string) => void;
  selectAction: (action: BattleAction | null) => void;
  selectSpell: (spellId: string) => void;
  setSkillSelectionMode: (enabled: boolean) => void;
  handleTileHover: (x: number, z: number) => void;
  handleTileInteraction: (x: number, z: number) => void;
  collectLoot: (dropId: string) => void;
  nextTurn: () => void;
  attemptRun: () => void;
  restartBattle: () => void;
  continueAfterVictory: () => void;
  hasLineOfSight: (source: PositionComponent, target: PositionComponent) => boolean;
  getAttackPrediction: () => any | null;
}

// --- HELPERS ---
const generateBattleGrid = (terrainType: TerrainType): BattleCell[] => {
    const size = BATTLE_MAP_SIZE;
    const grid: BattleCell[] = [];
    const color = TERRAIN_COLORS[terrainType];
    let floorTex = ASSETS.BLOCK_TEXTURES[terrainType] || ASSETS.BLOCK_TEXTURES[TerrainType.GRASS]!;
    let wallTex = ASSETS.BLOCK_TEXTURES[TerrainType.MOUNTAIN]!; 
    let fluidTex = ASSETS.BLOCK_TEXTURES[TerrainType.WATER]!;
    if (terrainType === TerrainType.DESERT) wallTex = ASSETS.BLOCK_TEXTURES[TerrainType.DESERT]!;
    if (terrainType === TerrainType.CASTLE || terrainType === TerrainType.RUINS) { floorTex = ASSETS.BLOCK_TEXTURES[TerrainType.STONE_FLOOR]!; wallTex = ASSETS.BLOCK_TEXTURES[TerrainType.CASTLE]!; }
    if (terrainType === TerrainType.LAVA || terrainType === TerrainType.CHASM) fluidTex = ASSETS.BLOCK_TEXTURES[TerrainType.LAVA]!;
    if (terrainType === TerrainType.SWAMP) wallTex = ASSETS.BLOCK_TEXTURES[TerrainType.SWAMP]!;
    if (terrainType === TerrainType.VILLAGE) { floorTex = ASSETS.BLOCK_TEXTURES[TerrainType.GRASS]!; wallTex = ASSETS.BLOCK_TEXTURES[TerrainType.VILLAGE]!; }
    if (terrainType === TerrainType.COBBLESTONE) floorTex = ASSETS.BLOCK_TEXTURES[TerrainType.COBBLESTONE]!;
    const noise = (x: number, z: number, freq: number = 0.5) => Math.sin(x * freq) + Math.cos(z * freq) + Math.sin((x + z) * freq * 0.5);
    const random = (x: number, z: number) => Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    for(let x = 0; x < size; x++) {
        for(let z = 0; z < size; z++) {
            let height = 1; let offsetY = 0; let textureUrl = floorTex; let isObstacle = false;
            const distToEdge = Math.min(x, z, size - 1 - x, size - 1 - z); const isSpawnZone = (z < 2) || (z > size - 3);
            if ([TerrainType.MOUNTAIN, TerrainType.DESERT, TerrainType.TAIGA].includes(terrainType)) { const n = noise(x, z, 0.4); if (n > 0.2) height = 2; if (n > 1.0 && !isSpawnZone) { height = 3; if (terrainType === TerrainType.MOUNTAIN || n > 1.5) { isObstacle = true; textureUrl = wallTex; } } if (!isSpawnZone && random(x, z) > 0.95) { height = 2; textureUrl = wallTex; isObstacle = true; } } 
            else if ([TerrainType.FOREST, TerrainType.JUNGLE, TerrainType.SWAMP].includes(terrainType)) { const riverCenter = (size/2) + Math.sin(x * 0.3) * 3 + Math.cos(x * 0.8); const width = terrainType === TerrainType.SWAMP ? 4.5 : 2.5; const distRiver = Math.abs(z - riverCenter); if (distRiver < width/2) { height = 0.8; textureUrl = fluidTex; isObstacle = true; if (terrainType === TerrainType.SWAMP && random(x, z) > 0.7) { height = 1; textureUrl = floorTex; isObstacle = false; } } else { if (!isSpawnZone && random(x, z) > 0.85) { height = 2; textureUrl = wallTex; isObstacle = true; } } }
            else if ([TerrainType.RUINS, TerrainType.CASTLE, TerrainType.CHASM].includes(terrainType)) { const n = noise(x, z, 0.6); if ((x % 2 === 0 || z % 2 === 0) && n > 0.2 && !isSpawnZone) { if (random(x, z) > 0.4) { height = 2; textureUrl = wallTex; isObstacle = true; } else { height = 1; } } if (random(x, z) > 0.97 && !isSpawnZone) { height = 3; textureUrl = wallTex; isObstacle = true; } }
            else if ([TerrainType.VILLAGE, TerrainType.COBBLESTONE, TerrainType.DIRT_ROAD].includes(terrainType)) { const roadX = Math.floor(size/2); const roadZ = Math.floor(size/2); if (Math.abs(x - roadX) <= 1 || Math.abs(z - roadZ) <= 1) { textureUrl = ASSETS.BLOCK_TEXTURES[TerrainType.DIRT_ROAD] || floorTex; } else { if ((x % 4 === 0 && z % 4 === 0) && !isSpawnZone) { height = 2; isObstacle = true; textureUrl = wallTex; } else if (random(x, z) > 0.95 && !isSpawnZone) { height = 2; textureUrl = wallTex; isObstacle = true; } } }
            else if ([TerrainType.CAVE_FLOOR, TerrainType.FUNGUS, TerrainType.LAVA].includes(terrainType)) { const n = noise(x, z, 0.5); if (n > 1.2 && !isSpawnZone) { height = 3; isObstacle = true; textureUrl = wallTex; } if (terrainType === TerrainType.LAVA && n < -0.8 && !isSpawnZone) { height = 0.8; textureUrl = fluidTex; isObstacle = true; } }
            else { if (!isSpawnZone && random(x, z) > 0.96) { height = 2; isObstacle = true; textureUrl = wallTex; } }
            if (distToEdge === 0) { height = 4; isObstacle = true; textureUrl = wallTex; } if (isSpawnZone) { isObstacle = false; if (height > 1.5) height = 1; if (textureUrl === fluidTex) { height = 1; textureUrl = floorTex; } } grid.push({ x, z, height, offsetY, color, textureUrl, isObstacle });
        }
    }
    return grid;
};

const getUnitHeight = (entity: Entity & { stats: CombatStatsComponent, position: PositionComponent }, map: BattleCell[]) => { const cell = map.find(c => c.x === entity.position.x && c.z === entity.position.y); return cell ? (cell.offsetY || 0) + cell.height : 1; };

const applyDamage = (store: GameStore, targetId: string, amount: number, isCrit = false) => {
    const target = store.battleEntities.find((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => e.id === targetId);
    if (!target) return;
    
    const newPopups = [...store.damagePopups, { id: generateId(), position: [target.position.x, 0, target.position.y] as [number, number, number], amount: isCrit ? `${amount}!` : amount, color: isCrit ? '#fbbf24' : '#ef4444', isCrit, timestamp: Date.now() }];
    const newEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent }) => e.id === targetId ? { ...e, stats: { ...e.stats, hp: Math.max(0, e.stats.hp - amount) } } : e);
    
    let nextState = { ...store, gameState: store.gameState, lootDrops: store.lootDrops || [], battleRewards: store.battleRewards };
    
    if (newEntities.find((e: Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent }) => e.id === targetId)?.stats.hp === 0) {
        store.addLog(`${target.name} defeated!`, "narrative");
        
            if (target.type === 'ENEMY') {
            // Use scaled loot tables to generate items and gold
            try {
                const avgPartyLevel = Math.max(1, Math.floor(store.party.reduce((sum, p) => sum + p.stats.level, 0) / Math.max(1, store.party.length)));
                const loot = dropLoot(store.battleTerrain, avgPartyLevel, store.difficulty);
                if (loot.items.length > 0 || loot.gold > 0) {
                    const newDrop: LootDrop = { id: generateId(), position: { ...target.position }, gold: loot.gold, items: loot.items, rarity: loot.rarity };
                    nextState.lootDrops = [...nextState.lootDrops, newDrop];
                    store.addLog('A loot bag drops to the ground.', 'loot');
                }
            } catch (e) {
                console.error('Loot generation failed', e);
            }
        }

        // VICTORY CHECK
        if (!newEntities.some((e: Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent }) => e.type === 'ENEMY' && e.stats.hp > 0)) {
             const allGold = nextState.lootDrops.reduce((sum: number, drop: LootDrop) => sum + drop.gold, nextState.battleRewards.gold);
             const allItems = nextState.lootDrops.reduce((list: Item[], drop: LootDrop) => [...list, ...drop.items], nextState.battleRewards.items);
             
             nextState.battleRewards = { ...nextState.battleRewards, gold: allGold, items: allItems };
             nextState.lootDrops = []; 
             setTimeout(() => store.setGameState(GameState.BATTLE_VICTORY), 1500);
        } else if (!newEntities.some((e: Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent }) => e.type === 'PLAYER' && e.stats.hp > 0)) { 
             setTimeout(() => store.setGameState(GameState.BATTLE_DEFEAT), 1500); 
        }
    }
    
    return nextState;
};

const STAT_COSTS = { ATTACK: 3, RUN: 5, MAGIC: 2, LOOT: 2 };

const performEnemyAction = (store: GameStore, enemy: Entity & { stats: CombatStatsComponent, position: PositionComponent }, targets: (Entity & { stats: CombatStatsComponent, position: PositionComponent })[], set: (state: Partial<BattleSlice>) => void) => {
    const aiBehavior = enemy.aiBehavior || AIBehavior.BASIC_MELEE;
    let newState = {};

    // --- TACTICAL DECISIONS ---
    // 1. Check if low HP → Flee or Heal
    const hpPercent = enemy.stats.hp / enemy.stats.maxHp;
    if (hpPercent < 0.25 && aiBehavior === AIBehavior.SPELLCASTER && enemy.stats.spellSlots.current > 0) {
        // Try to heal self or retreat
        store.addLog(`${enemy.name} casts Cure Wounds on self!`, "combat");
        sfx.playMagic();
        
        const healAmount = rollDice(8, 1) + 3; // 1d8 + 3
        const newEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => 
            e.id === enemy.id 
                ? { ...e, stats: { ...e.stats, hp: Math.min(e.stats.maxHp, e.stats.hp + healAmount), spellSlots: { ...e.stats.spellSlots, current: e.stats.spellSlots.current - 1 } } } 
                : e
        );
        return { battleEntities: newEntities };
    }

    // 2. Smart Target Selection: Pick the most damaged player or highest threat
    let target = targets[0];
    let bestScore = -999;
    targets.forEach(p => {
        const dmgTaken = p.stats.maxHp - p.stats.hp;
        const threat = dmgTaken + (p.stats.ac < 12 ? 5 : 0); // Prioritize low AC
        if (threat > bestScore) {
            bestScore = threat;
            target = p;
        }
    });

    const dist = Math.abs(enemy.position.x - target.position.x) + Math.abs(enemy.position.y - target.position.y);

    // --- SPELL CASTING (Multiple spells per behavior) ---
    if (aiBehavior === AIBehavior.SPELLCASTER && enemy.stats.spellSlots.current > 0) {
        // Spell selection: Damage if enemy far, Heal if ally hurt, Buff if needed
        const allyHurt = store.battleEntities.find((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => e.type === 'ENEMY' && e.stats.hp < e.stats.maxHp * 0.5 && e.id !== enemy.id);
        
        let spellName = 'Fire Bolt';
        let dmg = rollDice(10, 1) + 2;
        let spellColor = '#ef4444';
        let projectile = ASSETS.PROJECTILES.FIREBALL;

        if (dist > 6) {
            // Out of range, move closer
        } else if (dist > 1 && enemy.stats.spellSlots.current > 0) {
            // Choose spell based on situation
            if (allyHurt && Math.random() > 0.6) {
                spellName = 'Cure Wounds';
                const healTarget = allyHurt;
                store.addLog(`${enemy.name} casts ${spellName}!`, "combat");
                sfx.playMagic();
                
                const healAmount = rollDice(8, 1) + 3;
                const newEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) =>
                    e.id === allyHurt.id
                        ? { ...e, stats: { ...e.stats, hp: Math.min(e.stats.maxHp, e.stats.hp + healAmount) } }
                        : (e.id === enemy.id ? { ...e, stats: { ...e.stats, spellSlots: { ...e.stats.spellSlots, current: e.stats.spellSlots.current - 1 } } } : e)
                );
                return { battleEntities: newEntities };
            } else if (target.stats.hp > 20 && Math.random() > 0.7) {
                spellName = 'Fireball';
                dmg = rollDice(8, 3) + 2; // 3d8 + 2
                spellColor = '#f97316';
                projectile = ASSETS.PROJECTILES.FIREBALL;
            } else {
                spellName = 'Magic Missile';
                dmg = rollDice(4, 3) + 1; // 3d4 + 1
                spellColor = '#06b6d4';
                projectile = ASSETS.PROJECTILES.MAGIC_MISSILE;
            }

            store.addLog(`${enemy.name} casts ${spellName}!`, "combat");
            sfx.playMagic();
            
            const effect: SpellEffectData = {
                id: generateId(),
                type: 'PROJECTILE',
                startPos: [enemy.position.x, 1.5, enemy.position.y],
                endPos: [target.position.x, 1.0, target.position.y],
                color: spellColor,
                duration: 800,
                timestamp: Date.now(),
                projectileSprite: projectile
            };
            set({ activeSpellEffect: effect });
            setTimeout(() => set({ activeSpellEffect: null }), 1000);

            let updatedEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) =>
                e.id === enemy.id
                    ? { ...e, stats: { ...e.stats, spellSlots: { ...e.stats.spellSlots, current: e.stats.spellSlots.current - 1 } } }
                    : e
            );

            const roll = rollD20();
            if (roll.result + 5 >= target.stats.ac) {
                const res = applyDamage({ ...store, battleEntities: updatedEntities }, target.id, dmg);
                if (res) newState = res;
                else newState = { battleEntities: updatedEntities };
            } else {
                store.addLog("Spell fizzled.", "combat");
                newState = { battleEntities: updatedEntities };
            }
            return newState;
        }
    }

    // --- MELEE LOGIC ---
    if (dist <= 1) {
        sfx.playAttack();
        const hitRoll = rollD20();
        const hitMod = 4; // Basic enemy mod
        
        if (hitRoll.result === 20 || (hitRoll.result + hitMod) >= target.stats.ac) {
            const isCrit = hitRoll.result === 20;
            let dmg = rollDice(6, 1) + 2;
            if (isCrit) dmg += rollDice(6, 1);
            
            store.addLog(`${enemy.name} hits ${target.name} for ${dmg}.`, "combat");
            sfx.playHit();
            const res = applyDamage(store, target.id, dmg, isCrit);
            if (res) newState = res;
        } else {
            store.addLog("Enemy Miss.", "combat");
            const popups = [...store.damagePopups, { id: generateId(), position: [target.position.x, 0, target.position.y] as [number, number, number], amount: "MISS", color: '#94a3b8', isCrit: false, timestamp: Date.now() }];
            newState = { damagePopups: popups };
        }
    } else if (dist > 1 && dist <= 6) {
        // --- RANGED CHASE (Get closer if within range but not adjacent) ---
        const path = findBattlePath({x: enemy.position.x, y: enemy.position.y}, {x: target.position.x, y: target.position.y}, store.battleMap);
        if (path && path.length > 0) {
            sfx.playStep();
            const step = path[0];
            const updatedEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => e.id === enemy.id ? { ...e, position: { x: step.x, y: step.z } } : e);
            newState = { battleEntities: updatedEntities };
        }
    } else {
        // --- LONG RANGE CHASE ---
        const path = findBattlePath({x: enemy.position.x, y: enemy.position.y}, {x: target.position.x, y: target.position.y}, store.battleMap);
        if (path && path.length > 0) {
            sfx.playStep();
            const step = path[0];
            const updatedEntities = store.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => e.id === enemy.id ? { ...e, position: { x: step.x, y: step.z } } : e);
            newState = { battleEntities: updatedEntities };
        }
    }
    return newState;
};

const getEnemyBehavior = (id: string): AIBehavior => { if (id.includes('wolf')) return AIBehavior.AGRESSIVE_BEAST; if (id.includes('necromancer') || id.includes('adept') || id.includes('mage') || id.includes('sorcerer')) return AIBehavior.SPELLCASTER; return AIBehavior.BASIC_MELEE; };

export const createBattleSlice: StateCreator<GameStore, [], [], BattleSlice> = (set, get) => ({
  battleEntities: [],
  turnOrder: [],
  currentTurnIndex: 0,
  battleTerrain: TerrainType.GRASS,
  battleWeather: WeatherType.NONE,
  battleRewards: { xp: 0, gold: 0, items: [] },
  battleMap: [],
  lootDrops: [],
  selectedAction: null,
  selectedSpell: null,
  hasMoved: false,
  hasActed: false,
  selectedTile: null,
  hoveredEntity: null,
  runAvailable: false,
  damagePopups: [],
  activeSpellEffect: null,
  isActionAnimating: false,
  isSkillSelectionMode: false,

  startBattle: (terrain, weather, enemyId) => {
      const { party, dimension, difficulty, activeOverworldEnemies, clearedEncounters } = get(); if (party.length === 0) return; sfx.playUiClick(); 
      const isShadow = dimension === Dimension.UPSIDE_DOWN; 
      const { enemies, encounters } = useContentStore.getState();
      
      let finalEnemyList: string[] = [];
      if (enemyId) {
        const visibleEnemy = activeOverworldEnemies.find(e => e.id === enemyId);
        if (visibleEnemy) {
            finalEnemyList = [visibleEnemy.defId];
            const encounterKey = `${dimension}:${visibleEnemy.q},${visibleEnemy.r}`;
            const newCleared = new Set(clearedEncounters);
            newCleared.add(encounterKey);
            set({ clearedEncounters: newCleared, activeOverworldEnemies: activeOverworldEnemies.filter(e => e.id !== enemyId) });
        }
      } 
      if (finalEnemyList.length === 0) { const possibleEnemies = encounters[terrain] || encounters[TerrainType.GRASS] || Object.keys(enemies); finalEnemyList = possibleEnemies.length > 0 ? possibleEnemies : ['goblin_spearman']; }
      
      const enemyCount = isShadow ? 3 : Math.floor(Math.random() * 2) + 2;
      const getEnemySpawn = () => ({ x: Math.floor(Math.random() * (BATTLE_MAP_SIZE - 4)) + 2, y: Math.floor(Math.random() * 3) + 1 });
      const getPlayerSpawn = (i: number) => { const baseX = Math.floor(BATTLE_MAP_SIZE / 2); const baseZ = BATTLE_MAP_SIZE - 3; if (i === 0) return { x: baseX, y: baseZ }; if (i === 1) return { x: baseX - 2, y: baseZ + 1 }; if (i === 2) return { x: baseX + 2, y: baseZ + 1 }; return { x: baseX, y: baseZ + 2 }; };
      
      const battleMap = generateBattleGrid(terrain);
      const battleEntities: (Entity & { stats: CombatStatsComponent, position: PositionComponent, visual: VisualComponent })[] = [];
      
      // Players
      party.forEach((member, i) => { 
          const memberWithStats = get().recalculateStats(member); 
          if (memberWithStats.hp > 0) { 
              battleEntities.push({ ...member, stats: memberWithStats, position: getPlayerSpawn(i) }); 
          } 
      });
      
      // Enemies with New Scaling Logic
      for(let i=0; i<enemyCount; i++) { 
          const enemyDefId = finalEnemyList[Math.floor(Math.random() * finalEnemyList.length)];
          const enemyDef = enemies[enemyDefId] || Object.values(enemies)[0];
          
          // Calculate Enemy Stats using dndRules service
          const avgPartyLevel = Math.max(1, Math.floor(party.reduce((sum, p) => sum + p.stats.level, 0) / party.length));
          const scaledStats = calculateEnemyStats(enemyDef, avgPartyLevel, difficulty);

          const aiBehavior = getEnemyBehavior(enemyDefId);
          const startSlots = aiBehavior === AIBehavior.SPELLCASTER ? { current: 2, max: 2 } : { current: 0, max: 0 };

          battleEntities.push({
            id: 'enemy_' + generateId(), 
            name: `${enemyDef.name} ${i+1}`, 
            type: 'ENEMY', 
            equipment: {}, 
            aiBehavior: aiBehavior,
            stats: { 
                level: scaledStats.level, 
                xp: scaledStats.xpReward, 
                xpToNextLevel: 0, 
                hp: scaledStats.hp, 
                maxHp: scaledStats.hp, 
                stamina: 100, maxStamina: 100, 
                ac: scaledStats.ac, 
                initiativeBonus: enemyDef.initiativeBonus, 
                speed: 30, 
                attributes: BASE_STATS[CharacterClass.FIGHTER], // Placeholder attributes
                baseAttributes: BASE_STATS[CharacterClass.FIGHTER], 
                spellSlots: startSlots 
            },
            visual: { color: isShadow ? '#1e293b' : '#ef4444', modelType: 'billboard', spriteUrl: enemyDef.sprite }, 
            position: getEnemySpawn() 
         });
      }
      
      const initiativeOrder = battleEntities.map(e => ({ id: e.id, roll: rollD20().result + e.stats.initiativeBonus })).sort((a, b) => b.roll - a.roll).map(e => e.id);
      
      get().addLog(`Encounter! ${enemyCount} enemies.`, "combat");
      set({ 
          gameState: GameState.BATTLE_TACTICAL, 
          battleTerrain: terrain, 
          battleWeather: weather, 
          battleEntities, 
          turnOrder: initiativeOrder, 
          currentTurnIndex: 0, 
          hasMoved: false, 
          hasActed: false, 
          selectedAction: null, 
          selectedSpell: null, 
          selectedTile: null, 
          damagePopups: [], 
          activeSpellEffect: null, 
          battleRewards: { xp: 0, gold: 0, items: [] }, 
          battleMap, 
          runAvailable: true, 
          lootDrops: [], 
          isSkillSelectionMode: false 
      });
      
      const firstId = initiativeOrder[0];
      if (battleEntities.find(e => e.id === firstId)?.type === 'ENEMY') { 
          setTimeout(() => { get().nextTurn(); }, 1000); 
      } else { 
          set({ selectedAction: BattleAction.MOVE }); 
      }
  },

  // ... (Rest of the actions like selectAction, etc. maintained)

  handleTileInteraction: (x, z) => {
      const state = get(); 
      const activeId = state.turnOrder[state.currentTurnIndex]; 
      const activeEntity = state.battleEntities.find(e => e.id === activeId);
      if (!activeEntity || activeEntity.type !== 'PLAYER') return;
      if (!state.selectedTile || state.selectedTile.x !== x || state.selectedTile.z !== z) { sfx.playUiHover(); set({ selectedTile: { x, z } }); return; }
      const targetEnt = state.battleEntities.find(e => e.position.x === x && e.position.y === z);
      
      if (state.selectedAction === BattleAction.MOVE) {
          if (state.hasMoved) return;
          const dist = Math.max(Math.abs(activeEntity.position.x - x), Math.abs(activeEntity.position.y - z));
          if (dist > 6 || targetEnt) return;
          const cell = state.battleMap.find(c => c.x === x && c.z === z);
          if (cell?.isObstacle) return;
          sfx.playStep();
          set(s => ({ battleEntities: s.battleEntities.map(e => e.id === activeId ? { ...e, position: { x, y: z } } : e), hasMoved: true, selectedAction: null, selectedTile: null }));
      } 
      else if (state.selectedAction === BattleAction.ATTACK || state.selectedAction === BattleAction.MAGIC) {
          if (state.hasActed || !targetEnt) return;
          
          // LOS Check
          const hasLos = checkLineOfSight(activeEntity.position, targetEnt.position, state.battleMap);
          if (!hasLos) { state.addLog("Blocked by obstacle!", "info"); sfx.playUiHover(); return; }

          // Height Bonus
          const attackerH = getUnitHeight(activeEntity, state.battleMap);
          const targetH = getUnitHeight(targetEnt, state.battleMap);
          const heightBonus = attackerH > targetH + 0.5 ? 2 : 0;
          if (heightBonus) state.addLog("High Ground Advantage! (+2 Hit)", "info");

          // 1. MAGIC ATTACK
          if (state.selectedAction === BattleAction.MAGIC && state.selectedSpell) {
               const spell = state.selectedSpell;
               const isSelf = targetEnt.id === activeEntity.id;
               const isAlly = targetEnt.type === activeEntity.type; 
               if (spell.type === SpellType.HEAL || spell.type === SpellType.BUFF) { if (!isAlly && !isSelf) { state.addLog("Invalid target.", "info"); return; } } 
               else if (spell.type === SpellType.DAMAGE) { if (isAlly) { state.addLog("Cannot attack ally!", "info"); return; } }
               
               if (spell.level > 0 && activeEntity.stats.spellSlots.current < 1) { state.addLog("No slots!", "combat"); return; }

               const newSpellSlots = { ...activeEntity.stats.spellSlots };
               if (spell.level > 0) newSpellSlots.current = Math.max(0, newSpellSlots.current - 1);
               
               sfx.playMagic();
               set({ isActionAnimating: true, isSkillSelectionMode: false });
               state.addLog(`${activeEntity.name} casts ${spell.name}.`, "combat");
               
               // Visuals setup (Kept from previous implementation)
               let effectType: 'PROJECTILE' | 'BEAM' | 'BURST' = 'PROJECTILE';
               let color = '#f97316'; let textureUrl = undefined; let projectileSprite = undefined; let animationKey: string | undefined = undefined;
               if (spell.type === SpellType.HEAL) { effectType = 'BURST'; color = '#4ade80'; textureUrl = ASSETS.ANIMATIONS.HEAL; } 
               else if (spell.name.includes('Ice')) { effectType = 'BURST'; color = '#60a5fa'; } 
               else if (spell.name.includes('Lightning')) { effectType = 'BEAM'; color = '#c084fc'; animationKey = 'LIGHTNING'; } 
               else if (spell.name.includes('Magic Missile')) { effectType = 'PROJECTILE'; color = '#38bdf8'; projectileSprite = ASSETS.PROJECTILES.MAGIC_MISSILE; } 
               else if (spell.name.includes('Eldritch')) { effectType = 'BEAM'; color = '#a855f7'; textureUrl = ASSETS.ANIMATIONS.DARK_AURA; } 
               else if (spell.name.includes('Fire')) { animationKey = 'EXPLOSION'; projectileSprite = ASSETS.PROJECTILES.FIREBALL; }

               set({ activeSpellEffect: { id: generateId(), type: effectType, startPos: [activeEntity.position.x, 1.5, activeEntity.position.y], endPos: [targetEnt.position.x, 1.0, targetEnt.position.y], color, duration: 1000, timestamp: Date.now(), animationKey, projectileSprite } });
               setTimeout(() => set({ activeSpellEffect: null }), 1200);

               setTimeout(() => {
                   const amount = rollDice(spell.diceSides, spell.diceCount); 
                   if (spell.type === SpellType.HEAL) {
                        const popups = [...get().damagePopups, { id: generateId(), position: [targetEnt.position.x, 0, targetEnt.position.y] as [number, number, number], amount: `+${amount}`, color: '#22c55e', isCrit: false, timestamp: Date.now() }];
                        set(s => ({ battleEntities: s.battleEntities.map(e => { let ent = { ...e }; if (e.id === activeId) ent.stats = { ...ent.stats, spellSlots: newSpellSlots }; if (e.id === targetEnt.id) ent.stats = { ...ent.stats, hp: Math.min(ent.stats.maxHp, ent.stats.hp + amount) }; return ent; }), hasActed: true, selectedAction: null, damagePopups: popups, selectedSpell: null }));
                   } else {
                       const res = applyDamage(get(), targetEnt.id, amount);
                       if (res) { const updatedEntities = res.battleEntities.map((e: Entity & { stats: CombatStatsComponent, position: PositionComponent }) => { if (e.id === activeId) return { ...e, stats: { ...e.stats, spellSlots: newSpellSlots } }; return e; }); set({ ...res, battleEntities: updatedEntities }); }
                       set({ hasActed: true, selectedAction: null, selectedSpell: null });
                   }
                   set({ isActionAnimating: false });
               }, 600);

          // 2. PHYSICAL ATTACK (Updated with D&D Logic)
          } else {
               if (activeEntity.stats.stamina < STAT_COSTS.ATTACK) { state.addLog("Not enough stamina!", "combat"); sfx.playUiHover(); return; }
               const newStamina = activeEntity.stats.stamina - STAT_COSTS.ATTACK;
               set(s => ({ battleEntities: s.battleEntities.map(e => e.id === activeId ? { ...e, stats: { ...e.stats, stamina: newStamina } } : e) }));

               sfx.playAttack();
               set({ isActionAnimating: true });
               
               // CALCULATE HIT
               const attackRoll = calculateAttackRoll(activeEntity, EquipmentSlot.MAIN_HAND);
               const finalRoll = attackRoll.total + heightBonus;
               const hit = finalRoll >= targetEnt.stats.ac || attackRoll.isCrit;

               if ([CharacterClass.RANGER, CharacterClass.ROGUE].includes(activeEntity.stats.class)) {
                    set({ activeSpellEffect: { id: generateId(), type: 'PROJECTILE', startPos: [activeEntity.position.x, 1.5, activeEntity.position.y], endPos: [targetEnt.position.x, 1.0, targetEnt.position.y], color: '#fff', duration: 400, timestamp: Date.now(), projectileSprite: ASSETS.PROJECTILES.ARROW } });
                    setTimeout(() => set({ activeSpellEffect: null }), 500);
               }

               setTimeout(() => {
                   if (hit) { 
                      const dmg = calculateDamage(activeEntity, EquipmentSlot.MAIN_HAND, attackRoll.isCrit);
                      if (attackRoll.isCrit) state.addLog("Critical Hit!", "combat");
                      const res = applyDamage(get(), targetEnt.id, dmg, attackRoll.isCrit); 
                      if (res) set(res); 
                   } else { 
                      state.addLog("Miss!", "combat"); 
                      const popups = [...get().damagePopups, { id: generateId(), position: [targetEnt.position.x, 0, targetEnt.position.y] as [number, number, number], amount: "MISS", color: '#94a3b8', isCrit: false, timestamp: Date.now() }]; 
                      set({ damagePopups: popups }); 
                   }
                   set({ hasActed: true, selectedAction: null, isActionAnimating: false });
               }, 500);
          }
          set({ selectedTile: null });
      }
  },

  selectAction: (action) => { sfx.playUiClick(); if (action === BattleAction.WAIT) get().nextTurn(); else if (action === BattleAction.ITEM) get().toggleInventory(); else if (action === BattleAction.RUN) get().attemptRun(); else set({ selectedAction: action, selectedTile: null, selectedSpell: null }); },
  selectSpell: (spellId) => { sfx.playUiClick(); import('../../constants').then(c => set({ selectedSpell: c.SPELLS[spellId.toUpperCase()], selectedTile: null })); get().addLog("Spell selected.", "info"); },
  setSkillSelectionMode: (enabled) => set({ isSkillSelectionMode: enabled }),
  handleTileHover: (x, z) => { set({ hoveredEntity: get().battleEntities.find(e => e.position.x === x && e.position.y === z) || null }); },
  collectLoot: (dropId) => { 
    const state = get(); 
    const activeId = state.turnOrder[state.currentTurnIndex]; 
    const activeEntity = state.battleEntities.find(e => e.id === activeId); 
    if (!activeEntity || activeEntity.type !== 'PLAYER' || state.hasActed) return; 
    if (activeEntity.stats.stamina < STAT_COSTS.LOOT) { state.addLog("Too tired.", "info"); return; } 
    const dropIndex = state.lootDrops.findIndex(d => d.id === dropId); 
    if (dropIndex === -1) return; 
    const drop = state.lootDrops[dropIndex]; 
    if (activeEntity.position.x !== drop.position.x || activeEntity.position.y !== drop.position.y) return; 
    sfx.playUiClick(); 
    const currentRewards = state.battleRewards; 
    const newRewards = { ...currentRewards, gold: currentRewards.gold + drop.gold, items: [...currentRewards.items, ...drop.items] }; 
    const newInventory = [...state.inventory]; 
    drop.items.forEach(item => { const existingSlot = newInventory.find(s => s.item.id === item.id); if (existingSlot) existingSlot.quantity++; else newInventory.push({ item, quantity: 1 }); }); 
    const newDrops = [...state.lootDrops]; 
    newDrops.splice(dropIndex, 1); 
    const newStamina = activeEntity.stats.stamina - STAT_COSTS.LOOT; 
    const updatedEntities = state.battleEntities.map(e => e.id === activeId ? { ...e, stats: { ...e.stats, stamina: newStamina } } : e); 
    const popups = [...state.damagePopups, { id: generateId(), position: [drop.position.x, 0, drop.position.y] as [number, number, number], amount: `+${drop.gold}G`, color: '#facc15', isCrit: false, timestamp: Date.now() }]; 
    set({ lootDrops: newDrops, battleRewards: newRewards, inventory: newInventory, battleEntities: updatedEntities, hasActed: true, damagePopups: popups }); 
    state.addLog(`${activeEntity.name} looted ${drop.gold}g.`, "loot"); 
  },
  nextTurn: () => { const state = get(); if (state.gameState !== GameState.BATTLE_TACTICAL) return; let nextIdx = (state.currentTurnIndex + 1) % state.turnOrder.length; let nextEntity = state.battleEntities.find(e => e.id === state.turnOrder[nextIdx]); if (!nextEntity || nextEntity.stats.hp <= 0) { for(let i=0; i<10; i++) { nextIdx = (nextIdx + 1) % state.turnOrder.length; nextEntity = state.battleEntities.find(e => e.id === state.turnOrder[nextIdx]); if (nextEntity && nextEntity.stats.hp > 0) break; } } if (!nextEntity) return; const REGEN_FLAT = 2; const maxStamina = nextEntity.stats.maxStamina || 10; const currentStamina = nextEntity.stats.stamina || 0; const regenAmount = Math.floor(maxStamina * 0.1) + REGEN_FLAT; const newStamina = Math.min(maxStamina, currentStamina + regenAmount); let newPopups = state.damagePopups; if (nextEntity.type === 'PLAYER' && newStamina > currentStamina) { const recovered = newStamina - currentStamina; newPopups = [...state.damagePopups, { id: generateId(), position: [nextEntity.position.x, 0, nextEntity.position.y], amount: `+${recovered} ⚡`, color: '#facc15', isCrit: false, timestamp: Date.now() }]; } const updatedEntities = state.battleEntities.map(e => e.id === nextEntity!.id ? { ...e, stats: { ...e.stats, stamina: newStamina } } : e); set({ battleEntities: updatedEntities, currentTurnIndex: nextIdx, selectedTile: null, hasMoved: false, hasActed: false, selectedAction: nextEntity.type === 'PLAYER' ? BattleAction.MOVE : null, selectedSpell: null, hoveredEntity: null, activeSpellEffect: null, damagePopups: newPopups }); if (nextEntity.type === 'PLAYER') { get().addLog(`${nextEntity.name}'s turn.`, "info"); } else { setTimeout(() => { const currentState = get(); if (currentState.gameState !== GameState.BATTLE_TACTICAL) return; const me = currentState.battleEntities.find(e => e.id === nextEntity!.id); const targets = currentState.battleEntities.filter(e => e.type === 'PLAYER' && e.stats.hp > 0); if (!me || me.stats.hp <= 0 || targets.length === 0) { currentState.nextTurn(); return; } const updates = performEnemyAction(currentState, me, targets, set); if (updates) set(updates); setTimeout(() => get().nextTurn(), 1000); }, 800); } },
  attemptRun: () => { const state = get(); const activeId = state.turnOrder[state.currentTurnIndex]; const activeEntity = state.battleEntities.find(e => e.id === activeId); if (activeEntity && activeEntity.stats.stamina < STAT_COSTS.RUN) { state.addLog("Too exhausted!", "combat"); return; } if (activeEntity) { const newStamina = activeEntity.stats.stamina - STAT_COSTS.RUN; set(s => ({ battleEntities: s.battleEntities.map(e => e.id === activeId ? { ...e, stats: { ...e.stats, stamina: newStamina } } : e) })); } const hpFactor = (activeEntity?.stats.hp || 1) / (activeEntity?.stats.maxHp || 1); const escapeChance = Math.min(0.95, Math.max(0.2, 0.5 + (hpFactor * 0.2))); if (Math.random() < escapeChance) { get().addLog("Escaped!", "narrative"); set({ gameState: GameState.OVERWORLD, damagePopups: [], gracePeriodEndTime: Date.now() + 5000 }); } else { get().addLog("Failed escape!", "combat"); get().nextTurn(); } },
  restartBattle: () => { sfx.playUiClick(); get().startBattle(get().battleTerrain, get().battleWeather); },
  continueAfterVictory: () => { 
    sfx.playUiClick(); 
    const { party, battleRewards, inventory } = get(); 
    const newParty = party.map(m => m.stats.hp <= 0 ? m : { ...m, stats: { ...m.stats, xp: m.stats.xp + battleRewards.xp } }); 
    const newInventory = [...inventory]; 
    battleRewards.items.forEach(item => { 
      const existingSlot = newInventory.find(s => s.item.id === item.id); 
      if (existingSlot) existingSlot.quantity++; 
      else newInventory.push({ item, quantity: 1 }); 
    }); 
    set({ party: newParty, gameState: GameState.OVERWORLD, damagePopups: [], gracePeriodEndTime: Date.now() + 3000, inventory: newInventory, lootDrops: [] });
    
    // ✅ NEW: Check for level ups and trigger level up party
    setTimeout(() => {
      const currentState = get();
      const leveledUpMembers = currentState.party.filter(m => m.stats.xp >= m.stats.xpToNextLevel);
      if (leveledUpMembers.length > 0) {
        get().levelUpParty();
        get().addLog(`${leveledUpMembers.map(m => m.name).join(', ')} leveled up!`, 'levelup');
      }
    }, 500);
  },
  hasLineOfSight: (source, target) => checkLineOfSight(source, target, get().battleMap),
  getAttackPrediction: () => null
});


import { StateCreator } from 'zustand';
import { CharacterRace, CharacterClass, Attributes, Difficulty, EquipmentSlot, Item, Ability, Entity, CombatStatsComponent, VisualComponent, Dimension, GameState } from '../../types';
import { calculateHp, getModifier, calculateVisionRange } from '../../services/dndRules';
import { BASE_STATS, RACE_BONUS, XP_TABLE, ITEMS, getSprite } from '../../constants';
import { sfx } from '../../services/SoundSystem';
import { GameStore } from '../gameStore';

export interface PlayerSlice {
  party: (Entity & { stats: CombatStatsComponent, visual: VisualComponent })[];
  createCharacter: (name: string, race: CharacterRace, cls: CharacterClass, stats: Attributes, difficulty: Difficulty) => void;
  recalculateStats: (entity: Entity & { stats: CombatStatsComponent }) => CombatStatsComponent;
  levelUpParty: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getCasterSlots = (cls: CharacterClass, level: number) => {
    if ([CharacterClass.WIZARD, CharacterClass.CLERIC, CharacterClass.DRUID, CharacterClass.SORCERER, CharacterClass.BARD].includes(cls)) return { current: 2, max: 2 };
    if (cls === CharacterClass.WARLOCK) return { current: 1, max: 1 };
    return { current: 0, max: 0 };
}

const getHitDie = (cls: CharacterClass) => {
    if (cls === CharacterClass.BARBARIAN) return 12;
    if ([CharacterClass.FIGHTER, CharacterClass.PALADIN, CharacterClass.RANGER].includes(cls)) return 10;
    if ([CharacterClass.WIZARD, CharacterClass.SORCERER].includes(cls)) return 6;
    return 8; 
}

const calculateMaxStamina = (con: number, level: number) => {
    // Base 10 + Con Mod. Grows slowly with levels.
    return 10 + getModifier(con) + Math.floor(level / 2);
}

const generateCompanion = (name: string, race: CharacterRace, cls: CharacterClass, level: number): (Entity & { stats: CombatStatsComponent, visual: VisualComponent }) => {
    const baseStats = { ...BASE_STATS[cls] };
    const bonus = RACE_BONUS[race];
    (Object.keys(baseStats) as Ability[]).forEach(k => { if (bonus[k]) baseStats[k] += bonus[k]!; });
    const maxHp = calculateHp(level, baseStats.CON, getHitDie(cls));
    const maxStamina = calculateMaxStamina(baseStats.CON, level);
    
    const equipment: Partial<Record<EquipmentSlot, Item>> = {};
    if (cls === CharacterClass.FIGHTER || cls === CharacterClass.PALADIN) { equipment[EquipmentSlot.MAIN_HAND] = ITEMS.LONGSWORD; equipment[EquipmentSlot.BODY] = ITEMS.CHAIN_MAIL; equipment[EquipmentSlot.OFF_HAND] = ITEMS.SHIELD; } 
    else if (cls === CharacterClass.BARBARIAN) { equipment[EquipmentSlot.MAIN_HAND] = ITEMS.GREATAXE; } 
    else if (cls === CharacterClass.ROGUE) { equipment[EquipmentSlot.MAIN_HAND] = ITEMS.DAGGER; equipment[EquipmentSlot.BODY] = ITEMS.LEATHER_ARMOR; } 
    else if (cls === CharacterClass.CLERIC) { equipment[EquipmentSlot.MAIN_HAND] = ITEMS.MACE; equipment[EquipmentSlot.BODY] = ITEMS.CHAIN_SHIRT; equipment[EquipmentSlot.OFF_HAND] = ITEMS.SHIELD; } 
    else { equipment[EquipmentSlot.MAIN_HAND] = ITEMS.QUARTERSTAFF; }

    return {
        id: `comp_${generateId()}`, name, type: 'PLAYER' as const, equipment,
        stats: { level, class: cls, race, xp: 0, xpToNextLevel: XP_TABLE[level] || 999999, hp: maxHp, maxHp, stamina: maxStamina, maxStamina, ac: 10, initiativeBonus: getModifier(baseStats.DEX), speed: 30, attributes: baseStats, baseAttributes: { ...baseStats }, spellSlots: getCasterSlots(cls, level) },
        visual: { color: '#3b82f6', modelType: 'billboard' as const, spriteUrl: getSprite(race, cls) }
    };
};

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set, get) => ({
  party: [],

  createCharacter: (name, race, cls, stats, difficulty) => {
        console.log('[debug] createCharacter start', { name, race, cls, stats, difficulty });
        try { sfx.playVictory(); } catch(e) { console.warn('sfx.playVictory failed', e); }
    const maxHp = calculateHp(1, stats.CON, getHitDie(cls));
    const maxStamina = calculateMaxStamina(stats.CON, 1);
    const startSlots = getCasterSlots(cls, 1);
    let spriteUrl = getSprite(race, cls);
    const equipment: Partial<Record<EquipmentSlot, Item>> = {};
    const inventory = [{ item: ITEMS.POTION_HEALING, quantity: 3 }, { item: ITEMS.RATION, quantity: 5 }];

    switch (cls) {
        case CharacterClass.FIGHTER: case CharacterClass.PALADIN: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.LONGSWORD; equipment[EquipmentSlot.BODY] = ITEMS.CHAIN_MAIL; equipment[EquipmentSlot.OFF_HAND] = ITEMS.SHIELD; break;
        case CharacterClass.BARBARIAN: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.GREATAXE; break;
        case CharacterClass.RANGER: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.SHORTSWORD; equipment[EquipmentSlot.OFF_HAND] = ITEMS.DAGGER; equipment[EquipmentSlot.BODY] = ITEMS.LEATHER_ARMOR; break;
        case CharacterClass.ROGUE: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.DAGGER; equipment[EquipmentSlot.BODY] = ITEMS.LEATHER_ARMOR; break;
        case CharacterClass.CLERIC: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.MACE; equipment[EquipmentSlot.BODY] = ITEMS.CHAIN_SHIRT; equipment[EquipmentSlot.OFF_HAND] = ITEMS.SHIELD; inventory.push({ item: ITEMS.POTION_MANA, quantity: 1 }); break;
        default: equipment[EquipmentSlot.MAIN_HAND] = ITEMS.QUARTERSTAFF; inventory.push({ item: ITEMS.POTION_MANA, quantity: 2 });
    }

    const leader = { id: 'player_leader', name, type: 'PLAYER' as const, equipment, stats: { level: 1, class: cls, race, xp: 0, xpToNextLevel: XP_TABLE[1] || 300, hp: maxHp, maxHp, stamina: maxStamina, maxStamina, ac: 10, initiativeBonus: Math.floor((stats.DEX - 10) / 2), speed: 30, attributes: stats, baseAttributes: { ...stats }, spellSlots: startSlots }, visual: { color: '#3b82f6', modelType: 'billboard' as const, spriteUrl } };
    const companions = [];
    const isTank = [CharacterClass.FIGHTER, CharacterClass.BARBARIAN, CharacterClass.PALADIN].includes(cls);
    const isHealer = [CharacterClass.CLERIC, CharacterClass.DRUID].includes(cls);
    if (isTank) { companions.push(generateCompanion("Elara", CharacterRace.HUMAN, CharacterClass.CLERIC, 1)); companions.push(generateCompanion("Zan", CharacterRace.ELF, CharacterClass.WIZARD, 1)); }
    else if (isHealer) { companions.push(generateCompanion("Thrumgar", CharacterRace.DWARF, CharacterClass.FIGHTER, 1)); companions.push(generateCompanion("Vex", CharacterRace.HUMAN, CharacterClass.ROGUE, 1)); }
    else { companions.push(generateCompanion("Kael", CharacterRace.HUMAN, CharacterClass.PALADIN, 1)); companions.push(generateCompanion("Lira", CharacterRace.ELF, CharacterClass.DRUID, 1)); }

    const party = [leader, ...companions].map(p => ({ ...p, stats: get().recalculateStats(p) }));
    
    // Initial Exploration and Vision
    // We calculate this upfront to ensure the map isn't black initially
    const exploredNormal = new Set<string>();
    const startX = 0; 
    const startY = 0;
    const visionRadius = Math.max(1, calculateVisionRange(stats.WIS));
    
    for (let q = startX - visionRadius; q <= startX + visionRadius; q++) {
        for (let r = startY - visionRadius; r <= startY + visionRadius; r++) {
            const dist = (Math.abs(q - startX) + Math.abs(q + r - startX - startY) + Math.abs(r - startY)) / 2;
            if (dist <= visionRadius) {
                exploredNormal.add(`${q},${r}`);
            }
        }
    }
    // Ensure origin is always added
    exploredNormal.add(`${startX},${startY}`);

    const startQuests = [
        { id: 'q1', title: 'The Capital', description: 'Find the great castle at coordinates (0, 0).', completed: false, type: 'MAIN' as const },
        { id: 'q2', title: 'Explore the Wilds', description: 'Discover 50 unique locations in Arcadia.', completed: false, type: 'SIDE' as const }
    ];

    // ATOMIC UPDATE to prevent inconsistent render states
        set({ 
        party, 
        difficulty, 
        inventory, 
        playerPos: { x: startX, y: startY }, 
        activeInventoryCharacterId: leader.id, 
        exploredTiles: { ...get().exploredTiles, [Dimension.NORMAL]: exploredNormal },
        quests: startQuests,
        gameState: GameState.OVERWORLD
    });
    
    get().addLog(`The party assembles! ${name} leads ${companions[0].name} and ${companions[1].name}.`, 'narrative');
  },

  recalculateStats: (entity) => {
    const effectiveAttributes = { ...entity.stats.baseAttributes };
    let armorBase = 10; let shieldBonus = 0;
    Object.values(entity.equipment).forEach((item: Item | undefined) => {
        if (!item || !item.equipmentStats) return;
        const stats = item.equipmentStats;
        if (stats.modifiers) Object.entries(stats.modifiers).forEach(([key, val]) => { if (val) effectiveAttributes[key as keyof Attributes] += (val as number); });
        if (stats.slot === EquipmentSlot.BODY && stats.ac) armorBase = stats.ac;
        if (stats.slot === EquipmentSlot.OFF_HAND && stats.ac) shieldBonus = stats.ac;
    });
    let dexMod = getModifier(effectiveAttributes.DEX);
    if (armorBase >= 16) dexMod = 0; else if (armorBase >= 13) dexMod = Math.min(2, dexMod);
    
    const currentStamina = entity.stats.stamina !== undefined ? entity.stats.stamina : calculateMaxStamina(effectiveAttributes.CON, entity.stats.level);
    
    return { 
        ...entity.stats, 
        ac: armorBase + dexMod + shieldBonus, 
        attributes: effectiveAttributes, 
        initiativeBonus: getModifier(effectiveAttributes.DEX),
        stamina: currentStamina,
        maxStamina: calculateMaxStamina(effectiveAttributes.CON, entity.stats.level)
    };
  },

  levelUpParty: () => {
    const { party } = get();
    const upgradedParty = party.map(member => {
        const nextLevel = member.stats.level + 1;
        const conMod = getModifier(member.stats.baseAttributes.CON);
        const hitDie = getHitDie(member.stats.class);
        const newMaxHp = member.stats.maxHp + Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
        const newMaxStamina = calculateMaxStamina(member.stats.baseAttributes.CON, nextLevel);
        const newSpellSlots = getCasterSlots(member.stats.class, nextLevel);
        const newBaseAttributes = { ...member.stats.baseAttributes };
        
        if (nextLevel % 4 === 0) {
            let primaryStat = Ability.STR;
            if ([CharacterClass.WIZARD].includes(member.stats.class)) primaryStat = Ability.INT;
            else if ([CharacterClass.ROGUE, CharacterClass.RANGER, CharacterClass.BARD].includes(member.stats.class)) primaryStat = Ability.DEX;
            else if ([CharacterClass.CLERIC, CharacterClass.DRUID].includes(member.stats.class)) primaryStat = Ability.WIS;
            else if ([CharacterClass.SORCERER, CharacterClass.WARLOCK, CharacterClass.PALADIN].includes(member.stats.class)) primaryStat = Ability.CHA;
            
            newBaseAttributes[primaryStat] += 1;
        }

        const tempEntity = { ...member, stats: { ...member.stats, level: nextLevel, maxHp: newMaxHp, hp: newMaxHp, maxStamina: newMaxStamina, stamina: newMaxStamina, spellSlots: newSpellSlots, baseAttributes: newBaseAttributes, xpToNextLevel: XP_TABLE[nextLevel] || 999999 } };
        return { ...member, stats: get().recalculateStats(tempEntity) };
    });
    set({ party: upgradedParty }); 
    sfx.playVictory(); 
    get().addLog(`The party reached level ${upgradedParty[0].stats.level}!`, "levelup");
  }
});

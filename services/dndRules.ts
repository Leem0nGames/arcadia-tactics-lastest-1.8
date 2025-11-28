
import { Attributes, Ability, PositionComponent, BattleCell, Entity, CombatStatsComponent, CharacterClass, EquipmentSlot, Difficulty } from '../types';
import { DIFFICULTY_SETTINGS, BASE_STATS, XP_TABLE } from '../constants';

export const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const getProficiencyBonus = (level: number): number => {
    return Math.floor((level - 1) / 4) + 2;
};

export const rollDice = (sides: number, count: number = 1): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

export const rollD20 = (type: 'normal' | 'advantage' | 'disadvantage' = 'normal'): { result: number, raw: number[] } => {
  const r1 = Math.floor(Math.random() * 20) + 1;
  const r2 = Math.floor(Math.random() * 20) + 1;

  if (type === 'advantage') {
    return { result: Math.max(r1, r2), raw: [r1, r2] };
  } else if (type === 'disadvantage') {
    return { result: Math.min(r1, r2), raw: [r1, r2] };
  }
  return { result: r1, raw: [r1] };
};

export const calculateAC = (dex: number, armorBase: number = 10, hasShield: boolean = false, armorType: 'light'|'medium'|'heavy' = 'light'): number => {
  let dexBonus = getModifier(dex);
  if (armorType === 'medium') dexBonus = Math.min(2, dexBonus);
  if (armorType === 'heavy') dexBonus = 0;
  
  return armorBase + dexBonus + (hasShield ? 2 : 0);
};

export const calculateHp = (level: number, con: number, hitDie: number): number => {
  const mod = getModifier(con);
  return (hitDie + mod) + ((level - 1) * (Math.floor(hitDie / 2) + 1 + mod));
};

export const calculateVisionRange = (wis: number): number => {
    return Math.max(1, 2 + getModifier(wis));
};

export const checkLineOfSight = (start: PositionComponent, end: PositionComponent, map: BattleCell[]): boolean => {
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (x0 === x1 && y0 === y1) break;
        
        if (x0 !== start.x || y0 !== start.y) {
             const cell = map.find(c => c.x === x0 && c.z === y0);
             if (cell && cell.isObstacle) return false;
        }

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return true;
};

// --- ADVANCED COMBAT LOGIC ---

// 1. Attack Roll
export const calculateAttackRoll = (attacker: Entity & { stats: CombatStatsComponent }, weaponSlot: EquipmentSlot = EquipmentSlot.MAIN_HAND) => {
    const weapon = attacker.equipment[weaponSlot];
    let mod = getModifier(attacker.stats.attributes.STR);
    
    // Finesse / Ranged Logic
    if (weapon?.equipmentStats?.properties?.includes('Finesse')) {
        mod = Math.max(getModifier(attacker.stats.attributes.STR), getModifier(attacker.stats.attributes.DEX));
    } else if (weapon?.equipmentStats?.properties?.includes('Range')) {
        mod = getModifier(attacker.stats.attributes.DEX);
    } else if (attacker.stats.class === CharacterClass.ROGUE || attacker.stats.class === CharacterClass.RANGER) {
         // Fallback for enemies defined generally
         mod = Math.max(getModifier(attacker.stats.attributes.STR), getModifier(attacker.stats.attributes.DEX));
    }

    const prof = getProficiencyBonus(attacker.stats.level);
    const roll = rollD20();
    const isCrit = roll.result === 20;
    const total = roll.result + mod + prof;

    return { total, isCrit, roll: roll.result, mod, prof };
};

// 2. Damage Roll
export const calculateDamage = (attacker: Entity & { stats: CombatStatsComponent }, weaponSlot: EquipmentSlot = EquipmentSlot.MAIN_HAND, isCrit: boolean = false) => {
    const weapon = attacker.equipment[weaponSlot];
    let mod = getModifier(attacker.stats.attributes.STR);

    // Stat determination matches Attack Roll
    if (weapon?.equipmentStats?.properties?.includes('Finesse')) {
        mod = Math.max(getModifier(attacker.stats.attributes.STR), getModifier(attacker.stats.attributes.DEX));
    } else if (weapon?.equipmentStats?.properties?.includes('Range')) {
        mod = getModifier(attacker.stats.attributes.DEX);
    } else if (attacker.stats.class === CharacterClass.ROGUE || attacker.stats.class === CharacterClass.RANGER) {
         mod = Math.max(getModifier(attacker.stats.attributes.STR), getModifier(attacker.stats.attributes.DEX));
    }

    // Default to Unarmed (1 damage + STR) if no weapon
    const diceCount = weapon?.equipmentStats?.diceCount || 1;
    const diceSides = weapon?.equipmentStats?.diceSides || 1; // 1 damage unarmed base

    let dmg = rollDice(diceSides, diceCount);
    if (isCrit) {
        dmg += rollDice(diceSides, diceCount); // Double dice
    }
    
    // Offhand doesn't get mod usually, but simplifying for now: Main Hand gets mod
    if (weaponSlot === EquipmentSlot.MAIN_HAND) {
        dmg += mod;
    }

    return Math.max(1, dmg);
};

// 3. Enemy Scaling
export const calculateEnemyStats = (baseDef: any, level: number, difficulty: Difficulty) => {
    const diff = DIFFICULTY_SETTINGS[difficulty];
    
    // HP Scaling: Base + (Level-1) * (HitDieAvg + ConMod) * Multiplier
    // Simplifying HitDie avg to 5 for generic enemies
    const hp = Math.floor((baseDef.hp + (level - 1) * 5) * diff.enemyStatMod);
    
    // AC Scaling: Base + 1 per 3 levels
    const ac = Math.min(20, baseDef.ac + Math.floor((level - 1) / 3));
    
    // Damage Scaling: Base + (Level-1)/2 * Multiplier
    const damageBase = Math.floor((baseDef.damage + (level - 1)) * diff.enemyStatMod);
    
    return {
        ...baseDef,
        hp,
        maxHp: hp,
        ac,
        damage: damageBase,
        level,
        xpReward: Math.floor(baseDef.xpReward * (1 + (level * 0.2)) * diff.xpMod)
    };
};

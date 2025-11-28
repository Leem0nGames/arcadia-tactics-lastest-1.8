# 🎯 PLAN EJECUTABLE - Orden Recomendado de Implementación

**Estado:** LISTA DE TAREAS PRIORIZADAS  
**Última Actualización:** 28 de Noviembre, 2024

---

## 🔴 WEEK 1: CRITICAL PATH (Habilitar Loop Básico)

### Task 1.1: Implementar `levelUpParty()` - BLOCKER
- **Archivos:** `playerSlice.ts`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 2-3 horas
- **Descripción:**
  - Implementar lógica completa de level up
  - Incrementar stats base (Strength +1, etc)
  - Recalcular HP/Stamina máximo
  - Otorgar nuevas habilidades si aplica (Fighters obtienen ataque extra cada 2 niveles)
  - Resetear XP a 0
  - Crear animación "Level Up!"

**Código Pendiente:**
```typescript
levelUpParty: () => {
  set(state => {
    const party = state.party.map(member => {
      if (member.stats.xp >= member.stats.xpToNextLevel) {
        const newLevel = member.stats.level + 1;
        const newHitDie = getHitDie(member.stats.class);
        const hpGain = Math.max(1, rollDice(1, newHitDie, getModifier(member.stats.attributes.CON)));
        
        return {
          ...member,
          stats: {
            ...member.stats,
            level: newLevel,
            hp: member.stats.maxHp + hpGain,
            maxHp: member.stats.maxHp + hpGain,
            xp: 0,
            xpToNextLevel: XP_TABLE[newLevel] || 999999,
          }
        };
      }
      return member;
    });
    return { party };
  });
}
```

**Pruebas:**
- [ ] Crear personaje, ganar 300 XP, verificar que sube a nivel 2
- [ ] Stats incrementan (verificar en UI)
- [ ] HP máximo aumenta
- [ ] XP resetea a 0

---

### Task 1.2: Conectar Level Up a Victoria de Combate
- **Archivos:** `battleSlice.ts`, `App.tsx`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 1-2 horas
- **Descripción:**
  - En `applyDamage()`, cuando TODOS los enemigos mueren:
    - Calcular XP por enemigo = 100 * nivel_enemigo * (1 + 0.2 * dificultad)
    - Distribuir entre el party
    - Llamar `store.levelUpParty()`
  - Agregar log "Party gains X XP!"
  - Mostrar notificación si alguien subió de nivel

**Cambios en `battleSlice.ts`:**
```typescript
// En la sección VICTORY CHECK de applyDamage()
if (!newEntities.some((e: any) => e.type === 'ENEMY' && e.stats.hp > 0)) {
  const xpPerEnemy = 100 * (enemyLevel) * (1 + 0.2 * DIFFICULTY_SETTINGS[store.difficulty].xpMod);
  const playerParty = newEntities.filter(e => e.type === 'PLAYER');
  const xpPerPlayer = Math.floor(xpPerEnemy / playerParty.length);
  
  playerParty.forEach(player => {
    player.stats.xp += xpPerPlayer;
  });
  
  store.addLog(`Party gains ${xpPerEnemy} XP!`, 'combat');
  
  // Disparar level ups después de 1.5s
  setTimeout(() => {
    store.levelUpParty();
  }, 1500);
}
```

**Pruebas:**
- [ ] Derrotar enemigos en batalla
- [ ] Verificar que party gana XP en logs
- [ ] Verificar que levelUpParty() se dispara
- [ ] Stats aumentan en UI

---

### Task 1.3: UI Component para Notificación de Level Up
- **Archivo:** Crear `components/LevelUpNotification.tsx`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 2 horas
- **Descripción:**
  - Componente que muestra:
    - "LEVEL UP! You are now Level X"
    - Stats viejos vs nuevos (Comparison)
    - Nuevas habilidades desbloquedas (si aplica)
  - Duración: 3-5 segundos
  - Efecto visual: Confeti/glow
  - Sonido: Victory jingle

**Estructura:**
```tsx
interface LevelUpNotificationProps {
  character: Entity & { stats: CombatStatsComponent };
  oldStats: CombatStatsComponent;
  newStats: CombatStatsComponent;
  onDismiss: () => void;
}

export const LevelUpNotification = ({ character, oldStats, newStats, onDismiss }: LevelUpNotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-gradient-to-b from-amber-500 to-amber-700 
                    rounded-lg p-8 text-center animate-bounce">
      <h2 className="text-4xl font-bold text-white mb-4">LEVEL UP!</h2>
      <p className="text-2xl text-amber-100 mb-6">{character.name} is now Level {newStats.level}</p>
      
      <div className="grid grid-cols-2 gap-4 text-white mb-6">
        <div>
          <p className="text-sm opacity-75">STR: {oldStats.attributes.STR} → {newStats.attributes.STR}</p>
          <p className="text-sm opacity-75">DEX: {oldStats.attributes.DEX} → {newStats.attributes.DEX}</p>
          <p className="text-sm opacity-75">CON: {oldStats.attributes.CON} → {newStats.attributes.CON}</p>
        </div>
        <div>
          <p className="text-sm opacity-75">WIS: {oldStats.attributes.WIS} → {newStats.attributes.WIS}</p>
          <p className="text-sm opacity-75">INT: {oldStats.attributes.INT} → {newStats.attributes.INT}</p>
          <p className="text-sm opacity-75">CHA: {oldStats.attributes.CHA} → {newStats.attributes.CHA}</p>
        </div>
      </div>
      
      <p className="text-white">HP: {oldStats.maxHp} → {newStats.maxHp}</p>
    </div>
  );
};
```

---

### Task 1.4: Descargar Assets Locales (Ejecutar Script)
- **Archivo:** `download_assets.mjs`
- **Complejidad:** ⭐ (Trivial)
- **Estimado:** 30 minutos
- **Descripción:**
  - Ejecutar `node download_assets.mjs` en terminal
  - Verificar que `/public/assets/` se llena con texturas
  - Cambiar `USE_LOCAL_ASSETS = true` en `constants.ts`
  - Prueba: Recargar juego, debe usar assets locales

**Comando:**
```bash
node download_assets.mjs
```

**Verificación:**
```bash
ls -la public/assets/wesnoth/terrain/ | wc -l
# Debería haber 100+ archivos
```

---

## 🟡 WEEK 2-3: PERSISTENCE & SAFETY

### Task 2.1: Implementar Save System con Versionado
- **Archivos:** `overworldSlice.ts`
- **Complejidad:** ⭐⭐⭐ (Media)
- **Estimado:** 3-4 horas
- **Descripción:**
  - Agregar versión a save data
  - Implementar checksum para validación
  - Crear función de migración
  - Guardar automático cada 5 minutos en batalla/overworld

**Código:**
```typescript
const CURRENT_SAVE_VERSION = 1;

const calculateChecksum = (data: any): string => {
  // Usar JSON stringified y hash simple
  return Math.abs(JSON.stringify(data).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(16);
};

const saveGame = () => {
  const state = get();
  const saveData = {
    version: CURRENT_SAVE_VERSION,
    timestamp: Date.now(),
    checksum: '',
    data: {
      party: state.party,
      inventory: state.inventory,
      playerPos: state.playerPos,
      exploredTiles: Array.from(state.exploredTiles[Dimension.NORMAL]),
      battleRewards: state.battleRewards,
      quests: state.quests,
      dimension: state.dimension,
      difficulty: state.difficulty,
    }
  };
  
  saveData.checksum = calculateChecksum(saveData.data);
  localStorage.setItem('arcadia_save_v1', JSON.stringify(saveData));
  state.addLog("Game saved.", 'info');
};

const loadGame = (): boolean => {
  const saveStr = localStorage.getItem('arcadia_save_v1');
  if (!saveStr) return false;
  
  try {
    const saveData = JSON.parse(saveStr);
    
    // Validar versión
    if (saveData.version !== CURRENT_SAVE_VERSION) {
      console.warn('Save version mismatch, attempting migration...');
      // Migración futura aquí
    }
    
    // Validar checksum
    const calculatedChecksum = calculateChecksum(saveData.data);
    if (calculatedChecksum !== saveData.checksum) {
      console.error('Save file corrupted!');
      return false;
    }
    
    // Cargar datos
    set(saveData.data);
    get().addLog("Game loaded.", 'info');
    return true;
  } catch (e) {
    console.error("Load Failed:", e);
    return false;
  }
};
```

---

### Task 2.2: UI para "Continue Game" vs "New Game"
- **Archivo:** Crear `components/MainMenu.tsx`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 2 horas
- **Descripción:**
  - Modal en Character Creation screen
  - Botones: "Continue Game" / "New Game"
  - Si hay save: Mostrar fecha/hora
  - Si no hay save: Deshabilitar "Continue"

```tsx
export const MainMenu = ({ onContinue, onNewGame }: any) => {
  const [hasSave, setHasSave] = useState(false);
  
  useEffect(() => {
    const saveExists = localStorage.getItem('arcadia_save_v1') !== null;
    setHasSave(saveExists);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-slate-800 border-4 border-amber-600 rounded-lg p-12 max-w-md">
        <h1 className="text-4xl font-bold text-amber-400 mb-8 text-center">ARCADIA TACTICS</h1>
        
        <div className="space-y-4">
          <button 
            onClick={onContinue}
            disabled={!hasSave}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 p-3 rounded text-white font-bold"
          >
            Continue Game
          </button>
          
          <button 
            onClick={onNewGame}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded text-white font-bold"
          >
            New Game
          </button>
          
          {hasSave && (
            <p className="text-sm text-gray-400 mt-4">Save exists - Last played today</p>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### Task 2.3: Auto-Save Every 5 Minutes
- **Archivos:** `App.tsx`, `overworldSlice.ts`
- **Complejidad:** ⭐ (Trivial)
- **Estimado:** 1 hora
- **Descripción:**
  - Usar `setInterval` para guardar cada 5 min
  - Solo en estados donde tenga sentido (OVERWORLD, no MENU)
  - Toast notification discreto

```typescript
useEffect(() => {
  if (gameState !== GameState.CHARACTER_CREATION && gameState !== GameState.MENU) {
    const autoSaveInterval = setInterval(() => {
      store.saveGame();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(autoSaveInterval);
  }
}, [gameState]);
```

---

## 🟢 WEEK 3-4: CONTENT SCALING

### Task 3.1: Crear Loot Tables por Bioma
- **Archivo:** Crear `constants/lootTables.ts`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 2-3 horas
- **Descripción:**
  - Definir drops comunes, raros, legendarios por bioma
  - Conectar a dificultad (HARD = más rares)
  - Conectar a nivel (Level 1 = no legendarios)

```typescript
export const LOOT_TABLES: Record<TerrainType, LootTable> = {
  [TerrainType.FOREST]: {
    common: [ITEMS.LEATHER_ARMOR, ITEMS.DAGGER, ITEMS.RATION],
    rare: [ITEMS.LONGSWORD, ITEMS.BOW],
    legendary: [],
    baseGold: { min: 5, max: 15 }
  },
  [TerrainType.DESERT]: {
    common: [ITEMS.SCIMITAR, ITEMS.POTION_HEALING],
    rare: [ITEMS.PLATE_ARMOR],
    legendary: [ITEMS.HOLY_GRAIL],
    baseGold: { min: 10, max: 25 }
  },
  // ... etc
};
```

---

### Task 3.2: Implementar Rareza Escalada
- **Archivos:** `battleSlice.ts`
- **Complejidad:** ⭐⭐ (Baja)
- **Estimado:** 2 horas
- **Descripción:**
  - Función que calcula probabilidad de rareza basada en:
    - Nivel del jugador
    - Dificultad
    - Tipo de enemigo
  - Usar para dropLoot

```typescript
const calculateRarityThreshold = (playerLevel: number, difficulty: Difficulty): number => {
  const baseRare = 0.15;
  const baseLegendary = 0.02;
  const diffMod = DIFFICULTY_SETTINGS[difficulty].xpMod;
  
  const rareThreshold = baseRare + (playerLevel * 0.01) + diffMod * 0.05;
  const legendaryThreshold = baseLegendary + (playerLevel * 0.002) + diffMod * 0.01;
  
  return { rareThreshold, legendaryThreshold };
};

const dropLoot = (terrain: TerrainType, playerLevel: number, difficulty: Difficulty): Item[] => {
  const table = LOOT_TABLES[terrain];
  const { rareThreshold, legendaryThreshold } = calculateRarityThreshold(playerLevel, difficulty);
  const roll = Math.random();
  
  if (roll < legendaryThreshold && table.legendary.length > 0) {
    return [pickRandom(table.legendary)];
  } else if (roll < rareThreshold) {
    return [pickRandom(table.rare)];
  } else {
    return [pickRandom(table.common)];
  }
};
```

---

## 🔵 WEEK 4-5: INTELLIGENCE & POLISH

### Task 4.1: Type Safety - Eliminar `any` (GRADUAL)
- **Archivos:** Todos los componentes
- **Complejidad:** ⭐⭐⭐⭐ (Alta)
- **Estimado:** 7-10 horas
- **Descripción:**
  - Crear interfaces para props de componentes principales
  - Reemplazar `any` gradualmente
  - Comenzar con: `BattleScene`, `BattleUnit`, `InteractionLayer`, `UIOverlay`

**Prioridad 1:**
```typescript
// types/components.ts
export interface BattleSceneProps {
  entities: EntityWithStats[];
  terrainType: TerrainType;
  weather: WeatherType;
  currentTurnEntityId: string;
  onTileClick: (x: number, z: number) => void;
  validMoves: PositionComponent[];
  validTargets: PositionComponent[];
}

type EntityWithStats = Entity & { 
  stats: CombatStatsComponent; 
  position: PositionComponent; 
  visual: VisualComponent;
};
```

---

### Task 4.2: Mejorar IA Enemiga - Fase 1 (SPELL CASTING)
- **Archivos:** `battleSlice.ts`, crear `services/enemyAI.ts`
- **Complejidad:** ⭐⭐⭐ (Media)
- **Estimado:** 5-6 horas
- **Descripción:**
  - Enemigos SPELLCASTER usan spells variados
  - Priorizar targets débiles (low HP)
  - Usar "Dark Bolt", "Heal", "Shield Spell" según situación
  - No solo "Dark Bolt"

```typescript
// services/enemyAI.ts
export const selectBestSpell = (
  enemy: EntityWithStats,
  targets: EntityWithStats[],
  allies: EntityWithStats[]
): Spell => {
  const { spellSlots, class: cls } = enemy.stats;
  
  if (spellSlots.current === 0) return SPELLS.DARK_BOLT; // Fallback
  
  // Si health bajo, heal
  if (enemy.stats.hp < enemy.stats.maxHp * 0.3) {
    const heal = allies.find(a => a.stats.hp < a.stats.maxHp * 0.5);
    if (heal) return SPELLS.CURE_WOUNDS;
  }
  
  // Si target tiene health alto, damage spell
  const weakTarget = targets.sort((a, b) => a.stats.hp - b.stats.hp)[0];
  if (weakTarget && weakTarget.stats.hp < 5) {
    return SPELLS.DARK_BOLT; // Finish
  }
  
  // Default: damage
  return SPELLS.DARK_BOLT;
};
```

---

## 📊 SUMMARY TABLE

| Task | Fase | Archivos | Horas | Prioridad |
|------|------|----------|-------|-----------|
| 1.1 - levelUpParty() | W1 | playerSlice.ts | 2-3 | 🔴 CRITICAL |
| 1.2 - Connect XP | W1 | battleSlice.ts | 1-2 | 🔴 CRITICAL |
| 1.3 - LevelUp UI | W1 | LevelUpNotification.tsx | 2 | 🟡 IMPORTANT |
| 1.4 - Download Assets | W1 | download_assets.mjs | 0.5 | 🔴 CRITICAL |
| 2.1 - Save Versioning | W2 | overworldSlice.ts | 3-4 | 🔴 CRITICAL |
| 2.2 - Menu UI | W2 | MainMenu.tsx | 2 | 🟡 IMPORTANT |
| 2.3 - Auto-Save | W2 | App.tsx | 1 | 🟡 IMPORTANT |
| 3.1 - Loot Tables | W3 | lootTables.ts | 2-3 | 🟡 IMPORTANT |
| 3.2 - Rarity Scaling | W3 | battleSlice.ts | 2 | 🟡 IMPORTANT |
| 4.1 - Type Safety | W4 | Todos | 7-10 | 🟢 POLISH |
| 4.2 - Better AI | W4-5 | battleSlice.ts | 5-6 | 🟢 POLISH |

---

## ⚡ HOW TO START NOW

**Hoy:**
1. Ir a `store/slices/playerSlice.ts`
2. Buscar función `levelUpParty: () => {`
3. Reemplazar con código completo arriba (Task 1.1)
4. Guardar y testear

**Mañana:**
1. Conectar a `battleSlice.ts` (Task 1.2)
2. Crear LevelUpNotification (Task 1.3)
3. Ejecutar `node download_assets.mjs` (Task 1.4)

**En paralelo:**
- Alguien puede trabajar en Task 2.1 (Save System)
- Otro en Task 3.1 (Loot Tables)

---

## 🧪 TESTING CHECKLIST

Después de completar WEEK 1:
- [ ] Crear personaje → Pelear → Ganar XP → Subir de nivel
- [ ] Verificar stats aumentan en UI
- [ ] Ver notificación de "LEVEL UP!"
- [ ] Assets locales se cargan sin errores 404

Después de completar WEEK 2-3:
- [ ] Guardar juego → Recargar página → Continuar desde save
- [ ] Verificar que el save tiene date/time
- [ ] Corromper save manualmente → Debe rechazarlo

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE ESTO

1. **Quests & NPCs** - Sistema de misiones funcional
2. **Shadow Realm** - Portales y world bipartite
3. **Boss Encounters** - Enemigos únicos con comportamientos especiales
4. **Skill Trees** - Abilities desbloqueables por nivel
5. **Cooperative Play** - Multiplayer básico (si aplica)


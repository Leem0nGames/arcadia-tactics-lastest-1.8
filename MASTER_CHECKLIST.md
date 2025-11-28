# ✅ MASTER CHECKLIST - Implementación de Cabos Sueltos

**Usar este documento para trackear progreso de la implementación**

---

## 📋 FASE 1: BLOQUEADORES (Semana 1)

### ✅ Task 1.0: Preparación
- [ ] Leer EXECUTIVE_SUMMARY.md (5 min)
- [ ] Leer QUICK_START.md (10 min)
- [ ] Crear rama git: `git checkout -b feature/reconnect-loose-ends`
- [ ] Backup estado actual: `git tag backup-v1.0`

### ✅ Task 1.1: Implementar levelUpParty()
**Archivo:** `store/slices/playerSlice.ts` línea ~163

**Pre-requisitos:**
- [ ] Entiendo la estructura de party (Entity + stats)
- [ ] Sé cómo actualizar Zustand state

**Implementación:**
- [ ] Copiar código de IMPLEMENTATION_ROADMAP.md Task 1.1
- [ ] Implementar lógica: xp check → newLevel → incrementar stats
- [ ] Manejar hit die roll para HP gain
- [ ] Resetear XP a 0
- [ ] Llamar `recalculateStats()` en miembro
- [ ] `npm run build` compila sin errores
- [ ] `npm start` corre sin errores

**Testing:**
- [ ] Crear personaje
- [ ] Ganar 300 XP en batalla
- [ ] Verificar en DevTools: `console.log(store.party[0].stats.level)` = 2
- [ ] Verificar HP máximo incrementó
- [ ] Verificar XP reseteó a 0

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 1.2: Conectar XP a levelUpParty
**Archivo:** `store/slices/battleSlice.ts` (~línea 110-135 en applyDamage)

**Pre-requisitos:**
- [ ] Task 1.1 completado
- [ ] Entiendo cómo se calcula XP actual

**Implementación:**
- [ ] En `applyDamage()`, sección VICTORY CHECK
- [ ] Calcular XP por enemigo: `100 * nivel * (1 + 0.2 * diffMod)`
- [ ] Distribuir entre party: `xpPerEnemy / playerCount`
- [ ] Agregar a stats de cada player
- [ ] `addLog()` con cantidad de XP ganado
- [ ] Esperar 1.5 segundos
- [ ] Llamar `store.levelUpParty()`
- [ ] `npm run build` compila

**Testing:**
- [ ] Derrotar 1 enemigo
- [ ] Verificar en logs "Party gains X XP"
- [ ] Verificar que stats.xp incrementó
- [ ] Verificar que levelUpParty() se disparó (nivel subió)
- [ ] Repetir con múltiples enemigos

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 1.3: Crear LevelUpNotification Component
**Archivo:** Crear `components/LevelUpNotification.tsx`

**Pre-requisitos:**
- [ ] Task 1.2 completado
- [ ] React + TypeScript familiaridad

**Implementación:**
- [ ] Crear interfaz LevelUpNotificationProps
- [ ] Componente que recibe character + oldStats + newStats
- [ ] Mostrar: "LEVEL UP! You are now Level X"
- [ ] Mostrar comparación de stats (antes vs después)
- [ ] Auto-dismiss después de 4 segundos
- [ ] Efectos visuales: animate-bounce, gradientes
- [ ] Sonido: `sfx.playVictory()` o similar
- [ ] Integrar en `App.tsx` state
- [ ] `npm run build` compila

**Requisitos UI:**
- [ ] Título: "LEVEL UP!" en grande, dorado
- [ ] Grid de stats viejos vs nuevos
- [ ] HP máximo mostrado
- [ ] Centered en screen
- [ ] Desaparece suavemente después de 4s

**Testing:**
- [ ] Jugar hasta level up
- [ ] Verificar que notificación aparece
- [ ] Verificar que muestra stats correctos
- [ ] Verificar que desaparece después de 4s
- [ ] Probar sonido

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 1.4: Descargar & Usar Assets Locales
**Archivo:** `constants.ts` + ejecutar `download_assets.mjs`

**Pre-requisitos:**
- [ ] Node.js disponible en terminal
- [ ] Conexión a internet (para descargar assets)

**Implementación:**
- [ ] Terminal: `cd /workspaces/arcadia-tactics-lastest-1.8`
- [ ] Ejecutar: `node download_assets.mjs`
- [ ] Esperar completación (puede tomar 2-5 min)
- [ ] Verificar: `ls -la public/assets/wesnoth/terrain/ | wc -l` ≥ 100
- [ ] Abrir `constants.ts`
- [ ] Cambiar: `USE_LOCAL_ASSETS = true` (línea ~XX)
- [ ] Verificar que BLOCK_TEXTURES usa rutas locales si true
- [ ] `npm run build` compila

**Verificación Assets:**
- [ ] [ ] Revisar public/assets/ existe y tiene contenido
- [ ] [ ] `/public/assets/wesnoth/terrain/` tiene subdirectories
- [ ] [ ] `/public/assets/wesnoth/units/` tiene sprites
- [ ] [ ] `/public/assets/wesnoth/attacks/` tiene efectos

**Testing:**
- [ ] `npm start`
- [ ] Entrar a batalla
- [ ] F12 → Network tab
- [ ] Verificar que NO hay 404s
- [ ] Todas las texturas son from `/assets/` (local)
- [ ] Battle renderiza sin errores

**Completado:** [ ] ___ (Fecha)

---

### ✅ MILESTONE: WEEK 1 VERIFICATION
- [ ] Crear personaje nuevo
- [ ] Entrar a combate
- [ ] Ganar batalla
- [ ] Ver "Party gains X XP" en logs
- [ ] Ver "LEVEL UP!" notificación
- [ ] Verificar stats incrementaron (STR, HP, etc)
- [ ] Verificar assets cargaron locales (F12 Network)
- [ ] `npm run build` pasa sin errores
- [ ] Git commit: "feat: level up system + local assets working"

---

## 📋 FASE 2: PERSISTENCIA (Semanas 2-3)

### ✅ Task 2.1: Implementar Save System con Versionado
**Archivo:** `store/slices/overworldSlice.ts` (refactorizar saveGame/loadGame)

**Pre-requisitos:**
- [ ] Phase 1 completado
- [ ] Entiendas JSON stringification
- [ ] Entiendas localStorage API

**Implementación:**
- [ ] Crear constante: `CURRENT_SAVE_VERSION = 1`
- [ ] Crear función: `calculateChecksum(data)` → hash simple
- [ ] Refactorizar `saveGame()`:
  - [ ] Crear objeto saveData con { version, timestamp, checksum, data }
  - [ ] Calcular checksum del data
  - [ ] Guardar en localStorage con key versionado
  - [ ] `addLog("Game saved")`
- [ ] Refactorizar `loadGame()`:
  - [ ] Leer desde localStorage
  - [ ] Validar version
  - [ ] Validar checksum
  - [ ] Cargar state
  - [ ] Handle corruption gracefully
- [ ] `npm run build` compila

**Verificación JSON:**
```typescript
// saveData debe tener esta estructura:
{
  version: 1,
  timestamp: 1701200000000,
  checksum: "abc123def456",
  data: {
    party: [...],
    inventory: [...],
    playerPos: { x, y },
    // ... rest
  }
}
```

**Testing:**
- [ ] Jugar un poco (mover, combatir)
- [ ] Guardar manualmente
- [ ] F12 → Storage → localStorage → Ver arcadia_save_v1
- [ ] Verificar estructura tiene version + checksum
- [ ] Recargar página
- [ ] Verificar que gameState se restaura
- [ ] Verificar que party/inventory/pos se restauran
- [ ] Intentar corromper checksum → Debe rechazar

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 2.2: Crear UI "Continue Game" vs "New Game"
**Archivo:** Crear `components/MainMenu.tsx` + integrar en `App.tsx`

**Pre-requisitos:**
- [ ] Task 2.1 completado

**Implementación:**
- [ ] Crear componente MainMenu
- [ ] Mostrar dos botones: "Continue" + "New Game"
- [ ] Deshabilitar "Continue" si no hay save
- [ ] Mostrar info del save (fecha, nivel, nombre)
- [ ] Integrar en App.tsx al inicio
- [ ] Si "Continue" → cargar save → ir a OVERWORLD
- [ ] Si "New Game" → mostrar CHARACTER_CREATION
- [ ] `npm run build` compila

**UI Requirements:**
- [ ] Modal centered, nice styling
- [ ] Botón Continue disabled si sin save
- [ ] Mostrar metadata del save (fecha, character name, level)
- [ ] Transición suave entre screens

**Testing:**
- [ ] Jugar + guardar
- [ ] Recargar página
- [ ] Verificar MainMenu con "Continue" habilitado
- [ ] Click Continue → Se restaura save
- [ ] Posición, inventory, stats iguales que antes
- [ ] Click New Game → CHARACTER_CREATION

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 2.3: Implementar Auto-Save Cada 5 Minutos
**Archivo:** `App.tsx` + `overworldSlice.ts`

**Pre-requisitos:**
- [ ] Task 2.1 completado

**Implementación:**
- [ ] En App.tsx, crear useEffect
- [ ] Usar setInterval: 5 * 60 * 1000 (5 minutos)
- [ ] Llamar `store.saveGame()` cada intervalo
- [ ] Solo si gameState está en OVERWORLD/BATTLE (no MENU)
- [ ] Mostrar pequeña notificación: "Game saved" (toast, 2s)
- [ ] Limpiar interval al desmontar componente
- [ ] `npm run build` compila

**Testing:**
- [ ] Jugar por 5+ minutos
- [ ] Verificar que localStorage se actualizó automático
- [ ] Recargar página
- [ ] Verificar que progreso de esos 5 min está preservado
- [ ] Toast notification aparece discretamente

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 3.1: Crear Loot Tables por Bioma
**Archivo:** Crear `constants/lootTables.ts`

**Pre-requisitos:**
- [ ] Phase 1 completado
- [ ] Entiendes estructura de Item + Rarity

**Implementación:**
- [ ] Definir LOOT_TABLES: Map<TerrainType, LootTable>
- [ ] Para cada bioma (FOREST, DESERT, CAVE, etc):
  - [ ] common: [] (Common rarity items)
  - [ ] rare: [] (Rare items)
  - [ ] legendary: [] (Legendary items)
  - [ ] baseGold: { min, max }
- [ ] Llenar items apropiados por bioma
- [ ] Exportar para usar en battleSlice
- [ ] `npm run build` compila

**Loot Table Structure:**
```typescript
interface LootTable {
  common: Item[];
  rare: Item[];
  legendary: Item[];
  baseGold: { min: number; max: number };
}
```

**Testing:**
- [ ] Verificar que cada bioma tiene items diferentes
- [ ] Verificar que rarity escalada (legendary < rare < common)
- [ ] Ejecutar en batalla, verificar que loot viene de tabla

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 3.2: Implementar Rareza Escalada por Nivel/Dificultad
**Archivo:** `battleSlice.ts` (modificar applyDamage / dropLoot)

**Pre-requisitos:**
- [ ] Task 3.1 completado
- [ ] Entiendes dificultad modifiers

**Implementación:**
- [ ] Crear función: `calculateRarityThreshold(playerLevel, difficulty)`
  - [ ] baseRare = 0.15 (15% base chance)
  - [ ] baseLegendary = 0.02 (2% base chance)
  - [ ] diffMod = DIFFICULTY_SETTINGS[difficulty].xpMod
  - [ ] Escalar ambos por level + difficulty
- [ ] Crear función: `dropLoot(terrain, playerLevel, difficulty) → Item[]`
  - [ ] Usar calculateRarityThreshold
  - [ ] Roll random
  - [ ] Si < legendaryThreshold y table.legendary existe → drop legendary
  - [ ] Else si < rareThreshold → drop rare
  - [ ] Else → drop common
- [ ] Integrar en applyDamage()
- [ ] `npm run build` compila

**Testing:**
- [ ] Jugar nivel 1, derrotar enemigos
- [ ] Verificar que NO hay legendarios (muy raro)
- [ ] Subir de nivel, jugar nivel 10
- [ ] Verificar que legendarios más frecuentes
- [ ] Cambiar a dificultad HARD
- [ ] Verificar que legendarios aún más frecuentes
- [ ] Verificar que items vienen de tabla correcta (FOREST items en bosque, etc)

**Completado:** [ ] ___ (Fecha)

---

### ✅ MILESTONE: WEEK 2-3 VERIFICATION
- [ ] Jugar + guardar
- [ ] Recargar página → Continuar desde save
- [ ] Verificar stats/inventory preservados
- [ ] Auto-save cada 5 minutos funciona
- [ ] Loot es coherente con nivel
- [ ] No hay items LEGENDARY a nivel 1
- [ ] Legendarios más frecuentes en dificultad HARD
- [ ] Git commit: "feat: save system versioned + loot scaling"

---

## 📋 FASE 3: PROFUNDIDAD (Semanas 4-5)

### ✅ Task 4.1: Type Safety - Eliminar `any` (GRADUAL)
**Archivos:** `types.ts`, todos los componentes

**Pre-requisitos:**
- [ ] Phase 2 completado
- [ ] TypeScript intermediate level

**Implementación (Prioridad):**

**Tier 1 (Componentes principales):**
- [ ] Crear `types/components.ts`
- [ ] Define: `BattleSceneProps` interface
- [ ] Define: `BattleUnitProps` interface
- [ ] Define: `InteractionLayerProps` interface
- [ ] Define: `UIOverlayProps` interface
- [ ] Reemplazar `any` en estos componentes

**Tier 2 (Utilidades):**
- [ ] Define: `StatusBarProps`, `ActionBtnProps`, etc
- [ ] Reemplazar `any` en componentes UI

**Tier 3 (Servicios):**
- [ ] Revisar `services/*.ts`
- [ ] Añadir tipos a funciones
- [ ] Eliminar `any` en retornos

**Checklist:**
- [ ] `grep -r ": any" components/ | wc -l` = 0
- [ ] `grep -r ": any" store/ | wc -l` ≤ 5 (solo donde sea necesario)
- [ ] TypeScript strict mode enabled (tsconfig.json)
- [ ] `npm run build` compila sin type errors
- [ ] Intellisense funciona (hover muestra tipos)

**Testing:**
- [ ] Refactorizar una función
- [ ] Verificar que TypeScript previene errores
- [ ] Debugging en DevTools más fácil

**Completado:** [ ] ___ (Fecha)

---

### ✅ Task 4.2: Mejorar IA Enemiga - Fase 1 (Spell Casting)
**Archivo:** `battleSlice.ts` + crear `services/enemyAI.ts`

**Pre-requisitos:**
- [ ] Phase 2 completado
- [ ] Entiendes lógica de batalla actual

**Implementación:**
- [ ] Crear `services/enemyAI.ts`
- [ ] Función: `selectBestSpell(enemy, targets, allies) → Spell`
  - [ ] Si health bajo (<30%) → try heal
  - [ ] Si target débil (<5 hp) → damage spell finish
  - [ ] Default → damage spell
- [ ] Modificar `performEnemyAction()` en battleSlice
  - [ ] Si SPELLCASTER: usar selectBestSpell en lugar de hardcoded
  - [ ] Ejecutar spell elegido
- [ ] Spells variados: DARK_BOLT, CURE_WOUNDS, SHIELD_SPELL, etc
- [ ] `npm run build` compila

**Verificación:**
- [ ] [ ] SPELLCASTER enemies castean múltiples spells
- [ ] [ ] No solo "Dark Bolt"
- [ ] [ ] Usan HEAL cuando health bajo
- [ ] [ ] Prioridad de targets tiene sentido

**Testing:**
- [ ] Pelear contra SPELLCASTER
- [ ] Verificar que castea spells variados (no solo Dark Bolt)
- [ ] Si enemigo health bajo, debe try heal
- [ ] Combates son más variados

**Completado:** [ ] ___ (Fecha)

---

### ✅ MILESTONE: PHASE 3 VERIFICATION
- [ ] 0 `any` en componentes principales
- [ ] TypeScript intellisense funciona everywhere
- [ ] Enemigos castean múltiples spells
- [ ] Combates menos predecibles
- [ ] Git commit: "refactor: type safety + better enemy AI"

---

## 📋 VERIFICACIÓN FINAL - SISTEMA COMPLETO

### ✅ Core Loop Test
- [ ] Crear personaje
- [ ] Explorar overworld
- [ ] Entrar a combate
- [ ] Ganar batalla
- [ ] Ganar XP
- [ ] Subir de nivel
- [ ] Verificar stats mejoraron
- [ ] Ver LevelUp notification
- [ ] Recibir loot (escalado)
- [ ] Guardar juego
- [ ] Recargar página
- [ ] Continuar desde save
- [ ] Progreso preservado

### ✅ Edge Cases
- [ ] Cambiar schema → Cargar save antiguo (debe migrar)
- [ ] Corruper save → Debe detectar y rechazar
- [ ] Assets offline → Debe usar local sin errores
- [ ] Level 20 → Recibir loot coherente
- [ ] Dificultad HARD → Loot mejor

### ✅ Performance
- [ ] Battle no laguea
- [ ] Save/Load en <500ms
- [ ] Auto-save no percibible
- [ ] No memory leaks (DevTools Heap)

### ✅ Code Quality
- [ ] `npm run build` pasa
- [ ] `npm run lint` pasa (si tienes)
- [ ] No console.errors
- [ ] TypeScript strict = 0 errors

---

## 🎯 FINAL SIGN-OFF

**Completed by:** _____________  
**Date:** _____________  
**Status:** ✅ READY FOR BETA TESTING

**Issues Found:**
- [ ] None
- [ ] Minor (document here):
- [ ] Major (document here):

**Next Phase:**
- [ ] Phase 4-5 (Quests + Polish)
- [ ] Beta testing
- [ ] Public release

---

**Last Updated:** 28 de Noviembre, 2024  
**Track Progress:** Mark tasks complete as you go  
**Feedback:** Document any blockers or issues


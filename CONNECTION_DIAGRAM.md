# 🔗 DIAGRAMA DE CONEXIONES - Sistema Actual vs Ideal

**Propósito:** Visualizar qué está desconectado y cómo reconectarlo

---

## 📍 ESTADO ACTUAL: SISTEMA FRAGMENTADO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐       │
│  │  CHARACTER       │     │  OVERWORLD       │     │  BATTLE          │       │
│  │  CREATION        │────▶│  EXPLORATION     │────▶│  SYSTEM          │       │
│  │  ✅ Funciona     │     │  ✅ Funciona     │     │  ✅ Funciona     │       │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘       │
│                                                           │                    │
│                                                           ▼                    │
│                                                    ┌──────────────────┐       │
│                                                    │  LOOT DROP       │       │
│                                                    │  ❓ INCOMPLETO   │       │
│                                                    │  (random, sin    │       │
│                                                    │   escalabilidad) │       │
│                                                    └──────────────────┘       │
│                                                           │                    │
│                                                           ▼                    │
│                                                    ┌──────────────────┐       │
│                                                    │  INVENTORY       │       │
│                                                    │  ✅ Funciona     │       │
│                                                    └──────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: XP Loop
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  BATALLA                    XP GANADO              LEVEL UP PARTY              │
│  ┌──────────────┐          ┌────────────┐         ┌──────────────────┐       │
│  │ Derrotar     │          │ Variable   │         │ FUNCIÓN VACÍA    │       │
│  │ enemigos     │─────────▶│ party.xp   │─ ─ ─ ─▶│ ❌ NO EXISTE     │       │
│  │ ✅ OK        │          │ ✅ OK      │         │ IMPLEMENTACIÓN   │       │
│  └──────────────┘          └────────────┘         └──────────────────┘       │
│                                                           │                    │
│                                              ❌ DESCONECTADO                 │
│                                                           │                    │
│                                                           ▼                    │
│                                                  ┌──────────────────┐        │
│                                                  │ RECALCULATE      │        │
│                                                  │ STATS            │        │
│                                                  │ ❌ NUNCA SE      │        │
│                                                  │ DISPARA          │        │
│                                                  └──────────────────┘        │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: Save/Load Automático
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  GAMEPLAY STATE              SAVE FUNCTION            BROWSER STORAGE         │
│  ┌──────────────────┐        ┌─────────────┐         ┌──────────────────┐   │
│  │ party, inventory │        │ JSON.stringify        │ localStorage     │   │
│  │ playerPos, etc   │        │ ❌ SIN       │────────│ ❌ SIN           │   │
│  │ ✅ En memoria    │        │ VERSIONADO  │         │ VERSIONADO       │   │
│  │ ✅ Mutable       │        │ ❌ SIN       │         │ ❌ SIN CHECKSUM  │   │
│  └──────────────────┘        │ CHECKSUM    │         └──────────────────┘   │
│                              └─────────────┘                  │               │
│                                                                │               │
│                                       ❌ NUNCA SE LLAMA       │               │
│                                                                │               │
│                                                                ▼               │
│                                                      ┌──────────────────┐    │
│                                                      │ LOAD GAME on     │    │
│                                                      │ APP INIT         │    │
│                                                      │ ❌ NO EXISTE     │    │
│                                                      │ (Siempre nuevo)  │    │
│                                                      └──────────────────┘    │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: Assets Locales (Dependencia Externa Crítica)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  BLOCK TEXTURES              LOAD TEXTURE            RENDER VOXELS           │
│  CONSTANT                                                                      │
│                                                                                 │
│  ┌──────────────────────┐    ┌────────────────┐    ┌──────────────────┐     │
│  │ URL EXTERNA:         │    │ HTTP Request   │    │ Three.js         │     │
│  │ raw.githubusercontent│    │ ❌ SIN FALLBACK│────│ ✅ Renderiza     │     │
│  │ .com/...grass.png    │───▶│ ❌ SIN RETRY   │    │ pero puede       │     │
│  │                      │    │ ❌ CORS issue  │    │ fallar sin cache │     │
│  │ ❌ HOTLINK           │    │ posible        │    │                  │     │
│  │ ❌ SIN FALLBACK      │    └────────────────┘    └──────────────────┘     │
│  │ ❌ UNA FALLA = CRASH │                                                     │
│  │                      │                                                     │
│  └──────────────────────┘                                                     │
│                          ↓ ALTERNATIVA DISPONIBLE PERO NO USADA                │
│                    ┌──────────────────────┐                                    │
│                    │ download_assets.mjs  │                                    │
│                    │ (Script exists)      │                                    │
│                    │ public/assets/...    │                                    │
│                    │ ❌ NUNCA SE EJECUTA  │                                    │
│                    │ USE_LOCAL_ASSETS =   │                                    │
│                    │ false                │                                    │
│                    └──────────────────────┘                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: IA Táctica (Hardcoded)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ENEMY TURN                  ACTION SELECTION         EXECUTE ACTION           │
│                                                                                 │
│  ┌──────────────────┐       ┌──────────────────┐    ┌──────────────────┐     │
│  │ enemyAI:         │       │ if aiBehavior    │    │ - Move closer    │     │
│  │ BASIC_MELEE      │────▶  │   .SPELLCASTER   │───▶│ - Attack if adj. │     │
│  │ SPELLCASTER      │       │ {                │    │ - "Dark Bolt"    │     │
│  │ BERSERKER        │       │   cast "Dark     │    │ (ONLY THIS)      │     │
│  │ (defined)        │       │   Bolt"          │    │                  │     │
│  │ ✅ Tipos OK      │       │ }                │    │ ❌ HARDCODED     │     │
│  │ ❌ Tácticas      │       │ ❌ HARDCODED     │    │ ❌ NO ESCALABLE  │     │
│  │ NULAS            │       │ ❌ SIN TÁCTICAS  │    │ ❌ PREDECIBLE    │     │
│  │                  │       │                  │    │                  │     │
│  └──────────────────┘       └──────────────────┘    └──────────────────┘     │
│                                                           │                    │
│                                           ❌ SIN PATHFINDING INTELIGENTE      │
│                                           ❌ SIN USO DE HECHIZOS VARIADOS     │
│                                           ❌ SIN PRIORIZACIÓN DE TARGETS      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: Loot Escalado (Random Plano)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ENEMY DEFEATED         LOOT GENERATION             PLAYER INVENTORY          │
│                                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐       ┌──────────────────┐      │
│  │ Type: GOBLIN     │   │ if Math.random   │       │ Item añadido     │      │
│  │ Level: 1         │───│ < dropChance     │──────▶│ ❌ SIN RAREZA    │      │
│  │ XP: 100          │   │ {                │       │ ❌ SIN ESCALADO  │      │
│  │ ✅ OK            │   │   pick random    │       │ Puede ser:       │      │
│  │                  │   │   from ITEMS     │       │ - LEGENDARY lvl1 │      │
│  │                  │   │   (TODO)         │       │ - COMMON lvl20   │      │
│  │                  │   │ }                │       │ (inconsistente)  │      │
│  │                  │   │ ❌ RANDOM PLANO  │       └──────────────────┘      │
│  │                  │   │ ❌ SIN TABLA     │                                  │
│  │                  │   │ ❌ SIN RAREZA    │                                  │
│  └──────────────────┘   └──────────────────┘                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: Quest System (Datos Sin Lógica)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  QUEST DATA          QUEST TRIGGERS            QUEST COMPLETION               │
│  Defined in          Battle actions,           Rewards, UI update             │
│  playerSlice         overworld moves                                           │
│                                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐          │
│  │ id: 'q1'         │   │ ❌ NO TRIGGER    │   │ ❌ NUNCA OCURRE  │          │
│  │ title: 'Quest 1' │   │ ❌ NO PROGRESS   │   │ ❌ SIN REWARDS   │          │
│  │ completed: false │───│ TRACKING        │───│ ❌ SIN UI        │          │
│  │ ✅ DATA OK       │   │ ❌ SIN CALLBACK  │   │                  │          │
│  │ ❌ LÓGICA NULA   │   │                  │   │ Quest tracker:   │          │
│  │                  │   │                  │   │ ❌ NO EXISTE     │          │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ FALTA: Type Safety (any Disperso)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  COMPONENTS             PROPS               RUNTIME ERRORS                     │
│                                                                                 │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐          │
│  │ BattleScene      │   │ entities: any    │   │ "Cannot read     │          │
│  │ BattleUnit       │───│ weather: any     │───│ property 'stats' │          │
│  │ InteractionLayer │   │ position: any    │   │ of undefined"    │          │
│  │ UIOverlay        │   │ ❌ 50+           │   │ ❌ DEBUGGING     │          │
│  │ ... (todos)      │   │ INSTANCIAS       │   │ IMPOSIBLE        │          │
│  │                  │   │ ❌ SIN DOCS      │   │                  │          │
│  │ ❌ UNSAFE        │   │ ❌ PROPS MYSTERY │   │                  │          │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘          │
│                                                                                 │
│  Refactoring es PELIGROSO sin tipos → Bugs silenciosos                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ ESTADO IDEAL: SISTEMA CONECTADO

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    LOOP DE PROGRESIÓN COMPLETO                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BATALLA           XP GANADO          LEVEL UP PARTY      STATS UPDATED         │
│  ┌──────┐          ┌──────┐           ┌──────────┐        ┌──────────┐         │
│  │✅    │──────────│✅    │──────────│✅        │────────│✅        │         │
│  │DERROTA│          │EARNED│          │TRIGGERED│        │RECALC    │         │
│  │ENEMIES│          │XP    │          │LEVEL UP │        │HP/STATS  │         │
│  │ LOOT  │          │      │          │         │        │ NOTIF    │         │
│  └──────┘          └──────┘           └──────────┘        └──────────┘         │
│     │                                                           │                │
│     │  LOOT ESCALADO POR NIVEL/DIFICULTAD                      │                │
│     │  Función: dropLoot(terrain, level, difficulty)           │                │
│     │                                                           │                │
│     └──────────┬───────────────────────────────────────────────┘                │
│                │ ✅ RAREZA APROPIADA                                            │
│                │ ✅ ESCALADO CORRECTO                                           │
│                │ ✅ REWARDS SATISFACTORIOS                                      │
│                ▼                                                                 │
│     ┌──────────────────┐                                                        │
│     │ INVENTORY        │                                                        │
│     │ ✅ Items crecen  │                                                        │
│     │ ✅ Stats mejoran │                                                        │
│     └──────────────────┘                                                        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    SAVE/LOAD ROBUSTO Y AUTOMÁTICO                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  GAMEPLAY STATE        AUTO-SAVE (5 min)      BROWSER STORAGE                   │
│  ┌──────────────┐      ┌───────────────┐      ┌──────────────┐                │
│  │ Party        │      │ JSON + version│      │ localStorage │                │
│  │ Inventory    │─────▶│ + checksum    │─────▶│ ✅ VALIDADO  │                │
│  │ PlayerPos    │      │ ✅ SEGURO     │      │ ✅ VERSIONADO│                │
│  │ etc.         │      │ ✅ PERIÓDICO  │      │ ✅ SERIALIZED│                │
│  └──────────────┘      └───────────────┘      └──────────────┘                │
│                                                        │                        │
│                                                        ▼                        │
│  PAGE RELOAD                                  ┌──────────────────┐            │
│  ┌──────────────┐      LOAD GAME (on init)  │ GAME CONTINUES   │            │
│  │ ✅ Data OK   │◀─────────────────────────│ FROM SAVE        │            │
│  │ ✅ Stats     │      ✅ Validate checksum │ ✅ Seamless      │            │
│  │    preserved │      ✅ Apply migrations  │    experience    │            │
│  │ ✅ Progress  │      ✅ Handle version    │                  │            │
│  │    intact    │      mismatch             │                  │            │
│  └──────────────┘                           └──────────────────┘            │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    ASSETS LOCALES CON FALLBACK                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INIT APP                     LOAD TEXTURE                 RENDER               │
│  ┌──────────────┐             ┌─────────────────┐         ┌──────────┐         │
│  │ Check:       │             │ Try:            │         │ ✅       │         │
│  │ USE_LOCAL_   │──✅────────▶│ /assets/local   │────────▶│ TEXTURE │         │
│  │ ASSETS = true│  LOCAL OK   │ Fallback:       │  ✅ OK  │ LOADS   │         │
│  │              │             │ https://external│         │         │         │
│  │              │             │ ✅ FALLBACK     │         │         │         │
│  │ ✅ ASSETS    │             │ Handle CORS     │         │         │         │
│  │ DOWNLOADED   │             │ ✅ RETRY        │         │         │         │
│  │              │             │                 │         │         │         │
│  └──────────────┘             └─────────────────┘         └──────────┘         │
│                                                                                  │
│  Result: ✅ Juego funciona sin Internet                                        │
│  Result: ✅ Una falla externa NO quiebra el juego                              │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    IA ENEMIGA INTELIGENTE Y VARIADA                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ENEMY TURN             ACTION SELECTION            EXECUTE TÁCTICO             │
│                                                                                  │
│  ┌──────────────┐       ┌──────────────────┐       ┌──────────────┐           │
│  │ Types:       │       │ if health < 30%: │       │ Castear      │           │
│  │ BASIC_MELEE  │───┐   │  try heal or     │───┐   │ "Cure Wounds"│           │
│  │ SPELLCASTER  │   │   │  flee            │   │   │ al aliado    │           │
│  │ BERSERKER    │   │   │ else if target   │   │   │ ✅ TÁCTICA   │           │
│  │ TACTICAL     │   │   │  weakest:        │   │   │              │           │
│  │              │   │   │  use appropriate │   │   │ O atacar al  │           │
│  │ ✅ ALL TYPES │   │   │  spell           │   │   │ healer débil │           │
│  │ IMPLEMEN.    │   │   │ ✅ VARIADO       │   │   │ ✅ PRIORIDAD │           │
│  │              │   │   │ ✅ ESCALABLE     │   │   │ ✅ COSTOSO   │           │
│  └──────────────┘   │   │ ✅ A* PATHFIND   │   │   │              │           │
│                     │   └──────────────────┘   │   └──────────────┘           │
│                     │                          │                              │
│                     └──────────────────────────┘                              │
│                                                                                │
│  Result: ✅ Combates variados y desafiantes                                   │
│  Result: ✅ Enemigos son amenaza real                                         │
│  Result: ✅ Estrategia de jugador importa                                     │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    QUESTS & NARRATIVA FUNCIONAL                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  QUEST DEFINITION       QUEST TRIGGER         QUEST COMPLETION                 │
│  ┌──────────────┐       ┌─────────────┐      ┌──────────────┐                │
│  │ id, title    │       │ Kill 5      │      │ ✅ Progress  │                │
│  │ type, desc   │────▶  │ goblins     │──────│ tracked in   │                │
│  │ ✅ DATA OK   │       │ ✅ TRIGGER  │      │ UI panel     │                │
│  │              │       │ ✅ CALLBACK │      │ ✅ REWARDS   │                │
│  │              │       │ ✅ CHECKS   │      │ ✅ NARRATIVE │                │
│  └──────────────┘       └─────────────┘      │ FEEDBACK     │                │
│                                               └──────────────┘                │
│                                                                                │
│  Result: ✅ Progresión narrativa clara                                        │
│  Result: ✅ Goals motivantes para jugador                                     │
│  Result: ✅ Rewards satisfactorios                                            │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    TYPE SAFETY COMPLETA                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COMPONENTS              PROPS TYPING         RUNTIME SAFETY                    │
│  ┌──────────────┐        ┌──────────────┐     ┌──────────────┐               │
│  │ BattleScene  │        │ interface    │     │ ✅ TypeScript│               │
│  │ BattleUnit   │───────▶│ BattleScene  │────▶│ catches      │               │
│  │ Interaction  │        │ Props {      │     │ errors at    │               │
│  │ Layer        │        │ entities:    │     │ compile time │               │
│  │ UIOverlay    │        │ EntityWith   │     │ ✅ 0 any     │               │
│  │              │        │ Stats[]      │     │ ✅ SAFE      │               │
│  │ ✅ SAFE      │        │ ...          │     │              │               │
│  │ ✅ 0 any     │        │ }            │     │              │               │
│  │              │        │ ✅ TIPOS OK  │     │              │               │
│  └──────────────┘        └──────────────┘     └──────────────┘               │
│                                                                                │
│  Result: ✅ Debugging fácil                                                   │
│  Result: ✅ Refactoring seguro                                                │
│  Result: ✅ Mantenimiento sostenible                                          │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 MATRIX DE TRANSFORMACIÓN

**Cómo cada tarea conecta los cabos:**

| Cabo Suelto | Tarea de Reconexión | Archivo | Impacto |
|-------------|-------------------|---------|---------|
| levelUpParty() vacío | 1.1 Implementar | playerSlice.ts | 🔴 Desbloquea loop XP |
| XP → Level Up | 1.2 Conectar battleSlice | battleSlice.ts | 🔴 Loop completo |
| Sin notificación | 1.3 UI feedback | LevelUpNotification.tsx | 🟡 UX improvement |
| Assets externos | 1.4 Usar locales | constants.ts | 🔴 Resiliencia crítica |
| Save sin versión | 2.1 Versioning | overworldSlice.ts | 🔴 Saves robustos |
| Sin persistencia | 2.2-2.3 UI + AutoSave | App.tsx, MainMenu.tsx | 🔴 Sesiones largas |
| Loot random | 3.1-3.2 Escalabilidad | lootTables.ts | 🟡 Balance económico |
| Type `any` | 4.1 Type Safety | tipos.ts | 🟢 Mantenibilidad |
| IA hardcoded | 4.2 Tácticas | enemyAI.ts | 🟢 Profundidad gameplay |

---

## 🔄 FLUJOS DE EJECUCIÓN ANTES/DESPUÉS

### Antes (Actual):
```
Jugar → Ganar XP → [NADA] → Salir juego → Perder todo
                    ❌ Loop roto
```

### Después (Ideal):
```
Jugar → Ganar XP → Subir Nivel → Stats Mejoran → Salir juego 
         ↓                                              ↓
      Guardar                                    Cargar Save
        ✅ Loop completo + persistencia
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

Después de cada tarea, verificar que:

- [ ] Las conexiones de datos fluyen correctamente
- [ ] UI muestra cambios en tiempo real
- [ ] Logs documentan cada paso
- [ ] No hay `any` nuevos introducidos
- [ ] TypeScript compila sin errores
- [ ] Funciona sin Internet (local assets)
- [ ] Save/Load preserva estado


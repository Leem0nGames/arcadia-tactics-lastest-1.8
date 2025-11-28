# 🎯 QUICK START GUIDE - Reconectar Cabos Sueltos

**Tiempo total de lectura:** 5 minutos  
**Complejidad:** Baja  
**Para quién:** Developers implementando las fixes

---

## 🚀 EMPEZAR AHORA (Next 30 seconds)

```bash
# 1. Abre terminal en el repo
cd /workspaces/arcadia-tactics-lastest-1.8

# 2. Lee los 3 documentos más importantes:
cat EXECUTIVE_SUMMARY.md          # ← Empieza aquí (5 min)
cat CONNECTION_DIAGRAM.md         # ← Después (10 min)
cat IMPLEMENTATION_ROADMAP.md     # ← Luego (15 min)

# 3. Mira el status actual:
git status
npm start  # Si tienes tiempo, verifica que compila
```

---

## 📍 LOS 3 CABOS MÁS CRÍTICOS (Fix estas PRIMERO)

### 🔴 CABO #1: levelUpParty() VACÍA

**Ubicación:** `store/slices/playerSlice.ts` línea ~163

**Síntoma:** 
- Ganas XP pero nunca subes de nivel
- Stats nunca mejoran
- Progresión: 0%

**Fix Rápido (15 minutos):**
1. Abre `playerSlice.ts`
2. Busca `levelUpParty: () => {`
3. Reemplaza con código en `IMPLEMENTATION_ROADMAP.md` Task 1.1
4. `npm start` → Testea crear char → Combate → Ver si sube nivel

**Verificación:**
```typescript
// Antes: ❌
levelUpParty: () => {
  // ... vacío
}

// Después: ✅
levelUpParty: () => {
  set(state => {
    const party = state.party.map(member => {
      if (member.stats.xp >= member.stats.xpToNextLevel) {
        // ... implementación completa
      }
      return member;
    });
    return { party };
  });
}
```

---

### 🔴 CABO #2: Assets HOTLINKED (Sin Fallback)

**Ubicación:** `constants.ts` → `BLOCK_TEXTURES`

**Síntoma:**
- Si GitHub cae → Juego sin texturas
- 404 errors en console
- Sin fallback local

**Fix Rápido (5 minutos):**
```bash
# 1. Ejecutar script
node download_assets.mjs

# 2. Verificar que se descargaron
ls -la public/assets/wesnoth/terrain/ | head -20

# 3. En constants.ts cambiar:
USE_LOCAL_ASSETS = false  // ❌ ANTES
USE_LOCAL_ASSETS = true   // ✅ DESPUÉS

# 4. Test
npm start  # Verifica 0 404s en batalla
```

**Verificación:**
```typescript
// En constants.ts:
const USE_LOCAL_ASSETS = true; // ✅ ← Debe ser true

export const BLOCK_TEXTURES = {
  [TerrainType.GRASS]: USE_LOCAL_ASSETS 
    ? '/assets/wesnoth/terrain/grass/grass0.png'
    : 'https://raw.githubusercontent.com/.../grass0.png',
  // ... más
};
```

---

### 🔴 CABO #3: Save/Load SIN VERSIONADO (Se corrompen)

**Ubicación:** `store/slices/overworldSlice.ts` → `saveGame()` / `loadGame()`

**Síntoma:**
- Cambias schema (ej: añades propiedad a Entity)
- Usuario carga save antiguo
- CRASH

**Fix Rápido (2-3 horas):**
1. Abre `overworldSlice.ts`
2. Busca `saveGame: () => {`
3. Implementa versionado + checksum (código en IMPLEMENTATION_ROADMAP.md Task 2.1)
4. Test: Guardar → Cambiar schema → Cargar (debe migrar sin crash)

**Verificación:**
```typescript
// Antes: ❌
localStorage.setItem('arcadia_save', JSON.stringify(state));

// Después: ✅
const saveData = {
  version: CURRENT_SAVE_VERSION,
  timestamp: Date.now(),
  checksum: calculateChecksum(state),
  data: state,
};
// NOTE: SAVE_KEY is now `arcadia_tactics_save_v2` (defined in `overworldSlice.ts`)
localStorage.setItem('arcadia_tactics_save_v2', JSON.stringify(saveData));
```

**Inspección rápida (DevTools → Application → Local Storage):**
```bash
# Verifica que la clave existe y contiene `version`, `checksum`, `data`
# Ejemplo (Chrome DevTools - Application > Local Storage):
# Key: arcadia_tactics_save_v2
# Value: { "version": 3, "timestamp": 169..., "checksum": "abcd1234", "data": { ... } }
```

**Force-load (dev only)**

Si quieres forzar la carga de un save que falla la verificación (solo para pruebas):

1. Abre DevTools → Console
2. Ejecuta:

```js
localStorage.setItem('arcadia_tactics_save_v2_force_load', 'true');
```

3. Intenta cargar el juego desde la UI. El loader detectará la clave y permitirá la carga pese al checksum.

Advertencia: usar solo en desarrollo — forzar carga puede provocar inconsistencias en runtime.


---

## 📊 VER EL ESTADO ACTUAL

**Ejecuta esto para confirmar los problemas:**

```bash
# 1. Busca las funciones vacías:
grep -n "levelUpParty: () => {" store/slices/playerSlice.ts

# 2. Busca `any` disperso:
grep -r ": any" components/ | wc -l
# Resultado esperado: 40+

# 3. Verifica assets externos:
grep -r "raw.githubusercontent.com" . --include="*.ts" --include="*.tsx" | wc -l
# Resultado esperado: 10+

# 4. Busca save sin versión:
grep -n "JSON.stringify(state)" store/slices/overworldSlice.ts
# Debe ser ANTES de refactorizar

# 5. Verifica si assets locales existen:
ls -la public/assets/wesnoth/terrain/grass/ 2>/dev/null | wc -l
# Si 0 → Necesitas ejecutar: node download_assets.mjs
```

---

## 🎯 PLAN DE 5 DÍAS

### DÍA 1: Bloqueadores (4 horas)
```
9:00-10:00   → Leer documentación
10:00-11:00  → Ejecutar download_assets.mjs (Task 1.4)
11:00-12:00  → Cambiar USE_LOCAL_ASSETS = true
12:00-1:00   → Lunch break
1:00-5:00    → Implementar levelUpParty() (Task 1.1)
5:00-6:00    → Testing básico
```

### DÍA 2: Conectar XP (3 horas)
```
9:00-11:00   → Conectar XP a battleSlice (Task 1.2)
11:00-12:00  → Crear LevelUpNotification (Task 1.3)
12:00-1:00   → Lunch
1:00-3:00    → Testing + Fixes
3:00-6:00    → Buffer / Documentation
```

### DÍA 3-4: Save System (8 horas)
```
DÍA 3:
9:00-12:00   → Implementar versionado (Task 2.1)
1:00-5:00    → Testing + migraciones

DÍA 4:
9:00-10:00   → Crear UI "Continue Game" (Task 2.2)
10:00-11:00  → Auto-save (Task 2.3)
11:00-12:00  → Testing
1:00-3:00    → Buffer
```

### DÍA 5: Polish (4 horas)
```
9:00-11:00   → Loot tables básico (Task 3.1)
11:00-12:00  → Testing integración
12:00-1:00   → Lunch
1:00-5:00    → Documentation + demo
```

---

## 🔍 VERIFICAR QUE TODO FUNCIONA

Después de cada tarea, ejecuta estos tests:

### Test 1: Level Up Works
```typescript
// Abrir consola del navegador (F12)
// 1. Crear personaje
// 2. Ganar 300+ XP en batalla
// 3. Verificar en consola:
console.log(store.party[0].stats.level);  // Debe ser 2
console.log(store.party[0].stats.xp);     // Debe ser ~0
```

### Test 2: Save/Load Works
```typescript
// 1. Jugar partida
// 2. F12 → Storage → localStorage → Ver 'arcadia_save_v1'
// 3. Recargar página
// 4. Verificar que pos/inventory/party se restauran
```

### Test 3: Assets Load
```typescript
// 1. F12 → Network tab
// 2. Entrar a batalla
// 3. Verificar que NO hay 404s
// 4. Todas las texturas son /assets/local/
```

---

## 🐛 DEBUGGING RÁPIDO

| Problema | Solución |
|----------|----------|
| "levelUpParty is not a function" | Verifica que implementaste completo, sin errores de sintaxis |
| 404 en texturas | Ejecuta `node download_assets.mjs` y cambia `USE_LOCAL_ASSETS = true` |
| Save corrupted error | Borra localStorage (Dev Tools → Storage → Clear All) |
| TypeScript errors | Verifica que importaste los tipos correctos |
| "Cannot read property 'stats' of undefined" | Asegúrate que `party` está inicializado antes de usar |

---

## 📁 ARCHIVOS CLAVE A TOCAR

```
store/slices/
├── playerSlice.ts        ← levelUpParty() está aquí
├── battleSlice.ts        ← Conectar XP aquí
└── overworldSlice.ts     ← Save/Load aquí

components/
├── LevelUpNotification.tsx (crear nuevo)
└── MainMenu.tsx           (crear nuevo)

constants.ts              ← USE_LOCAL_ASSETS aquí

public/assets/            ← Assets descargados aquí
```

---

## ✅ CHECKLIST DE COMPLETITUD

Después de WEEK 1:

- [ ] `levelUpParty()` está implementado
- [ ] XP conecta a level up
- [ ] LevelUpNotification muestra cuando subes nivel
- [ ] Assets descargan locales sin 404s
- [ ] Save/Load funciona con versionado
- [ ] Auto-save cada 5 minutos
- [ ] UI "Continue Game" existe
- [ ] `npm start` compila sin errores
- [ ] npm test pasa (si aplica)
- [ ] Demo funciona: Crear → Combate → Level → Guardar → Recargar

---

## 🚀 PRÓXIMOS PASOS DESPUÉS

Una vez terminado Week 1:
1. Pasar a Task 3.1-3.2 (Loot Tables)
2. Pasar a Task 4.1 (Type Safety)
3. Pasar a Task 4.2 (Better AI)

---

## 📞 AYUDA RÁPIDA

**¿Qué archivo edito para X?**
- XP/Level Up → `playerSlice.ts`
- Conectar a batalla → `battleSlice.ts`
- Save/Load → `overworldSlice.ts`
- UI → `components/`
- Assets → `constants.ts`

**¿Dónde está el código exacto?**
- `IMPLEMENTATION_ROADMAP.md` tiene TODO el código
- Busca por Task number (ej: "Task 1.1")

**¿Cuánto tiempo toma?**
- Week 1 (Bloqueadores): 10 horas
- Week 2-3 (Persistencia): 12 horas
- Week 4-5 (Profundidad): 20 horas

---

## 🎮 RESULTADO FINAL

```
ANTES:
├─ Ganas XP
├─ Nada pasa
├─ Salves
└─ Se corrompe

DESPUÉS:
├─ Ganas XP
├─ Subes nivel
├─ Stats mejoran
├─ Notificación celebra
├─ Guardas automático
├─ Recargas la página
└─ Continúas desde el save ✅
```

---

**Status:** 🟢 LISTO PARA IMPLEMENTAR  
**Tiempo estimado:** 30-40 días hábiles  
**Próxima acción:** Ejecuta `node download_assets.mjs` hoy


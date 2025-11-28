# Puntos de Optimización - Arcadia Tactics

## 🔴 CRÍTICAS (Alto Impacto)

### 1. **`validTargets` está calculándose cada render en App.tsx**
**Ubicación:** `App.tsx:85-98`  
**Problema:** Se recalcula en cada frame aunque los parámetros no cambien  
**Impacto:** O(n²) en cada render (filtering + line of sight check)  
**Solución:**
```tsx
// Mover validTargets a un useCallback con mejor memoización
const validTargets = useCallback(() => { 
  // cálculo...
}, [gameState, selectedAction, hasActed, battleEntities, activeEntity, store]);
```
**Prioridad:** ⭐⭐⭐⭐⭐

---

### 2. **BattleScene no memoiza props ni usa `React.memo` correctamente**
**Ubicación:** `components/BattleScene.tsx`  
**Problema:** Se recalcula todo aunque solo cambie `validMoves` o `validTargets`  
**Solución:**
```tsx
export const BattleScene = React.memo(({ entities, weather, ... }: any) => {
  // componente
}, (prev, next) => {
  // Custom comparación para evitar recálculos innecesarios
  return prev.validMoves === next.validMoves && 
         prev.validTargets === next.validTargets &&
         prev.entities === next.entities;
});
```
**Prioridad:** ⭐⭐⭐⭐⭐

---

### 3. **`store.hasLineOfSight()` se ejecuta en cada filtrado**
**Ubicación:** `App.tsx:96`, en validTargets  
**Problema:** Se ejecuta sin caché, puede ser O(n²) o peor  
**Solución:**
```tsx
// Implementar caché LRU para line of sight checks
// Almacenar resultados: Map<"x1,y1,x2,y2", boolean>
const losCache = useRef<Map<string, boolean>>(new Map());
```
**Prioridad:** ⭐⭐⭐⭐

---

### 4. **Texturas de Minecraft no se precargan**
**Ubicación:** `components/battle/TerrainLayer.tsx`  
**Problema:** Todas las texturas se cargan on-demand, causa lag en primera batalla  
**Solución:**
```tsx
// En components/BattleScene.tsx, precargar texturas:
useEffect(() => {
  const textureUrls = Object.values(ASSETS.BLOCK_TEXTURES);
  textureUrls.forEach(url => useTexture(url)); // Precarga
}, []);
```
**Prioridad:** ⭐⭐⭐⭐

---

## 🟡 IMPORTANTES (Medio Impacto)

### 5. **`generateBattleGrid()` recalcula todo cada batalla**
**Ubicación:** `store/slices/battleSlice.ts:50-85`  
**Problema:** Se regenera toda la grilla cada vez aunque el patrón pueda cachearse  
**Solución:**
```tsx
// Cachear por terrainType
const gridCache = new Map<TerrainType, BattleCell[]>();
const generateBattleGrid = (terrainType: TerrainType) => {
  if (gridCache.has(terrainType)) return gridCache.get(terrainType)!;
  const grid = /* ... generar ... */;
  gridCache.set(terrainType, grid);
  return grid;
};
```
**Prioridad:** ⭐⭐⭐

---

### 6. **`OverworldMap` recalcula todo a cada scroll**
**Ubicación:** `components/OverworldMap.tsx`  
**Problema:** Cálculos de hexágonos y rendering de mapa completo sin virtualización  
**Solución:**
```tsx
// Implementar viewport-based culling
// Solo renderizar hexágonos visibles
const visibleHexes = useMemo(() => {
  return hexes.filter(hex => {
    const { x, y } = hexToPixel(hex.q, hex.r);
    return x > -100 && x < width + 100 && y > -100 && y < height + 100;
  });
}, [hexes, width, height]);
```
**Prioridad:** ⭐⭐⭐

---

### 7. **BillboardUnit se remonta en cada frame**
**Ubicación:** `components/battle/BillboardUnit.tsx:42-50`  
**Problema:** Uso de `useFrame` sin memoización causa re-renders innecesarios  
**Solución:**
```tsx
export const BillboardUnit = React.memo(({ ... }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lastPositionRef = useRef(position);
  
  useFrame((state) => {
    if (!groupRef.current || position === lastPositionRef.current) return;
    // actualizar...
    lastPositionRef.current = position;
  });
  // ...
}, (prev, next) => prev.position === next.position);
```
**Prioridad:** ⭐⭐⭐

---

### 8. **`validMoves` usa BFS sin early-exit optimizado**
**Ubicación:** `App.tsx:48-75`  
**Problema:** Explora todas las celdas hasta llenar el buffer, no optimiza hacia el target  
**Solución:**
```tsx
// Usar A* en lugar de BFS puro para pathfinding
// Agregar heurística: distancia Manhattan/Euclidiana
// Esto reduce nodos explorados significativamente
```
**Prioridad:** ⭐⭐⭐

---

## 🟢 RECOMENDADAS (Bajo Impacto - Mantenimiento)

### 9. **Logs no tienen límite de tamaño**
**Ubicación:** `store/gameStore.ts:38`  
**Problema:** Array de logs crece infinitamente  
**Solución:**
```tsx
addLog: (message, type = 'info') => {
  set(state => {
    const logs = [...(state.logs || []), { message, type, timestamp: Date.now() }];
    return { logs: logs.slice(-500) }; // Mantener últimos 500
  });
}
```
**Prioridad:** ⭐⭐

---

### 10. **SpellEffectsRenderer crea geometrías sin pooling**
**Ubicación:** `components/battle/SpellEffectsRenderer.tsx`  
**Problema:** Crea nuevas geometrías para cada spell sin reuso  
**Solución:**
```tsx
// Implementar Object Pool para geometrías comunes
const geometryPool = useMemo(() => ({
  sphere: new THREE.SphereGeometry(0.3, 16, 16),
  plane: new THREE.PlaneGeometry(1, 1),
}), []);
```
**Prioridad:** ⭐⭐

---

### 11. **Particles (VoidParticles) se renderiza siempre**
**Ubicación:** `components/BattleScene.tsx:112`  
**Problema:** Se renderiza aunque shadow realm no sea activo  
**Solución:**
```tsx
{(isShadowRealm || weather === WeatherType.ASH) && 
  <VoidParticles color={...} floatUp={isShadowRealm} />
}
// Ya está optimizado - ✓ BIEN
```
**Prioridad:** ✓ Implementado

---

### 12. **Canvas DPR está en máximo siempre**
**Ubicación:** `components/BattleScene.tsx:58`  
**Problema:** `dpr={[1, 1.5]}` usa 1.5x pixel ratio en devices altos  
**Solución:**
```tsx
const dpr = window.devicePixelRatio > 2 ? [1, 1.25] : [1, 1.5];
<Canvas ... dpr={dpr} ... />
// O usar adaptive DPR basado en FPS
```
**Prioridad:** ⭐

---

## 📊 Resumen de Impacto

| Prioridad | Esperado | Esfuerzo |
|-----------|----------|----------|
| ⭐⭐⭐⭐⭐ (Crítica) | 30-40% mejora | Alto |
| ⭐⭐⭐ (Importante) | 15-25% mejora | Medio |
| ⭐⭐ (Recomendada) | 5-10% mejora | Bajo |

---

## 🎯 Acciones Recomendadas (Orden)

1. **Memoizar validTargets con useCallback** (~5-10% mejora global)
2. **Implementar caché para line of sight** (~10-15% mejora en batalla)
3. **Precargar texturas al iniciar** (~20% mejora en primera batalla)
4. **Cachear grilla de batalla** (~8% mejora en generación)
5. **Usar viewport culling en OverworldMap** (~15% mejora en overworld)
6. **Implementar A* en pathfinding** (~12% mejora en cálculo de movimientos)
7. **Memoizar BillboardUnit correctamente** (~5% mejora en renderizado)


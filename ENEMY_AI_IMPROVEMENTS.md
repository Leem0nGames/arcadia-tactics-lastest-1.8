# 🎮 Enemy AI Improvements - Week 2

**Fecha:** 28 Noviembre, 2025  
**Status:** ✅ IMPLEMENTADO  
**Ubicación:** `store/slices/battleSlice.ts` → `performEnemyAction()`

---

## 📋 Cambios Implementados

### ✅ 1. Tácticas de Supervivencia
**Antes:** Los enemigos nunca usaban hechizos de curación  
**Ahora:** Si HP < 25%, los SPELLCASTERS intentan curar (`Cure Wounds`)

```typescript
// Low HP check: Flee or Heal logic
if (hpPercent < 0.25 && aiBehavior === AIBehavior.SPELLCASTER) {
    // Cast Cure Wounds on self (1d8 + 3)
}
```

---

### ✅ 2. Selección Inteligente de Targets
**Antes:** Siempre atacaban al primer jugador en la lista  
**Ahora:** Priorizan el jugador más dañado o con menor AC

```typescript
// Smart target selection
const dmgTaken = p.stats.maxHp - p.stats.hp;
const threat = dmgTaken + (p.stats.ac < 12 ? 5 : 0);
// Picks target with highest threat score
```

---

### ✅ 3. Múltiples Hechizos por Tipo
**Antes:** Solo `Dark Bolt` (hardcoded)  
**Ahora:** Múltiples opciones según contexto:

| Contexto | Hechizo | Daño | Uso |
|----------|---------|------|-----|
| Jugador débil + distancia | **Fireball** | 3d8 + 2 | Daño masivo |
| Jugador fuerte + distancia | **Magic Missile** | 3d4 + 1 | Daño seguro |
| Aliado herido | **Cure Wounds** | 1d8 + 3 | Curación táctica |
| Default | **Fire Bolt** | 1d10 + 2 | Eficiente |

```typescript
// Dynamic spell selection
if (allyHurt && Math.random() > 0.6) {
    // Heal ally
} else if (target.stats.hp > 20 && Math.random() > 0.7) {
    // Cast Fireball (AOE damage)
} else {
    // Cast Magic Missile (reliable)
}
```

---

### ✅ 4. Curación de Aliados
**Antes:** Enemigos nunca se curaban mutuamente  
**Ahora:** SPELLCASTERS curan aliados heridos (60% de probabilidad si aplica)

```typescript
const allyHurt = store.battleEntities.find(e => 
    e.type === 'ENEMY' && 
    e.stats.hp < e.stats.maxHp * 0.5 && 
    e.id !== enemy.id
);
if (allyHurt) { /* Heal ally */ }
```

---

### ✅ 5. Pathfinding Mejorado
**Antes:** Simple chase o nada  
**Ahora:** Tres niveles de persecución según distancia

- **Distancia ≤ 1:** Ataque cuerpo a cuerpo
- **Distancia 1-6:** Acercarse paso a paso (rango de hechizo)
- **Distancia > 6:** Persecución agresiva hacia el jugador

```typescript
if (dist <= 1) {
    // Melee attack
} else if (dist > 1 && dist <= 6) {
    // Ranged chase (get in spell range)
} else {
    // Long range chase (pursue aggressively)
}
```

---

## 📊 Impacto en Gameplay

### Antes vs. Después

```
ANTES (Repetitivo):
┌──────────────────────────────────────┐
│ Enemy AI Loop:                       │
├──────────────────────────────────────┤
│ 1. Acérquese al jugador             │
│ 2. Si distancia ≤ 1: Golpe (d6+2)  │
│ 3. Si es SPELLCASTER: Dark Bolt 1x  │
│ 4. Repeat                            │
│ → Predecible, aburrido               │
└──────────────────────────────────────┘

DESPUÉS (Dinámico):
┌──────────────────────────────────────┐
│ Enemy AI Loop:                       │
├──────────────────────────────────────┤
│ 1. Evaluar HP propio (huir si baja) │
│ 2. Priorizar target (+ amenaza)     │
│ 3. Elegir táctico (curar/daño)      │
│ 4. Si SPELLCASTER: múltiples hechizos
│ 5. Coordinar con aliados (curación) │
│ 6. Pathing inteligente               │
│ → Impredecible, desafiante           │
└──────────────────────────────────────┘
```

---

## 🎯 Próximas Mejoras (Opcionales)

### Nivel 1: Comportamientos Avanzados
- [ ] **Formaciones:** Enemigos se posicionan juntos (no aislados)
- [ ] **Flanqueo:** Intentan rodear al jugador
- [ ] **Fuga:** Si HP muy bajo, corren hacia zona segura
- [ ] **Buffs:** SPELLCASTERS lanzan buffs defensivos

### Nivel 2: Aprendizaje
- [ ] **Memoria de ataques:** Evitan el hechizo que hizo más daño
- [ ] **Reacción a magia:** Si jugador castea muchas magias, ataca con física
- [ ] **Economía de recursos:** Gastan slots de hechizo sabiamente

### Nivel 3: Estrategia
- [ ] **Coordinación de grupo:** Esperan a aliados antes de atacar
- [ ] **Priorización dinámica:** Atacan sanadores primero
- [ ] **Retirada táctica:** Se reagrupan si pierden números

---

## 🧪 Testing Recomendado

1. **Combate vs. SPELLCASTER:**
   - [ ] Verificar que lanza múltiples hechizos (no solo Dark Bolt)
   - [ ] Verificar que cura aliados cuando están bajos
   - [ ] Verificar que elige Fire Bolt vs Fireball según HP del target

2. **Combate con múltiples enemigos:**
   - [ ] Verificar que se curan mutuamente
   - [ ] Verificar que priorizan targets correctamente
   - [ ] Verificar que usan Fireball (AOE) si grupo de jugadores

3. **Combate de baja HP:**
   - [ ] Enemigos con < 25% HP lanzan Cure Wounds
   - [ ] Verificar que se curan a sí mismos

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `store/slices/battleSlice.ts` | `performEnemyAction()` reescrito con 200+ líneas de lógica mejorada |

---

## ⏱️ Tiempo Estimado para Próximas Mejoras
- Nivel 1 (Comportamientos): 4-5 horas
- Nivel 2 (Aprendizaje): 6-8 horas
- Nivel 3 (Estrategia): 8-10 horas

---

**Status:** ✅ LISTO PARA TESTING EN DEV SERVER  
**Próxima acción:** Ejecutar `npm run dev` y probar en batalla contra SPELLCASTERS

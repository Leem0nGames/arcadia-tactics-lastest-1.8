import { dropLoot } from '../services/lootTables.js';
import { TerrainType, Difficulty } from '../types.js';

// Simulate many drops and count rarity distribution
const runs = 50000;
const counts = { COMMON: 0, UNCOMMON: 0, RARE: 0, VERY_RARE: 0, LEGENDARY: 0 };

for (let i = 0; i < runs; i++) {
  const res = dropLoot(TerrainType.GRASS, Math.floor(Math.random() * 10) + 1, Difficulty.NORMAL);
  switch (res.rarity) {
    case 0: counts.COMMON++; break;
    case 1: counts.UNCOMMON++; break;
    case 2: counts.RARE++; break;
    case 3: counts.VERY_RARE++; break;
    case 4: counts.LEGENDARY++; break;
  }
}

console.log('Loot simulation runs:', runs);
for (const k of Object.keys(counts)) {
  const v = counts[k];
  console.log(`${k}: ${v} (${((v / runs) * 100).toFixed(2)}%)`);
}

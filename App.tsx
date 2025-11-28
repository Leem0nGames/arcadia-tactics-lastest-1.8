
import React, { useEffect, useMemo, Suspense, useState, useCallback } from 'react';
import { GameState, PositionComponent, BattleAction, Dimension, TerrainType } from './types';
import { OverworldMap } from './components/OverworldMap';
import { BattleScene } from './components/BattleScene';
import { CharacterCreation } from './components/CharacterCreation';
import { UIOverlay } from './components/UIOverlay';
import { BattleResultModal } from './components/BattleResultModal';
import { LevelUpNotification } from './components/LevelUpNotification';
import { useGameStore } from './store/gameStore';
import { AdminDashboard } from './components/admin/AdminDashboard';
import MainMenu from './components/MainMenu';
import { BATTLE_MAP_SIZE } from './constants';

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [levelUpNotifications, setLevelUpNotifications] = useState<Array<{
    character: Entity;
    oldStats: CombatStatsComponent;
    newStats: CombatStatsComponent;
    id: string;
  }>>([]);
  const [previousPartyStats, setPreviousPartyStats] = useState<Partial<Record<string, CombatStatsComponent>> | null>(null);
  
  const store = useGameStore();
  const { 
    gameState, playerPos, battleEntities, turnOrder, currentTurnIndex,
    battleTerrain, battleWeather, battleRewards, selectedAction, hasMoved, hasActed, dimension, townMapData,
    mapDimensions, battleMap, party
  } = store;

  // Routing Check
  useEffect(() => {
      if (window.location.pathname === '/admin') {
          setIsAdmin(true);
      }
  }, []);

  // Initialize World
  useEffect(() => {
      if (!isAdmin) {
          store.initializeWorld();
      }
  }, [isAdmin]);

  // Auto-save: every 5 minutes while in OVERWORLD or BATTLE_TACTICAL
  useEffect(() => {
    const SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    let tid: number | null = null;
    if (store && (gameState === GameState.OVERWORLD || gameState === GameState.BATTLE_TACTICAL)) {
      try {
        // initial quick save when entering state
        store.saveGame?.();
      } catch (e) {}
      tid = window.setInterval(() => {
        try {
          store.saveGame?.();
          store.addLog('Auto-saved.', 'info');
        } catch (e) {
          console.error('Auto-save failed', e);
        }
      }, SAVE_INTERVAL_MS);
    }
    return () => { if (tid) clearInterval(tid); };
  }, [gameState, store]);

  // Detect Level Ups
  useEffect(() => {
    if (!previousPartyStats || !party) {
      setPreviousPartyStats(party?.map(m => ({ ...m.stats })));
      return;
    }

    const newLevelUps: any[] = [];
    party.forEach((member, idx) => {
      const prevMember = previousPartyStats?.[idx];
      if (prevMember && member.stats.level > prevMember.level) {
        newLevelUps.push({
          character: member,
          oldStats: prevMember,
          newStats: member.stats,
          id: `levelup-${member.id}-${Date.now()}`,
        });
      }
    });

    if (newLevelUps.length > 0) {
      setLevelUpNotifications(prev => [...prev, ...newLevelUps]);
    }

    setPreviousPartyStats(party?.map(m => ({ ...m.stats })));
  }, [party]);

  // --- Calculation Helpers ---
  const activeEntityId = turnOrder[currentTurnIndex];
  const activeEntity = battleEntities.find(e => e.id === activeEntityId);

  const validMoves = useMemo(() => {
      if (gameState !== GameState.BATTLE_TACTICAL || selectedAction !== BattleAction.MOVE || hasMoved) return [];
      if (!activeEntity || activeEntity.type !== 'PLAYER') return [];

      const moves: PositionComponent[] = [];
      const speedInTiles = Math.floor(activeEntity.stats.speed / 5);
      
      // BFS for Valid Moves (respecting obstacles)
      const queue: {x: number, y: number, dist: number}[] = [{ x: activeEntity.position.x, y: activeEntity.position.y, dist: 0 }];
      const visited = new Set<string>();
      visited.add(`${activeEntity.position.x},${activeEntity.position.y}`);
      
      // Optimization: Create obstacle map for O(1) lookup
      const obstacleMap = new Set<string>();
      const occupiedMap = new Set<string>();
      battleMap.forEach(cell => {
          if (cell.isObstacle) obstacleMap.add(`${cell.x},${cell.z}`);
      });
      battleEntities.forEach(e => {
          if (e.id !== activeEntity.id) occupiedMap.add(`${e.position.x},${e.position.y}`);
      });
      
      while(queue.length > 0) {
          const curr = queue.shift()!;
          if (curr.dist < speedInTiles) {
               const neighbors = [
                   {x: curr.x+1, y: curr.y}, {x: curr.x-1, y: curr.y},
                   {x: curr.x, y: curr.y+1}, {x: curr.x, y: curr.y-1}
               ];
               
               for(const n of neighbors) {
                   if (n.x >= 0 && n.x < BATTLE_MAP_SIZE && n.y >= 0 && n.y < BATTLE_MAP_SIZE) {
                       const key = `${n.x},${n.y}`;
                       
                       if (!visited.has(key) && !obstacleMap.has(key) && !occupiedMap.has(key)) {
                           visited.add(key);
                           queue.push({ x: n.x, y: n.y, dist: curr.dist + 1 });
                           moves.push({ x: n.x, y: n.y });
                       }
                   }
               }
          }
      }
      return moves;
  }, [gameState, selectedAction, hasMoved, battleEntities, activeEntity, battleMap]);

  const validTargets = useMemo(() => {
      if (gameState !== GameState.BATTLE_TACTICAL || (!selectedAction) || hasActed) return [];
      
      let range = 0;
      if (selectedAction === BattleAction.ATTACK) range = 1;
      else if (selectedAction === BattleAction.MAGIC) range = 6;
      else return [];

      if (!activeEntity || activeEntity.type !== 'PLAYER') return [];

      return battleEntities
        .filter(e => e.type === 'ENEMY')
        .filter(e => {
            const dist = Math.max(Math.abs(activeEntity.position.x - e.position.x), Math.abs(activeEntity.position.y - e.position.y));
            if (dist > range) return false;
            return store.hasLineOfSight(activeEntity.position, e.position);
        })
        .map(e => ({ x: e.position.x, y: e.position.y }));

  }, [gameState, selectedAction, hasActed, battleEntities, activeEntity, store]);

  // Memoizar battleEntities para evitar recálculos innecesarios
  const memoizedBattleEntities = useMemo(() => battleEntities, [battleEntities]);

    if (isAdmin) {
      return <AdminDashboard />;
    }

  // Robust fallback for dimensions to prevent crash if store is hydrating
  const safeDimensions = mapDimensions || { width: 20, height: 15 };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {gameState === GameState.CHARACTER_CREATION && (
          // If no party exists yet, show MainMenu (Continue/New Game). Otherwise show CharacterCreation for rerolls.
          (party && party.length > 0) ? (
            <CharacterCreation onComplete={store.createCharacter} />
          ) : (
            <MainMenu />
          )
      )}

      {(gameState === GameState.OVERWORLD || gameState === GameState.TOWN_EXPLORATION) && (
          <>
            <OverworldMap 
                mapData={townMapData || []} 
                playerPos={playerPos} 
                onMove={store.movePlayerOverworld}
                dimension={dimension}
                width={safeDimensions.width}
                height={safeDimensions.height}
            />
            <UIOverlay />
          </>
      )}

      {(gameState === GameState.BATTLE_TACTICAL || gameState === GameState.BATTLE_VICTORY || gameState === GameState.BATTLE_DEFEAT) && (
          <>
            <Suspense fallback={<div className="flex items-center justify-center h-full w-full text-amber-400 font-serif animate-pulse">Loading Battle...</div>}>
                <BattleScene 
                    entities={battleEntities} 
                    terrainType={battleTerrain}
                    weather={battleWeather}
                    currentTurnEntityId={turnOrder[currentTurnIndex]}
                    onTileClick={store.handleTileInteraction}
                    validMoves={validMoves}
                    validTargets={validTargets}
                />
                <UIOverlay />
            </Suspense>

            {(gameState === GameState.BATTLE_VICTORY || gameState === GameState.BATTLE_DEFEAT) && (
                <BattleResultModal 
                    type={gameState === GameState.BATTLE_VICTORY ? 'victory' : 'defeat'}
                    rewards={gameState === GameState.BATTLE_VICTORY ? battleRewards : undefined}
                    onContinue={store.continueAfterVictory}
                    onRestart={store.restartBattle}
                    onQuit={store.quitToMenu}
                />
            )}
          </>
      )}

      {/* Level Up Notifications */}
      {levelUpNotifications.map(notification => (
        <LevelUpNotification
          key={notification.id}
          character={notification.character}
          oldStats={notification.oldStats}
          newStats={notification.newStats}
          onDismiss={() => setLevelUpNotifications(prev => prev.filter(n => n.id !== notification.id))}
        />
      ))}
    </div>
  );
};

export default App;

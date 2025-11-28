
import React, { useRef, useEffect, useState } from 'react';
import { GameState, Dimension, BattleAction } from '../types';
import { useGameStore } from '../store/gameStore';
import { InventoryScreen } from './InventoryScreen';
import { WorldMapScreen } from './WorldMapScreen';
import { SPELLS as SPELL_DB, CLASS_SPELLS as CLASS_SPELLS_DB } from '../constants';

export const UIOverlay: React.FC = () => {
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showSkillDrawer, setShowSkillDrawer] = useState(false);
  
  const { 
      logs, gameState, party, turnOrder, currentTurnIndex, 
      isInventoryOpen, isMapOpen, toggleInventory, toggleMap, playerPos, dimension,
      standingOnPortal, standingOnSettlement, usePortal, enterSettlement, saveGame, loadGame, quitToMenu, 
      battleEntities, activeOverworldEnemies, selectAction, selectSpell, hasMoved, hasActed,
      lootDrops, collectLoot
  } = useGameStore();

  useEffect(() => {
      setShowSkillDrawer(false);
  }, [currentTurnIndex]);

  const activeEntityId = turnOrder[currentTurnIndex];
  const activeEntity = battleEntities.find(e => e.id === activeEntityId);
  const isPlayerTurn = activeEntity?.type === 'PLAYER';

  const currentLootDrop = isPlayerTurn && activeEntity 
      ? lootDrops.find(d => d.position.x === activeEntity.position.x && d.position.y === activeEntity.position.y) 
      : null;

  const turnQueue = [];
  if (gameState === GameState.BATTLE_TACTICAL && turnOrder.length > 0) {
      for(let i = 0; i < 8; i++) {
          const idx = (currentTurnIndex + i) % turnOrder.length;
          const entId = turnOrder[idx];
          const ent = battleEntities.find(e => e.id === entId);
          if (ent && ent.stats.hp > 0) turnQueue.push({ ...ent, isCurrent: i === 0 });
      }
  }

  const availableSpells = (isPlayerTurn && activeEntity?.stats.class) 
    ? CLASS_SPELLS_DB[activeEntity.stats.class].map(id => SPELL_DB[id.toUpperCase()]).filter(Boolean) 
    : [];

  const handleAction = (action: BattleAction) => {
      if (action === BattleAction.MAGIC) {
          setShowSkillDrawer(true);
      } else {
          selectAction(action);
      }
  };

  const handleSpellClick = (spellId: string) => {
      selectSpell(spellId);
      selectAction(BattleAction.MAGIC); 
      setShowSkillDrawer(false);
  };

  const isCautionMode = gameState === GameState.OVERWORLD && activeOverworldEnemies.some(e => {
      if (e.dimension !== dimension) return false;
      const dist = (Math.abs(e.q - playerPos.x) + Math.abs(e.q + e.r - playerPos.x - playerPos.y) + Math.abs(e.r - playerPos.y)) / 2;
      return dist <= e.visionRange;
  });

  const recentLog = logs.length > 0 ? logs[logs.length - 1] : null;

  if (gameState === GameState.CHARACTER_CREATION) return <div className="absolute top-4 right-4 z-50"><button onClick={loadGame} className="text-slate-500 hover:text-amber-400 text-xs font-bold uppercase tracking-widest border border-slate-700 px-3 py-1 rounded bg-black/50 backdrop-blur">Load Game</button></div>;

  return (
    <>
        {dimension === Dimension.UPSIDE_DOWN && <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_150px_rgba(88,28,135,0.4)] animate-pulse" style={{ animationDuration: '4s' }} />}
        
        {isCautionMode && (
            <div className="pointer-events-none fixed top-20 left-0 right-0 h-10 z-10 flex items-center justify-center">
                <span className="bg-red-900/80 text-red-200 px-4 py-1 rounded-full font-bold tracking-[0.2em] text-[10px] border border-red-500 animate-pulse shadow-lg backdrop-blur">⚠ THREAT</span>
            </div>
        )}

        {isInventoryOpen && <InventoryScreen />}
        {isMapOpen && <WorldMapScreen />}

        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between overflow-hidden">
            
            <div className="flex flex-col w-full bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-3 pb-8 px-4 pointer-events-auto">
                <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
                    
                    {gameState === GameState.BATTLE_TACTICAL ? (
                        <div className="flex-1 overflow-x-auto no-scrollbar mx-2 mask-linear-fade">
                            <div className="flex items-center gap-2">
                                {turnQueue.map((ent, idx) => (
                                    <div key={`${ent.id}-${idx}`} className={`relative transition-all duration-300 shrink-0 ${ent.isCurrent ? 'scale-100 z-10' : 'scale-75 opacity-60 grayscale'}`}>
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 overflow-hidden shadow-md bg-slate-900 ${ent.isCurrent ? 'border-amber-400 ring-2 ring-amber-500/30' : ent.type === 'ENEMY' ? 'border-red-800' : 'border-slate-600'}`}>
                                            <img src={ent.visual.spriteUrl} className="w-full h-full object-cover scale-150 translate-y-1 pixelated" />
                                        </div>
                                        {ent.type === 'ENEMY' && ent.isCurrent && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center border border-black text-[8px]">⚔️</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <div className="flex-1" />}

                    <div className="flex gap-2 items-center shrink-0">
                         {gameState === GameState.TOWN_EXPLORATION && (
                            <div className="hidden md:block bg-amber-900/90 text-amber-100 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-500 shadow-lg mr-2">
                                CITY
                            </div>
                        )}
                        <CircleBtn onClick={toggleMap} icon="📜" />
                        <CircleBtn onClick={toggleInventory} icon="🎒" />
                        <div className="relative">
                            <CircleBtn onClick={() => setShowSystemMenu(!showSystemMenu)} icon="⚙️" />
                            {showSystemMenu && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-50">
                                    <button onClick={() => { saveGame(); setShowSystemMenu(false); }} className="px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 border-b border-slate-800">SAVE</button>
                                    <button onClick={() => { loadGame(); setShowSystemMenu(false); }} className="px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-800 border-b border-slate-800">LOAD</button>
                                    <button onClick={() => { quitToMenu(); setShowSystemMenu(false); }} className="px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-red-900/20">QUIT</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-20 left-0 right-0 flex flex-col items-center pointer-events-none space-y-2 px-4 z-10">
                {recentLog && (
                    <div key={recentLog.timestamp} className={`animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 px-4 py-2 rounded-lg backdrop-blur-md shadow-lg border text-xs font-bold font-mono text-center max-w-sm
                        ${recentLog.type === 'combat' ? 'bg-red-900/80 border-red-500 text-red-100' : recentLog.type === 'loot' ? 'bg-yellow-900/80 border-yellow-500 text-yellow-100' : 'bg-slate-900/80 border-slate-600 text-slate-200'}
                    `}>
                        {recentLog.message}
                    </div>
                )}
                
                <div className="pointer-events-auto space-y-2">
                    {gameState === GameState.OVERWORLD && standingOnPortal && (
                        <InteractionBtn onClick={usePortal} icon="🌀" label={dimension === Dimension.NORMAL ? "Enter Shadow" : "Return Light"} color="purple" />
                    )}
                    {gameState === GameState.OVERWORLD && standingOnSettlement && (
                        <InteractionBtn onClick={enterSettlement} icon="🏰" label="Enter City" color="amber" />
                    )}
                    
                    {gameState === GameState.BATTLE_TACTICAL && currentLootDrop && !hasActed && (
                        <InteractionBtn onClick={() => collectLoot(currentLootDrop.id)} icon="💰" label="Grab Loot" color="amber" />
                    )}
                </div>
            </div>

            <div className="flex flex-col justify-end p-4 pb-6 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-auto">
                <div className="max-w-7xl mx-auto w-full flex items-end justify-between">
                    
                    {gameState === GameState.BATTLE_TACTICAL && activeEntity && (
                        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2 pr-4 rounded-xl border border-slate-700/50 shadow-2xl animate-in slide-in-from-left-4 duration-500 max-w-[200px] md:max-w-xs">
                            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg border border-slate-500 overflow-hidden shrink-0 bg-slate-800">
                                <img src={activeEntity.visual.spriteUrl} className="w-full h-full object-cover scale-150 translate-y-1 pixelated" />
                            </div>
                            
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-slate-300 truncate leading-none mb-0.5">{activeEntity.name}</div>
                                <StatusBar current={activeEntity.stats.hp} max={activeEntity.stats.maxHp} color="bg-red-500" label="HP" />
                                <StatusBar current={activeEntity.stats.stamina} max={activeEntity.stats.maxStamina} color="bg-amber-400" label="STM" />
                                {activeEntity.stats.spellSlots.max > 0 && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {Array.from({ length: activeEntity.stats.spellSlots.max }).map((_, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < activeEntity.stats.spellSlots.current ? 'bg-purple-400 shadow-[0_0_4px_#a855f7]' : 'bg-slate-700'}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {gameState !== GameState.BATTLE_TACTICAL && (
                        <div className="flex gap-2 overflow-x-auto max-w-[60vw] pb-2 no-scrollbar mask-linear-fade-right">
                            {party.map(p => (
                                <div key={p.id} className="w-12 h-12 rounded-full border border-slate-600 bg-slate-900 overflow-hidden shrink-0 opacity-90">
                                    <img src={p.visual.spriteUrl} className="w-full h-full object-cover scale-150 translate-y-1 pixelated" />
                                </div>
                            ))}
                        </div>
                    )}

                    {gameState === GameState.BATTLE_TACTICAL && isPlayerTurn && (
                        <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-8 duration-500 relative z-30">
                            
                            <div className="flex gap-3 mr-1">
                                <SmallActionBtn label="Run" icon="🏃" onClick={() => selectAction(BattleAction.RUN)} disabled={hasActed} />
                                <SmallActionBtn label="Wait" icon="⏳" onClick={() => selectAction(BattleAction.WAIT)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <BigActionBtn 
                                    label="Move" 
                                    icon="🦶" 
                                    color="bg-blue-600" 
                                    disabled={hasMoved} 
                                    onClick={() => handleAction(BattleAction.MOVE)} 
                                />
                                <BigActionBtn 
                                    label="Attack" 
                                    icon="⚔️" 
                                    color="bg-red-600" 
                                    disabled={hasActed} 
                                    onClick={() => handleAction(BattleAction.ATTACK)} 
                                    primary
                                />
                                <BigActionBtn 
                                    label="Skills" 
                                    icon="✨" 
                                    color="bg-purple-600" 
                                    disabled={hasActed} 
                                    onClick={() => handleAction(BattleAction.MAGIC)} 
                                />
                                <BigActionBtn 
                                    label="Item" 
                                    icon="🎒" 
                                    color="bg-emerald-600" 
                                    disabled={hasActed} 
                                    onClick={() => handleAction(BattleAction.ITEM)} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showSkillDrawer && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto" onClick={() => setShowSkillDrawer(false)}>
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl p-4 md:p-6 animate-in slide-in-from-bottom-full duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest">Grimoire</h3>
                            <button onClick={() => setShowSkillDrawer(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {availableSpells.length > 0 ? availableSpells.map(spell => {
                                const canCast = spell.level === 0 || activeEntity!.stats.spellSlots.current > 0;
                                return (
                                    <button 
                                        key={spell.id} 
                                        disabled={!canCast}
                                        onClick={() => handleSpellClick(spell.id)}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-center group active:scale-95"
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-950 border border-slate-600 group-hover:border-purple-400 shadow-inner">
                                            {spell.type === 'HEAL' ? '💚' : '⚡'}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">{spell.name}</div>
                                            <div className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{spell.level === 0 ? 'Cantrip' : '1 Slot'}</div>
                                        </div>
                                    </button>
                                );
                            }) : <div className="col-span-full text-center text-sm text-slate-500 py-8">No spells known.</div>}
                        </div>
                    </div>
                </div>
            )}

            {gameState === GameState.BATTLE_TACTICAL && !isPlayerTurn && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-0">
                    <div className="bg-red-950/90 text-red-200 px-6 py-1 rounded border-y border-red-600/50 backdrop-blur font-serif font-bold text-sm tracking-[0.2em] animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                        ENEMY TURN
                    </div>
                </div>
            )}

        </div>
    </>
  );
};

const CircleBtn = ({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) => (
    <button onClick={onClick} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-900/80 border border-slate-600 text-slate-200 flex items-center justify-center hover:bg-slate-800 hover:text-white hover:border-amber-500 transition-all shadow-lg active:scale-90">
        {icon}
    </button>
);

const InteractionBtn = ({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) => {
    const bgClass = color === 'purple' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/40' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/40';
    return (
        <button onClick={onClick} className={`${bgClass} text-white px-5 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95 mx-auto`}>
            <span className="text-xl">{icon}</span> 
            <span className="text-sm uppercase tracking-wide">{label}</span>
        </button>
    )
};

const StatusBar = ({ current, max, color, label }: { current: number, max: number, color: string, label: string }) => (
    <div className="w-full bg-slate-950 h-2.5 rounded-full relative overflow-hidden border border-white/10">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/90 drop-shadow-md">
            {label} {current}/{max}
        </span>
    </div>
);

const BigActionBtn = ({ label, icon, color, disabled, onClick, primary }: { label: string, icon: React.ReactNode, color: string, disabled?: boolean, onClick: () => void, primary?: boolean }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            relative overflow-hidden
            ${primary ? 'w-20 h-20 md:w-24 md:h-24 text-4xl' : 'w-16 h-16 md:w-20 md:h-20 text-2xl'}
            rounded-2xl flex flex-col items-center justify-center gap-0.5
            shadow-lg transition-all duration-100 active:scale-90 active:brightness-75 disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed
            ${color} border-b-4 border-black/30 hover:brightness-110 text-white
        `}
    >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        <span className="drop-shadow-md">{icon}</span>
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide opacity-90">{label}</span>
    </button>
);

const SmallActionBtn = ({ label, icon, onClick, disabled }: { label: string, icon: React.ReactNode, onClick: () => void, disabled?: boolean }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600 flex items-center gap-1.5 shadow active:scale-95 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider"
    >
        <span>{icon}</span> {label}
    </button>
);

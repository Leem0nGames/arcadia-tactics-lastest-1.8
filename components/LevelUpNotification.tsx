import React, { useEffect } from 'react';
import { Entity, CombatStatsComponent, VisualComponent } from '../types';

interface LevelUpNotificationProps {
  character: Entity & { stats: CombatStatsComponent; visual: VisualComponent };
  oldStats: CombatStatsComponent;
  newStats: CombatStatsComponent;
  onDismiss: () => void;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  character,
  oldStats,
  newStats,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-b from-amber-500 to-amber-700 rounded-lg p-12 max-w-md 
                      border-4 border-yellow-300 shadow-2xl animate-bounce">
        <h2 className="text-5xl font-bold text-white mb-2 text-center animate-pulse">
          ✨ LEVEL UP! ✨
        </h2>
        
        <p className="text-3xl text-amber-100 mb-8 text-center font-serif">
          {character.name} is now Level {newStats.level}
        </p>

        {/* Stats Comparison Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-sm text-white font-mono">
          {/* STR */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">STR</p>
            <p className="text-lg">
              {oldStats.attributes.STR} 
              <span className={newStats.attributes.STR > oldStats.attributes.STR ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.STR > oldStats.attributes.STR ? '→ +' + (newStats.attributes.STR - oldStats.attributes.STR) : ''}
              </span>
            </p>
          </div>

          {/* DEX */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">DEX</p>
            <p className="text-lg">
              {oldStats.attributes.DEX}
              <span className={newStats.attributes.DEX > oldStats.attributes.DEX ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.DEX > oldStats.attributes.DEX ? '→ +' + (newStats.attributes.DEX - oldStats.attributes.DEX) : ''}
              </span>
            </p>
          </div>

          {/* CON */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">CON</p>
            <p className="text-lg">
              {oldStats.attributes.CON}
              <span className={newStats.attributes.CON > oldStats.attributes.CON ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.CON > oldStats.attributes.CON ? '→ +' + (newStats.attributes.CON - oldStats.attributes.CON) : ''}
              </span>
            </p>
          </div>

          {/* INT */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">INT</p>
            <p className="text-lg">
              {oldStats.attributes.INT}
              <span className={newStats.attributes.INT > oldStats.attributes.INT ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.INT > oldStats.attributes.INT ? '→ +' + (newStats.attributes.INT - oldStats.attributes.INT) : ''}
              </span>
            </p>
          </div>

          {/* WIS */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">WIS</p>
            <p className="text-lg">
              {oldStats.attributes.WIS}
              <span className={newStats.attributes.WIS > oldStats.attributes.WIS ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.WIS > oldStats.attributes.WIS ? '→ +' + (newStats.attributes.WIS - oldStats.attributes.WIS) : ''}
              </span>
            </p>
          </div>

          {/* CHA */}
          <div className="bg-black/30 p-2 rounded text-center">
            <p className="opacity-75 text-xs mb-1">CHA</p>
            <p className="text-lg">
              {oldStats.attributes.CHA}
              <span className={newStats.attributes.CHA > oldStats.attributes.CHA ? 'text-green-300 ml-1' : ''}>
                {newStats.attributes.CHA > oldStats.attributes.CHA ? '→ +' + (newStats.attributes.CHA - oldStats.attributes.CHA) : ''}
              </span>
            </p>
          </div>
        </div>

        {/* HP & Stamina */}
        <div className="grid grid-cols-2 gap-4 text-white mb-4">
          <div className="bg-black/30 p-3 rounded text-center">
            <p className="text-xs opacity-75 mb-1">❤️ HP MAX</p>
            <p className="text-xl font-bold">
              {oldStats.maxHp} → <span className="text-red-300">+{newStats.maxHp - oldStats.maxHp}</span>
            </p>
          </div>
          
          <div className="bg-black/30 p-3 rounded text-center">
            <p className="text-xs opacity-75 mb-1">⚡ STAMINA MAX</p>
            <p className="text-xl font-bold">
              {oldStats.maxStamina} → <span className="text-blue-300">+{newStats.maxStamina - oldStats.maxStamina}</span>
            </p>
          </div>
        </div>

        {/* XP Display */}
        <div className="text-center text-white text-sm mt-6">
          <p className="opacity-75">Experience: {oldStats.xp} / {oldStats.xpToNextLevel}</p>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameState } from '../types';

export const MainMenu: React.FC = () => {
  const loadGame = useGameStore(state => state.loadGame);
  const initializeWorld = useGameStore(state => state.initializeWorld);
  const setGameState = useGameStore(state => state.setGameState);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    try {
      const key = 'arcadia_tactics_save_v2';
      const str = localStorage.getItem(key);
      setHasSave(!!str);
    } catch (e) {
      setHasSave(false);
    }
  }, []);

  const handleContinue = () => {
    loadGame();
  };

  const handleNewGame = () => {
    // initialize world & go to character creation or overworld
    initializeWorld();
    setGameState(GameState.CHARACTER_CREATION);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="w-[560px] p-8 bg-[#0b1220] rounded-md shadow-xl border border-slate-700">
        <h1 className="text-4xl font-bold text-amber-400 mb-4">Arcadia Tactics</h1>
        <p className="text-slate-300 mb-6">Turn-based tactics with DnD-inspired progression.</p>

        <div className="flex flex-col gap-3">
          {hasSave && (
            <button onClick={handleContinue} className="px-4 py-3 bg-emerald-500 rounded text-white font-semibold hover:bg-emerald-600">Continue</button>
          )}

          <button onClick={handleNewGame} className="px-4 py-3 bg-amber-500 rounded text-white font-semibold hover:bg-amber-600">New Game</button>

          <button onClick={() => window.location.reload()} className="px-4 py-3 bg-slate-600 rounded text-white">Refresh</button>
        </div>

        <div className="mt-6 text-xs text-slate-400">
          <p>Tip: Saves are stored locally (<code>arcadia_tactics_save_v2</code>).</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;

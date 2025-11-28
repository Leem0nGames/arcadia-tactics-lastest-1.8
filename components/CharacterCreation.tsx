

import React, { useState, useMemo } from 'react';
import { CharacterRace, CharacterClass, Attributes, Ability, Difficulty } from '../types';
import { BASE_STATS, RACE_BONUS, getSprite } from '../constants';
import { getModifier } from '../services/dndRules';

interface CharacterCreationProps {
  onComplete: (name: string, race: CharacterRace, cls: CharacterClass, stats: Attributes, difficulty: Difficulty) => void;
}

// --- ICONS (Inline SVGs for performance/no-dep) ---
const RaceIcons = {
    [CharacterRace.HUMAN]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4L4 8l1.5 9.5A11 11 0 0 0 12 21a11 11 0 0 0 6.5-3.5L20 8l-8-4z"/><path d="M12 9v4"/><path d="M12 4v1"/></svg>
    ),
    [CharacterRace.ELF]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c.5 0 .5 2 2 3 1.5-1 3.5 0 3.5 1.5 0 2-2 3-2 3s3 2 4 5c-4 0-5.5 3-5.5 3s0 3.5-2 3.5-2-3.5-2-3.5-1.5-3-5.5-3c1-3 4-5 4-5s-2-1-2-3c0-1.5 2-2.5 3.5-1.5 1.5-1 1.5-3 2-3z"/></svg>
    ),
    [CharacterRace.DWARF]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M12 3v18"/><path d="M6 12l2-3"/><path d="M18 12l-2-3"/><path d="M4 18l3-3"/><path d="M20 18l-3-3"/></svg>
    ),
    [CharacterRace.HALFLING]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
    ),
    [CharacterRace.DRAGONBORN]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l-2 2h4l-2-2zM4 6h16M4 6l2 12h12l2-12M6 18l6 4 6-4" /></svg>
    ),
    [CharacterRace.GNOME]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M19 12h3" /><path d="M2 12h3" /><path d="M17 17l2.1 2.1" /><path d="M4.9 4.9L7 7" /><path d="M17 7l2.1-2.1" /><path d="M4.9 19.1L7 17" /></svg>
    ),
    [CharacterRace.TIEFLING]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l-4 6 4 2" /><path d="M16 4l4 6-4 2" /><path d="M12 10v10" /><path d="M9 20h6" /></svg>
    ),
    [CharacterRace.HALF_ORC]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6-6 6 6" /><path d="M12 3v18" /><path d="M6 15l6 6 6-6" /></svg>
    )
};

// --- NAME GENERATOR LOGIC ---
const NAME_PARTS = {
    [CharacterRace.HUMAN]: {
        prefixes: ['Ald', 'Ed', 'Wil', 'Fen', 'Ro', 'Gar', 'Os', 'War', 'Hal', 'Cor', 'God', 'Roder', 'Stan'],
        suffixes: ['ric', 'win', 'ard', 'mund', 'ton', 'wick', 'ford', 'son', 'brand', 'mere', 'bert', 'red', 'ic']
    },
    [CharacterRace.ELF]: {
        prefixes: ['Ae', 'Gil', 'La', 'The', 'Sil', 'Fae', 'Cae', 'Thal', 'Va', 'Xan', 'El', 'Fino', 'Are'],
        suffixes: ['las', 'lan', 'rion', 'niel', 'van', 'dril', 'wyn', 'thil', 'lor', 'ar', 'fiel', 'nor', 'dil']
    },
    [CharacterRace.DWARF]: {
        prefixes: ['Thor', 'Bal', 'Dur', 'Gro', 'Bom', 'Kil', 'Or', 'Glo', 'Thra', 'Kaz', 'Bar', 'Dwal', 'Thrum'],
        suffixes: ['in', 'gar', 'im', 'oak', 'ur', 'grum', 'dain', 'bek', 'gorn', 'zak', 'lin', 'fur', 'bis']
    },
    [CharacterRace.HALFLING]: {
        prefixes: ['Bil', 'Fro', 'Mer', 'Pip', 'Sam', 'Tol', 'Wil', 'Ros', 'Pri', 'Ber', 'Don'],
        suffixes: ['bo', 'do', 'iad', 'in', 'wise', 'man', 'by', 'co', 'da', 'la', 'min']
    },
    [CharacterRace.DRAGONBORN]: {
        prefixes: ['Arj', 'Bal', 'Bar', 'Dra', 'Ghe', 'Hes', 'Kriv', 'Med', 'Meh', 'Nad', 'Pand'],
        suffixes: ['han', 'sar', 'kas', 'thos', 'kan', 'rash', 'born', 'gar', 'rinn', 'shed']
    },
    [CharacterRace.GNOME]: {
        prefixes: ['Alv', 'Bro', 'Dim', 'Eld', 'Fon', 'Glim', 'Jeb', 'Nam', 'Pog', 'Zook'],
        suffixes: ['in', 'ck', 'ble', 'ji', 'kin', 'm', 'foodle', 'bar', 'n', 'spark']
    },
    [CharacterRace.TIEFLING]: {
        prefixes: ['Ak', 'Cas', 'Ea', 'Kall', 'Ler', 'Mak', 'Nem', 'Ori', 'Phel', 'Ri'],
        suffixes: ['menos', 'vir', 'us', 'ista', 'issa', 'vari', 'os', 'anna', 'aia', 'xus']
    },
    [CharacterRace.HALF_ORC]: {
        prefixes: ['Den', 'Fen', 'Gel', 'Hen', 'Hol', 'Im', 'Kel', 'Krus', 'Mhur', 'Ront'],
        suffixes: ['ch', 'sh', 'gar', 'k', 'g', 'z', 'th', 'd', 'b', 'r']
    }
};

const generateFantasyName = (race: CharacterRace) => {
    const { prefixes, suffixes } = NAME_PARTS[race];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return prefix + suffix;
};

// Helper to get class icon
const getClassIcon = (c: CharacterClass) => {
    switch(c) {
        case CharacterClass.FIGHTER: return '⚔️';
        case CharacterClass.BARBARIAN: return '🪓';
        case CharacterClass.PALADIN: return '🛡️';
        case CharacterClass.RANGER: return '🏹';
        case CharacterClass.ROGUE: return '🗡️';
        case CharacterClass.WIZARD: return '🔮';
        case CharacterClass.SORCERER: return '🔥';
        case CharacterClass.WARLOCK: return '👁️';
        case CharacterClass.CLERIC: return '✨';
        case CharacterClass.DRUID: return '🌿';
        case CharacterClass.BARD: return '🎵';
        default: return '❓';
    }
};

const getClassHitDie = (c: CharacterClass) => {
    if (c === CharacterClass.BARBARIAN) return 12;
    if ([CharacterClass.FIGHTER, CharacterClass.PALADIN, CharacterClass.RANGER].includes(c)) return 10;
    if ([CharacterClass.WIZARD, CharacterClass.SORCERER].includes(c)) return 6;
    return 8;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [race, setRace] = useState<CharacterRace>(CharacterRace.HUMAN);
  const [cls, setCls] = useState<CharacterClass>(CharacterClass.FIGHTER);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  
  // Calculate final stats based on selection
  const currentStats: Attributes = useMemo(() => {
      const base = { ...BASE_STATS[cls] };
      const bonus = RACE_BONUS[race];
      (Object.keys(base) as Ability[]).forEach(k => {
          if (bonus[k]) base[k] += bonus[k]!;
      });
      return base;
  }, [race, cls]);

  // Determine Sprite for Preview
  const spriteUrl = useMemo(() => getSprite(race, cls), [race, cls]);

  const handleNext = () => {
    if (step === 3) {
        onComplete(name, race, cls, currentStats, difficulty);
    } else {
        setStep(step + 1);
    }
  };

  const handleRandomName = () => {
      setName(generateFantasyName(race));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 font-sans custom-scrollbar">
      {/* Background Ambience & Noise */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-black pointer-events-none" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} />

      {/* Main Container - Allows scrolling if content is tall */}
      <div className="min-h-full flex items-center justify-center p-4 py-8 md:py-12">
          
          <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/20 p-6 md:p-10 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8)] max-w-5xl w-full text-amber-50 transition-all relative overflow-hidden group">
            
            {/* Ornamental Corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-500/30 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-500/30 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-500/30 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-500/30 rounded-br-xl pointer-events-none" />

            {/* Header */}
            <header className="text-center mb-8 md:mb-10 relative">
                <h1 className="text-4xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-2 tracking-wide">
                    Legend Begins
                </h1>
                <p className="text-amber-500/40 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">
                    Step {step} <span className="text-slate-600 mx-2">/</span> 3
                </p>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4" />
            </header>

            {/* Step 1: Identity, Race & Difficulty */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* LEFT COLUMN: Identity & Difficulty */}
                    <div className="space-y-8">
                        {/* Name Section */}
                        <div className="group/input">
                            <span className="text-amber-100/80 font-serif text-xl block mb-3 pl-1">Name Your Hero</span>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-5 pr-12 py-4 text-xl text-amber-50 placeholder-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)] outline-none transition-all duration-300"
                                    placeholder="Enter name..."
                                    autoFocus
                                />
                                <button 
                                    onClick={handleRandomName}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-slate-500 hover:text-amber-400 transition-colors group-focus-within/input:text-amber-500"
                                    title="Randomize Name"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Difficulty Section */}
                        <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                             <span className="text-amber-100/80 font-serif text-lg block mb-4 pl-1">World Challenge</span>
                             <div className="grid grid-cols-3 gap-3">
                                 {Object.values(Difficulty).map(d => (
                                     <button
                                         key={d}
                                         onClick={() => setDifficulty(d)}
                                         className={`
                                            py-3 px-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all duration-200 transform
                                            ${difficulty === d 
                                                ? 'bg-gradient-to-br from-amber-700 to-amber-900 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-105 ring-1 ring-amber-400/30' 
                                                : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}
                                         `}
                                     >
                                         {d}
                                     </button>
                                 ))}
                             </div>
                             <div className="mt-4 text-center min-h-[20px]">
                                <p className={`text-xs italic transition-all duration-300 ${difficulty === Difficulty.HARD ? 'text-red-400' : 'text-slate-400'}`}>
                                    {difficulty === Difficulty.EASY && "Enemies deal reduced damage. Plentiful resources."}
                                    {difficulty === Difficulty.NORMAL && "Standard tactical experience. Balanced peril."}
                                    {difficulty === Difficulty.HARD && "Enemies are ruthless. Survival is not guaranteed."}
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Lineage */}
                    <div className="relative">
                         {/* Subtle Divider for mobile */}
                        <div className="lg:hidden w-full h-px bg-slate-800 my-6" />

                        <div className="flex justify-between items-end mb-4 px-1">
                            <span className="text-amber-100/80 font-serif text-xl">Choose Lineage</span>
                            <span className="text-[10px] text-amber-500/50 uppercase tracking-widest font-bold">Racial Traits</span>
                        </div>
                        
                        {/* Two Column Grid for Races */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {Object.values(CharacterRace).map(r => {
                                const isSelected = race === r;
                                const bonus = RACE_BONUS[r];
                                const bonusText = Object.entries(bonus).map(([k,v]) => `${k} +${v}`).join(', ');

                                return (
                                    <button
                                        key={r}
                                        onClick={() => { setRace(r); if(name) setName(generateFantasyName(r)); }}
                                        className={`w-full p-3 border rounded-xl flex flex-col gap-2 transition-all duration-200 group relative overflow-hidden text-left
                                            ${isSelected 
                                                ? 'bg-gradient-to-r from-amber-900/40 to-slate-900 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.05)]' 
                                                : 'bg-slate-950/30 border-slate-800 hover:bg-slate-900 hover:border-slate-600'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${isSelected ? 'text-amber-400 bg-amber-900/20' : 'text-slate-600 bg-slate-900'}`}>
                                                {RaceIcons[r]}
                                            </div>
                                            <span className={`text-sm font-serif tracking-wide truncate transition-colors ${isSelected ? 'text-amber-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                {r}
                                            </span>
                                        </div>
                                        
                                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border transition-all self-start
                                            ${isSelected 
                                                ? 'bg-black/40 border-amber-500/30 text-amber-500' 
                                                : 'bg-slate-950 border-slate-800 text-slate-600'}
                                        `}>
                                            {r === CharacterRace.HUMAN ? 'ALL +1' : bonusText}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Flavor Text Fades in */}
                        <div className="mt-4 px-2 min-h-[40px] flex items-center justify-center text-center">
                            <p className="text-xs text-slate-500 italic font-serif">
                                {race === CharacterRace.HUMAN && "Versatile and ambitious, Humans thrive in any environment."}
                                {race === CharacterRace.ELF && "Graceful and keen-sighted, Elves are masters of the wild."}
                                {race === CharacterRace.DWARF && "Stout and hardy, Dwarves are forged in the dark deep."}
                                {race === CharacterRace.HALFLING && "Small but brave, Halflings are lucky wanderers."}
                                {race === CharacterRace.DRAGONBORN && "Proud draconic warriors with a breath of power."}
                                {race === CharacterRace.GNOME && "Inventive and energetic, Gnomes love discovery."}
                                {race === CharacterRace.TIEFLING && "Marked by an infernal legacy, they walk a lonely path."}
                                {race === CharacterRace.HALF_ORC && "Strong and fierce, bearing the endurance of orcs."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Class Selection */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <span className="text-amber-100/80 font-serif text-2xl block mb-8 text-center">Select Your Path</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {Object.values(CharacterClass).map(c => {
                             const isSelected = cls === c;
                             const hitDie = getClassHitDie(c);
                             return (
                                <button
                                    key={c}
                                    onClick={() => setCls(c)}
                                    className={`relative p-4 md:p-6 border rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 group h-48 md:h-64
                                        ${isSelected
                                            ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)] scale-105 z-10' 
                                            : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900 hover:border-slate-600 opacity-80 hover:opacity-100'}
                                    `}
                                >
                                    <div className={`text-4xl md:text-5xl transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'grayscale group-hover:grayscale-0 group-hover:scale-110'}`}>
                                        {getClassIcon(c)}
                                    </div>
                                    <div className="text-center">
                                        <span className={`text-base md:text-lg font-serif font-bold block mb-1 tracking-wide ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{c}</span>
                                        <span className={`text-[9px] md:text-[10px] uppercase tracking-widest block font-bold ${isSelected ? 'text-amber-500' : 'text-slate-600'}`}>
                                            HP: d{hitDie}
                                        </span>
                                    </div>
                                    
                                    {/* Class Description Hint */}
                                    <div className={`absolute bottom-3 left-0 right-0 text-[9px] text-center px-2 transition-opacity duration-300 ${isSelected ? 'opacity-100 text-slate-300' : 'opacity-0'}`}>
                                        {c === CharacterClass.FIGHTER && 'Master of martial combat.'}
                                        {c === CharacterClass.WIZARD && 'Scholar of arcane magic.'}
                                        {c === CharacterClass.ROGUE && 'Master of stealth & skill.'}
                                        {c === CharacterClass.CLERIC && 'Priestly champion.'}
                                        {c === CharacterClass.BARBARIAN && 'Fierce warrior of fury.'}
                                        {c === CharacterClass.BARD && 'Magical entertainer.'}
                                        {c === CharacterClass.DRUID && 'Guardian of nature.'}
                                        {c === CharacterClass.PALADIN && 'Holy warrior bound by oath.'}
                                        {c === CharacterClass.RANGER && 'Hunter of the wilds.'}
                                        {c === CharacterClass.SORCERER && 'Mage of innate magic.'}
                                        {c === CharacterClass.WARLOCK && 'Pact-bound spellcaster.'}
                                    </div>
                                </button>
                             );
                        })}
                    </div>
                </div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
                <div className="animate-in zoom-in-95 duration-500">
                    <h3 className="text-2xl md:text-3xl font-serif text-amber-100 text-center mb-8 drop-shadow-md">Attributes</h3>
                    
                    {/* Character Preview */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-amber-500 shadow-lg overflow-hidden flex items-center justify-center mb-4">
                            <img src={spriteUrl} alt="Character Preview" className="w-full h-full object-cover scale-150 translate-y-2 pixelated" />
                        </div>
                    </div>

                    <div className="bg-slate-950/60 rounded-2xl p-6 md:p-10 border border-slate-800 shadow-inner relative overflow-hidden">
                        {/* Decorative background rune feel */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-[0.02] font-serif pointer-events-none select-none">
                            &
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8 relative z-10">
                            {(Object.entries(currentStats) as [Ability, number][]).map(([key, val]) => (
                                <div key={key} className="flex flex-col items-center gap-2 group">
                                    <div className="relative">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600 group-hover:border-amber-500/50 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-200 shadow-lg transition-colors">
                                            {val}
                                        </div>
                                        {/* Modifier Badge */}
                                        <div className="absolute -top-3 -right-3 bg-slate-900 text-amber-500 text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border border-slate-700 shadow-md">
                                            {getModifier(val) >= 0 ? '+' : ''}{getModifier(val)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mt-8 space-y-2">
                        <p className="text-lg md:text-xl text-slate-300">
                            Rise, <span className="text-amber-400 font-serif font-bold text-2xl mx-1">{name}</span>
                        </p>
                        <p className="text-sm text-slate-400">
                            The <span className="text-slate-200 font-bold">{race}</span> <span className="text-slate-200 font-bold">{cls}</span>
                        </p>
                        <div className="inline-block mt-4 px-3 py-1 bg-slate-900 rounded border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Difficulty: <span className={difficulty === Difficulty.HARD ? 'text-red-400' : 'text-slate-300'}>{difficulty}</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer / Navigation */}
            <div className="mt-10 md:mt-16 flex justify-between items-center border-t border-white/5 pt-8">
                <button 
                    onClick={() => setStep(Math.max(1, step-1))} 
                    className={`text-slate-500 hover:text-amber-200 flex items-center gap-2 transition-colors px-4 py-2 text-sm uppercase tracking-widest font-bold ${step === 1 ? 'invisible' : ''}`}
                >
                    ← Back
                </button>
                
                {/* Step Indicators */}
                <div className="flex gap-3">
                    {[1,2,3].map(i => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${i === step ? 'bg-amber-500 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-800'}`} />
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    disabled={!name}
                    className="
                        group relative bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 
                        text-white px-8 md:px-12 py-3 md:py-4 rounded-lg shadow-lg shadow-amber-900/40 
                        transition-all duration-300 transform hover:-translate-y-1 hover:shadow-amber-600/30
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                        overflow-hidden
                    "
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md" />
                    <span className="relative flex items-center gap-3 font-bold font-serif tracking-widest text-sm md:text-base">
                        {step === 3 ? 'ENTER WORLD' : 'CONTINUE'} 
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                </button>
            </div>

          </div>
      </div>
    </div>
  );
};

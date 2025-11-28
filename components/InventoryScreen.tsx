
import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameState, EquipmentSlot, ItemRarity, Item, Ability } from '../types';
import { RARITY_COLORS } from '../constants';
import { getModifier } from '../services/dndRules';

// --- STYLED COMPONENTS HELPERS ---
const RarityBorder = ({ rarity, children, className = "" }: { rarity: ItemRarity, children: React.ReactNode, className?: string }) => {
    const color = RARITY_COLORS[rarity];
    return (
        <div 
            className={`relative group ${className}`} 
            style={{ 
                boxShadow: `inset 0 0 0 1px ${color}40`, // Subtle inner border
            }}
        >
             {/* Corner Accents for high rarity */}
            {(rarity === ItemRarity.LEGENDARY || rarity === ItemRarity.VERY_RARE) && (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: color }} />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: color }} />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: color }} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: color }} />
                </>
            )}
            {children}
        </div>
    );
};

const TooltipCard = ({ item, onClose }: { item: Item | null, onClose?: () => void }) => {
    if (!item) return (
        <div className="h-full flex items-center justify-center text-amber-500/30 font-serif italic text-sm p-8 text-center border border-amber-900/30 bg-black/40 rounded-lg">
            Hover over an item to see details.
        </div>
    );

    const rarityColor = RARITY_COLORS[item.rarity];

    return (
        <div className="bg-slate-900 border border-amber-600/50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-full animate-in fade-in duration-200 relative">
            {onClose && (
                <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 bg-slate-950/80 rounded-full text-slate-400 z-10 border border-slate-700">✕</button>
            )}
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-amber-600/30 relative">
                <div className="flex items-start gap-4">
                     <div className="w-16 h-16 bg-black/50 border border-slate-600 rounded flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: rarityColor }} />
                        <img src={item.icon} className="w-12 h-12 object-contain pixelated relative z-10" alt={item.name} />
                     </div>
                     <div>
                        <h3 className="text-lg md:text-xl font-serif font-bold text-amber-50 leading-tight mb-1 pr-6">{item.name}</h3>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold" style={{ color: rarityColor }}>
                            {item.rarity} {item.type}
                        </span>
                     </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-950 to-slate-950">
                 {/* Main Stats */}
                 <div className="space-y-2">
                    {item.equipmentStats && (
                        <div className="flex gap-4 text-sm text-slate-300">
                            {item.equipmentStats.ac && (
                                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded border border-slate-700">
                                    <span>🛡️</span> <span className="font-bold text-white">{item.equipmentStats.ac} AC</span>
                                </div>
                            )}
                            {item.equipmentStats.diceCount && (
                                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded border border-slate-700">
                                    <span>⚔️</span> <span className="font-bold text-white">{item.equipmentStats.diceCount}d{item.equipmentStats.diceSides}</span>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 <div className="h-px bg-gradient-to-r from-transparent via-amber-600/20 to-transparent" />

                 {/* Description */}
                 <div className="text-sm text-amber-100/90 leading-relaxed font-serif">
                     {item.description}
                 </div>

                 {/* Properties / Tags */}
                 {item.equipmentStats?.properties && (
                     <div className="flex flex-wrap gap-2">
                         {item.equipmentStats.properties.map(prop => (
                             <span key={prop} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                 {prop}
                             </span>
                         ))}
                     </div>
                 )}
                
                 {/* Flavor Text */}
                 {item.flavorText && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 italic font-serif leading-relaxed">
                            "{item.flavorText}"
                        </p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export const InventoryScreen: React.FC = () => {
    const { 
        inventory, party, activeInventoryCharacterId, 
        toggleInventory, consumeItem, equipItem, unequipItem, 
        cycleInventoryCharacter, hasActed, gameState 
    } = useGameStore();
    
    const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
    const [mobileSelectedItem, setMobileSelectedItem] = useState<Item | null>(null);
    
    const isBattle = gameState === GameState.BATTLE_TACTICAL;
    const activeChar = party.find(p => p.id === activeInventoryCharacterId) || party[0];

    if (!activeChar) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300 p-2 md:p-12">
            
            {/* Main Container */}
            <div className="w-full max-w-7xl h-full max-h-[95vh] grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 relative overflow-hidden lg:overflow-visible">
                
                {/* CLOSE BUTTON */}
                <button 
                    onClick={toggleInventory}
                    className="absolute top-2 right-2 lg:-right-10 lg:top-0 w-8 h-8 lg:w-10 lg:h-10 bg-slate-900 border border-amber-600/50 rounded-full text-amber-500 hover:text-white hover:bg-red-900 hover:border-red-500 transition-all z-50 flex items-center justify-center shadow-lg"
                >
                    ✕
                </button>

                {/* HEADER (Mobile Navigation) */}
                <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-2 rounded-lg">
                    <button onClick={() => cycleInventoryCharacter('prev')} className="p-2 text-slate-400">◀</button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500">
                            <img src={activeChar.visual.spriteUrl} className="w-full h-full object-cover scale-150 translate-y-1" />
                        </div>
                        <span className="font-bold text-amber-100">{activeChar.name}</span>
                    </div>
                    <button onClick={() => cycleInventoryCharacter('next')} className="p-2 text-slate-400">▶</button>
                </div>

                {/* LEFT COLUMN: CHARACTER SHEET (Desktop Only or simplified mobile) */}
                <div className="hidden lg:flex lg:col-span-3 bg-slate-900/90 border border-slate-700 rounded-lg flex-col overflow-hidden shadow-2xl relative">
                    {/* Character Header */}
                    <div className="p-6 bg-gradient-to-b from-slate-800 to-slate-900 text-center border-b border-amber-600/30">
                         <div className="w-24 h-24 mx-auto bg-slate-950 rounded-full border-2 border-amber-600/50 overflow-hidden shadow-lg mb-4 relative group">
                            <img src={activeChar.visual.spriteUrl} alt={activeChar.name} className="w-full h-full object-cover scale-150 translate-y-2 pixelated" />
                         </div>
                         <h2 className="text-2xl font-serif font-bold text-amber-100">{activeChar.name}</h2>
                         <p className="text-xs text-amber-500/60 uppercase tracking-widest font-bold mt-1">
                            Lvl {activeChar.stats.level} {activeChar.stats.race} {activeChar.stats.class}
                         </p>
                    </div>

                    {/* Stats */}
                    <div className="p-6 space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-slate-950/50 border border-slate-800 rounded p-2">
                                <span className="block text-xs text-slate-500 uppercase tracking-wider">HP</span>
                                <span className="text-xl font-bold text-green-400">{activeChar.stats.hp}</span>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800 rounded p-2">
                                <span className="block text-xs text-slate-500 uppercase tracking-wider">AC</span>
                                <span className="text-xl font-bold text-blue-400">{activeChar.stats.ac}</span>
                            </div>
                        </div>
                        {/* Attributes List */}
                        <div className="space-y-1">
                            {Object.entries(activeChar.stats.attributes).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-1">
                                    <span>{key}</span>
                                    <span className="text-white font-mono">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN: EQUIPMENT & INVENTORY */}
                <div className="col-span-1 lg:col-span-6 flex flex-col gap-4 h-full min-h-0">
                    
                    {/* PAPER DOLL (Equipment Slots) */}
                    <div className="bg-slate-900/80 backdrop-blur border border-amber-600/30 rounded-lg p-4 shadow-xl flex flex-col items-center shrink-0">
                         <div className="flex justify-center gap-4 w-full max-w-md">
                            {[EquipmentSlot.MAIN_HAND, EquipmentSlot.BODY, EquipmentSlot.OFF_HAND].map(slot => {
                                const item = activeChar.equipment[slot];
                                return (
                                    <div key={slot} className="flex flex-col items-center gap-1 group relative">
                                        <div 
                                            className={`
                                                w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 flex items-center justify-center relative overflow-hidden transition-all
                                                ${item ? 'bg-slate-800 border-amber-600/40' : 'bg-slate-950/50 border-slate-800 border-dashed'}
                                            `}
                                            onClick={() => item && setMobileSelectedItem(item)}
                                            onMouseEnter={() => setHoveredItem(item || null)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                        >
                                            {item ? (
                                                <>
                                                    <img src={item.icon} alt={item.name} className="w-10 h-10 md:w-14 md:h-14 object-contain pixelated drop-shadow-lg" />
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); unequipItem(slot, activeChar.id); }}
                                                        className="absolute top-0 right-0 w-6 h-6 bg-red-900/90 text-white rounded-bl text-xs flex items-center justify-center"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-slate-700 text-xl opacity-30">{slot === EquipmentSlot.BODY ? '🧥' : '🛡️'}</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                         </div>
                    </div>

                    {/* BACKPACK GRID */}
                    <div className="flex-1 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-xl">
                        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center shrink-0">
                             <h3 className="text-slate-300 font-serif font-bold pl-2">Backpack</h3>
                             <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                 {inventory.length} / 20
                             </span>
                        </div>
                        
                        <div className="p-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3 overflow-y-auto custom-scrollbar flex-1 content-start">
                             {inventory.map((slot, idx) => {
                                 const isEquip = slot.item.type === 'equipment';
                                 
                                 return (
                                    <div 
                                        key={idx}
                                        className="relative group aspect-square"
                                        onMouseEnter={() => setHoveredItem(slot.item)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onClick={() => setMobileSelectedItem(slot.item)}
                                    >
                                        <RarityBorder rarity={slot.item.rarity} className="w-full h-full bg-slate-950 rounded-lg overflow-hidden hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 hover:border-slate-500 relative">
                                            {/* Quantity Badge */}
                                            {slot.quantity > 1 && (
                                                <div className="absolute top-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 rounded border border-slate-700 z-10">
                                                    {slot.quantity}
                                                </div>
                                            )}

                                            {/* Icon */}
                                            <div className="w-full h-full flex items-center justify-center p-2">
                                                <img src={slot.item.icon} alt={slot.item.name} className="w-full h-full object-contain pixelated drop-shadow-md" />
                                            </div>

                                            {/* Desktop Hover Actions */}
                                            <div className="hidden lg:flex absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 backdrop-blur-[1px]">
                                                {isEquip ? (
                                                    <button onClick={(e) => { e.stopPropagation(); equipItem(slot.item.id, activeChar.id); }} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase">Equip</button>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); consumeItem(slot.item.id, activeChar.id); }} disabled={isBattle && hasActed} className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold uppercase disabled:opacity-50">Use</button>
                                                )}
                                            </div>
                                        </RarityBorder>
                                    </div>
                                 );
                             })}

                             {/* Empty Slots */}
                             {Array(Math.max(0, 20 - inventory.length)).fill(null).map((_, i) => (
                                 <div key={`empty-${i}`} className="aspect-square bg-slate-950/20 rounded-lg border border-slate-800/40" />
                             ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: TOOLTIP DETAILS (Desktop) */}
                <div className="hidden lg:block lg:col-span-3 h-full">
                    <TooltipCard item={hoveredItem} />
                </div>
                
                {/* MOBILE ITEM DETAILS MODAL */}
                {mobileSelectedItem && (
                    <div className="lg:hidden absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMobileSelectedItem(null)}>
                        <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <TooltipCard item={mobileSelectedItem} onClose={() => setMobileSelectedItem(null)} />
                            <div className="mt-4 flex gap-2">
                                {mobileSelectedItem.type === 'equipment' ? (
                                    <button onClick={() => { equipItem(mobileSelectedItem.id, activeChar.id); setMobileSelectedItem(null); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg">EQUIP</button>
                                ) : (
                                    <button onClick={() => { consumeItem(mobileSelectedItem.id, activeChar.id); setMobileSelectedItem(null); }} disabled={isBattle && hasActed} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50">USE</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { useContentStore, EnemyDefinition } from '../../store/contentStore';
import { Item, ItemRarity, EquipmentSlot, CharacterClass, Ability, TerrainType } from '../../types';
import { RARITY_COLORS } from '../../constants';

const TABS = ['DASHBOARD', 'ITEMS', 'UNITS & SPAWNS', 'CLASSES', 'MAP CONFIG', 'EXPORT'];

const WESNOTH_GITHUB_BASE = "https://raw.githubusercontent.com/wesnoth/wesnoth/master/";

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('DASHBOARD');

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="font-serif text-2xl text-amber-500 font-bold">Arcadia Admin</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">RPG Maker Toolset</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === tab ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={() => window.location.pathname = '/'} className="w-full border border-slate-700 text-slate-400 px-4 py-2 rounded hover:bg-slate-800 hover:text-white transition-colors text-xs uppercase font-bold">
                        ← Back to Game
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-8 justify-between">
                    <h2 className="text-xl font-bold text-slate-100">{activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-green-400 font-mono">SYSTEM ONLINE</span>
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto bg-slate-900 p-8 custom-scrollbar">
                    {activeTab === 'DASHBOARD' && <DashboardHome changeTab={setActiveTab} />}
                    {activeTab === 'ITEMS' && <ItemEditor />}
                    {activeTab === 'UNITS & SPAWNS' && <UnitAndEncounterEditor />}
                    {activeTab === 'CLASSES' && <ClassEditor />}
                    {activeTab === 'MAP CONFIG' && <MapConfigurator />}
                    {activeTab === 'EXPORT' && <ExportView />}
                </main>
            </div>
        </div>
    );
};

const DashboardHome = ({ changeTab }: { changeTab: (t: string) => void }) => {
    const { items, enemies } = useContentStore();
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => changeTab('ITEMS')} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-amber-500 cursor-pointer transition-all group">
                <h3 className="text-lg font-bold text-amber-100 group-hover:text-amber-400">Item Database</h3>
                <p className="text-slate-400 text-sm mt-2">Manage weapons, armor, and consumables.</p>
                <div className="mt-4 text-3xl font-bold text-slate-200">{Object.keys(items).length} <span className="text-sm text-slate-500 font-normal">Items</span></div>
            </div>
            <div onClick={() => changeTab('UNITS & SPAWNS')} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-red-500 cursor-pointer transition-all group">
                <h3 className="text-lg font-bold text-red-100 group-hover:text-red-400">Bestiary & Spawns</h3>
                <p className="text-slate-400 text-sm mt-2">Edit enemies and configure encounter tables.</p>
                <div className="mt-4 text-3xl font-bold text-slate-200">{Object.keys(enemies).length} <span className="text-sm text-slate-500 font-normal">Enemies</span></div>
            </div>
            <div onClick={() => changeTab('MAP CONFIG')} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500 cursor-pointer transition-all group">
                <h3 className="text-lg font-bold text-emerald-100 group-hover:text-emerald-400">World Generator</h3>
                <p className="text-slate-400 text-sm mt-2">Tweak procedural generation noise parameters.</p>
            </div>
        </div>
    );
};

// --- UNIT & ENCOUNTER EDITOR ---
const UnitAndEncounterEditor = () => {
    const { enemies, updateEnemy, createEnemy, deleteEnemy, encounters, updateEncounterTable } = useContentStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<EnemyDefinition>>({});
    const [assetPath, setAssetPath] = useState('');
    const [activeTerrain, setActiveTerrain] = useState<TerrainType>(TerrainType.GRASS);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setEditForm({ ...enemies[id] });
        setAssetPath('');
    };

    const handleSave = () => {
        if (selectedId && editForm.name) {
            updateEnemy(selectedId, editForm as EnemyDefinition);
            alert('Unit Saved');
        }
    };

    const handleCreate = () => {
        const newId = `enemy_${Date.now()}`;
        const newEnemy: EnemyDefinition = {
            id: newId,
            name: 'New Enemy',
            sprite: '',
            hp: 10, ac: 10, damage: 4, xpReward: 10, initiativeBonus: 0
        };
        createEnemy(newEnemy);
        handleSelect(newId);
    };

    const handleImportAsset = () => {
        // Normalize path: remove leading slash, remove remote base if user pasted full url
        let cleanPath = assetPath.trim();
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith(WESNOTH_GITHUB_BASE)) cleanPath = cleanPath.replace(WESNOTH_GITHUB_BASE, '');
        
        const fullUrl = `${WESNOTH_GITHUB_BASE}${cleanPath}`;
        setEditForm({ ...editForm, sprite: fullUrl });
    };

    const toggleEncounter = (enemyId: string) => {
        const currentList = encounters[activeTerrain] || [];
        let newList;
        if (currentList.includes(enemyId)) {
            newList = currentList.filter(id => id !== enemyId);
        } else {
            newList = [...currentList, enemyId];
        }
        updateEncounterTable(activeTerrain, newList);
    };

    return (
        <div className="flex gap-6 h-full">
            {/* Left: Unit List */}
            <div className="w-64 bg-slate-950 rounded-lg border border-slate-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-slate-400 text-sm">BESTIARY</span>
                    <button onClick={handleCreate} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">+</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {Object.values(enemies).map((enemy: EnemyDefinition) => (
                        <div 
                            key={enemy.id} 
                            onClick={() => handleSelect(enemy.id)}
                            className={`p-2 rounded cursor-pointer flex items-center gap-3 border ${selectedId === enemy.id ? 'bg-slate-800 border-red-500' : 'bg-transparent border-transparent hover:bg-slate-900'}`}
                        >
                            <div className="w-8 h-8 bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-700">
                                <img src={enemy.sprite} className="w-8 h-8 object-contain pixelated" alt="icon" />
                            </div>
                            <div className="text-sm font-bold text-slate-200 truncate">{enemy.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle: Editor Form */}
            <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                {selectedId ? (
                    <div className="space-y-6 max-w-xl mx-auto w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Edit Unit</h3>
                            <button onClick={() => { if(confirm('Delete unit?')) { deleteEnemy(selectedId); setSelectedId(null); } }} className="text-red-400 hover:text-red-300 text-xs uppercase font-bold">Delete Unit</button>
                        </div>

                        {/* Basic Stats */}
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-700 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500 uppercase font-bold">Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">HP</label>
                                <input type="number" value={editForm.hp} onChange={e => setEditForm({...editForm, hp: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">AC</label>
                                <input type="number" value={editForm.ac} onChange={e => setEditForm({...editForm, ac: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Damage (Approx)</label>
                                <input type="number" value={editForm.damage} onChange={e => setEditForm({...editForm, damage: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">XP Reward</label>
                                <input type="number" value={editForm.xpReward} onChange={e => setEditForm({...editForm, xpReward: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                            </div>
                        </div>

                        {/* Asset Picker */}
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-700 space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">Visuals</h4>
                            <div className="flex gap-4 items-start">
                                <div className="w-24 h-24 bg-slate-950 border border-slate-600 rounded flex items-center justify-center shrink-0">
                                    {editForm.sprite ? <img src={editForm.sprite} className="w-full h-full object-contain pixelated" /> : <span className="text-xs text-slate-600">No Image</span>}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="text-xs text-slate-500">Paste Wesnoth Path (e.g., <code>data/core/images/units/trolls/troll.png</code>)</div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={assetPath} 
                                            onChange={e => setAssetPath(e.target.value)} 
                                            className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs font-mono text-blue-300" 
                                            placeholder="data/core/images/..."
                                        />
                                        <button onClick={handleImportAsset} className="bg-blue-600 px-3 rounded text-xs font-bold text-white hover:bg-blue-500">Load</button>
                                    </div>
                                    <div className="text-[10px] text-slate-600">Or copy existing URL:</div>
                                    <input type="text" value={editForm.sprite} onChange={e => setEditForm({...editForm, sprite: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1 text-[10px] text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded shadow-lg">SAVE UNIT</button>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">Select a unit to edit</div>
                )}
            </div>

            {/* Right: Encounter Tables */}
            <div className="w-72 bg-slate-950 rounded-lg border border-slate-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-800">
                    <h4 className="font-bold text-slate-400 text-sm uppercase mb-2">Encounter Manager</h4>
                    <select 
                        value={activeTerrain} 
                        onChange={(e) => setActiveTerrain(e.target.value as TerrainType)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-amber-400 font-bold"
                    >
                        {Object.values(TerrainType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    <p className="text-[10px] text-slate-500 px-2 mb-2">Check units that spawn in {activeTerrain}:</p>
                    <div className="space-y-1">
                        {Object.values(enemies).map((enemy: EnemyDefinition) => {
                            const isSpawn = encounters[activeTerrain]?.includes(enemy.id);
                            return (
                                <label key={enemy.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-900 ${isSpawn ? 'bg-slate-900/80' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSpawn || false} 
                                        onChange={() => toggleEncounter(enemy.id)}
                                        className="accent-amber-500"
                                    />
                                    <img src={enemy.sprite} className="w-6 h-6 object-contain pixelated" />
                                    <span className={`text-xs font-bold ${isSpawn ? 'text-amber-100' : 'text-slate-500'}`}>{enemy.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (Previous ItemEditor, ClassEditor, MapConfigurator, ExportView remain unchanged)

const ItemEditor = () => {
    const { items, updateItem, createItem, deleteItem } = useContentStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Item>>({});

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setEditForm({ ...items[id] });
    };

    const handleSave = () => {
        if (selectedId && editForm.name) {
            updateItem(selectedId, editForm as Item);
            alert('Item Saved');
        }
    };

    const handleCreate = () => {
        const newId = `new_item_${Date.now()}`;
        const newItem: Item = {
            id: newId,
            name: 'New Item',
            type: 'equipment',
            rarity: ItemRarity.COMMON,
            description: 'Description here',
            icon: '',
            equipmentStats: { slot: EquipmentSlot.MAIN_HAND }
        };
        createItem(newItem);
        handleSelect(newId);
    };

    return (
        <div className="flex gap-6 h-full">
            {/* List */}
            <div className="w-1/3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <input type="text" placeholder="Search items..." className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm w-full mr-2" />
                    <button onClick={handleCreate} className="bg-amber-600 text-white px-3 py-1 rounded text-lg font-bold">+</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {Object.values(items).map((item: Item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleSelect(item.id)}
                            className={`p-3 rounded cursor-pointer flex items-center gap-3 border ${selectedId === item.id ? 'bg-slate-800 border-amber-500' : 'bg-transparent border-transparent hover:bg-slate-900'}`}
                        >
                            <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 flex items-center justify-center overflow-hidden">
                                {item.icon ? <img src={item.icon} className="w-6 h-6 object-contain" /> : '📦'}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-200">{item.name}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-6 overflow-y-auto custom-scrollbar">
                {selectedId ? (
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Edit Item: <span className="text-amber-400">{editForm.name}</span></h3>
                            <button onClick={() => { if(confirm('Delete item?')) { deleteItem(selectedId); setSelectedId(null); } }} className="text-red-400 hover:text-red-300 text-sm uppercase font-bold">Delete</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">ID</label>
                                <input type="text" value={editForm.id} disabled className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Type</label>
                                <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white">
                                    <option value="equipment">Equipment</option>
                                    <option value="consumable">Consumable</option>
                                    <option value="key">Key Item</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Rarity</label>
                                <select value={editForm.rarity} onChange={e => setEditForm({...editForm, rarity: e.target.value as ItemRarity})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white">
                                    {Object.values(ItemRarity).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 uppercase font-bold">Icon URL</label>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-slate-900 border border-slate-600 rounded flex items-center justify-center shrink-0">
                                    {editForm.icon ? <img src={editForm.icon} className="w-8 h-8 object-contain" /> : '❌'}
                                </div>
                                <input type="text" value={editForm.icon} onChange={e => setEditForm({...editForm, icon: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 uppercase font-bold">Description</label>
                            <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white h-20" />
                        </div>

                        {editForm.type === 'equipment' && (
                            <div className="bg-slate-900/50 p-4 rounded border border-slate-700 space-y-4">
                                <h4 className="font-bold text-slate-300 text-sm uppercase">Equipment Stats</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500">Slot</label>
                                        <select value={editForm.equipmentStats?.slot} onChange={e => setEditForm({...editForm, equipmentStats: {...editForm.equipmentStats, slot: e.target.value as EquipmentSlot}})} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm">
                                            {Object.values(EquipmentSlot).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">AC Bonus</label>
                                        <input type="number" value={editForm.equipmentStats?.ac || 0} onChange={e => setEditForm({...editForm, equipmentStats: {...editForm.equipmentStats, ac: parseInt(e.target.value)}})} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Dice Count</label>
                                        <input type="number" value={editForm.equipmentStats?.diceCount || 0} onChange={e => setEditForm({...editForm, equipmentStats: {...editForm.equipmentStats, diceCount: parseInt(e.target.value)}})} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Dice Sides</label>
                                        <input type="number" value={editForm.equipmentStats?.diceSides || 0} onChange={e => setEditForm({...editForm, equipmentStats: {...editForm.equipmentStats, diceSides: parseInt(e.target.value)}})} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded shadow-lg">SAVE CHANGES</button>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">Select an item to edit</div>
                )}
            </div>
        </div>
    );
};

const ClassEditor = () => {
    const { classStats, updateClassStats } = useContentStore();
    
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Object.keys(classStats).map(key => {
                const cls = key as CharacterClass;
                const stats = classStats[cls];
                return (
                    <div key={cls} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-amber-100">{cls}</h3>
                            <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">Base Stats</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {Object.values(Ability).map(ability => (
                                <div key={ability} className="flex flex-col items-center">
                                    <label className="text-[10px] font-bold text-slate-500 mb-1">{ability}</label>
                                    <input 
                                        type="number" 
                                        value={stats[ability]} 
                                        onChange={(e) => updateClassStats(cls, { ...stats, [ability]: parseInt(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-600 rounded text-center py-1 font-mono text-amber-400 focus:border-amber-500 outline-none" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const MapConfigurator = () => {
    const { gameConfig, updateConfig } = useContentStore();
    return (
        <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-6">World Generation Parameters</h3>
            
            <div className="space-y-8">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-bold text-slate-300">Noise Scale (Zoom)</label>
                        <span className="font-mono text-amber-400">{gameConfig.mapScale}</span>
                    </div>
                    <input 
                        type="range" min="0.05" max="0.3" step="0.01" 
                        value={gameConfig.mapScale} 
                        onChange={e => updateConfig({ mapScale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">Lower values = Larger biomes. Higher values = Chaotic terrain.</p>
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-bold text-slate-300">Temperature Offset</label>
                        <span className="font-mono text-amber-400">{gameConfig.tempOffset}</span>
                    </div>
                    <input 
                        type="range" min="0" max="1000" step="10" 
                        value={gameConfig.tempOffset} 
                        onChange={e => updateConfig({ tempOffset: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">Shifts the global temperature noise map.</p>
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-bold text-slate-300">Moisture Offset</label>
                        <span className="font-mono text-amber-400">{gameConfig.moistureOffset}</span>
                    </div>
                    <input 
                        type="range" min="0" max="1000" step="10" 
                        value={gameConfig.moistureOffset} 
                        onChange={e => updateConfig({ moistureOffset: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

const ExportView = () => {
    const { exportData, resetToDefaults } = useContentStore();
    const [json, setJson] = useState('');

    const handleGenerate = () => {
        setJson(exportData());
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(json);
        alert('JSON copied to clipboard!');
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="bg-amber-900/20 border border-amber-600/30 p-4 rounded-lg">
                <h3 className="font-bold text-amber-200 mb-2">⚠️ Developer Mode</h3>
                <p className="text-sm text-slate-300">Since this is a client-side app, changes made here are saved to <strong>Local Storage</strong>. To make them permanent for all users, copy the JSON below and update <code className="bg-black/30 px-1 rounded">constants.ts</code> in the source code.</p>
            </div>

            <div className="flex gap-4">
                <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Generate JSON</button>
                <button onClick={handleCopy} disabled={!json} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-bold disabled:opacity-50">Copy to Clipboard</button>
                <button onClick={() => { if(confirm('Reset all admin data?')) resetToDefaults() }} className="ml-auto text-red-400 hover:text-red-300 px-6 py-2 rounded font-bold border border-red-900">Reset to Defaults</button>
            </div>

            <textarea 
                readOnly 
                value={json} 
                placeholder="Click Generate JSON to see the export data..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-green-400 leading-relaxed resize-none focus:outline-none focus:border-slate-600"
            />
        </div>
    );
};

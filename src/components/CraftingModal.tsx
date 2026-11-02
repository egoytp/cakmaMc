import React, { useState } from 'react';
import { X, Hammer, Shield, Wrench, Package, Check, Sparkles } from 'lucide-react';
import { CRAFTING_RECIPES, CraftingRecipe } from '../game/crafting';
import { BlockType, BLOCK_METAS, getTextureAtlas } from '../game/textures';

interface CraftingModalProps {
  inventory: Map<BlockType, number>;
  equippedArmor: {
    helmet: BlockType | null;
    chestplate: BlockType | null;
    leggings: BlockType | null;
    boots: BlockType | null;
  };
  equippedPickaxe: BlockType | null;
  onCraft: (recipe: CraftingRecipe) => void;
  onEquipArmor: (type: BlockType) => void;
  onEquipPickaxe: (type: BlockType) => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  inventory,
  equippedArmor,
  equippedPickaxe,
  onCraft,
  onEquipArmor,
  onEquipPickaxe,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tools' | 'armor' | 'blocks' | 'items'>('all');
  const atlas = getTextureAtlas();

  const canCraft = (recipe: CraftingRecipe) => {
    return recipe.ingredients.every((ing) => {
      const owned = inventory.get(ing.type) || 0;
      return owned >= ing.count;
    });
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (activeCategory === 'all') return true;
    return r.category === activeCategory;
  });

  // Calculate total defense from equipped armor
  const totalDefense = (
    (equippedArmor.helmet ? BLOCK_METAS[equippedArmor.helmet]?.defensePoints || 0 : 0) +
    (equippedArmor.chestplate ? BLOCK_METAS[equippedArmor.chestplate]?.defensePoints || 0 : 0) +
    (equippedArmor.leggings ? BLOCK_METAS[equippedArmor.leggings]?.defensePoints || 0 : 0) +
    (equippedArmor.boots ? BLOCK_METAS[equippedArmor.boots]?.defensePoints || 0 : 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Üretim ve Envanter (Crafting & Inventory)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equipment Status Strip (Pickaxe & Armor) */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-850 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Active Pickaxe */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Aktif Kazma:</span>
            {equippedPickaxe ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                {BLOCK_METAS[equippedPickaxe]?.nameTr} ({BLOCK_METAS[equippedPickaxe]?.miningMultiplier}x Hız)
              </span>
            ) : (
              <span className="text-stone-500">Yumruk (1x)</span>
            )}
          </div>

          {/* Armor Defense Rating */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Toplam Zırh Koruması:</span>
            <div className="flex items-center gap-1 font-bold text-sky-400">
              <Shield className="w-4 h-4 text-sky-400 fill-sky-400/20" />
              <span>{totalDefense} / 20 Zırh Puanı</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 mb-4 border-b border-stone-800 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Hepsi', icon: Package },
            { id: 'tools', label: 'Kazma & Silah', icon: Wrench },
            { id: 'armor', label: 'Zırhlar', icon: Shield },
            { id: 'blocks', label: 'Bloklar', icon: Hammer },
            { id: 'items', label: 'Eşyalar', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recipe Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {filteredRecipes.map((recipe) => {
            const affordable = canCraft(recipe);
            const iconUrl = atlas.getIcon(recipe.result.type);
            const meta = BLOCK_METAS[recipe.result.type];
            const isEquippableTool = meta?.isTool;
            const isEquippableArmor = meta?.isArmor;

            return (
              <div
                key={recipe.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                  affordable
                    ? 'bg-stone-950/80 border-stone-700 hover:border-amber-500/50'
                    : 'bg-stone-950/40 border-stone-850 opacity-60'
                }`}
              >
                {/* Result Item Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center p-1 shrink-0">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={recipe.name}
                        className="w-8 h-8 object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: meta?.color || '#888' }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white font-mono flex items-center gap-2">
                      <span>{recipe.nameTr}</span>
                      <span className="text-stone-500 text-[10px]">x{recipe.result.count}</span>
                    </div>
                    {/* Ingredients needed */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 mt-1 flex-wrap">
                      <span className="text-stone-500">Gereken:</span>
                      {recipe.ingredients.map((ing, idx) => {
                        const owned = inventory.get(ing.type) || 0;
                        const ingMeta = BLOCK_METAS[ing.type];
                        const hasEnough = owned >= ing.count;
                        return (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              hasEnough
                                ? 'bg-stone-850 text-emerald-400'
                                : 'bg-red-950/50 text-red-400'
                            }`}
                          >
                            {ingMeta?.nameTr}: {owned}/{ing.count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Craft / Equip Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Quick Equip if already in inventory */}
                  {isEquippableTool && (inventory.get(recipe.result.type) || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => onEquipPickaxe(recipe.result.type)}
                      className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-mono font-bold transition-colors"
                    >
                      Kuşan
                    </button>
                  )}
                  {isEquippableArmor && (inventory.get(recipe.result.type) || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => onEquipArmor(recipe.result.type)}
                      className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-mono font-bold transition-colors"
                    >
                      Giy
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onCraft(recipe)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      affordable
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Üret</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-stone-800 flex justify-between items-center text-[11px] font-mono text-stone-500 mt-2">
          <span>Kısayol: Menüyü kapatmak için <strong>E</strong> veya <strong>Esc</strong> tuşuna basabilirsiniz.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-mono"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

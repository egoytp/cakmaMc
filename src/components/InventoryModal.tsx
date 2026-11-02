import React, { useState, useEffect } from 'react';
import { BlockType, BLOCK_METAS, getTextureAtlas } from '../game/textures';
import { soundManager } from '../game/audio';
import { BookOpen, X, Sparkles } from 'lucide-react';

export interface InventorySlot {
  type: BlockType;
  count: number;
}

export interface EquippedArmor {
  helmet: BlockType | null;
  chestplate: BlockType | null;
  leggings: BlockType | null;
  boots: BlockType | null;
  offhand: BlockType | null;
}

interface InventoryModalProps {
  slots: (InventorySlot | null)[]; // 0..8 = hotbar, 9..35 = main inventory
  equippedArmor: EquippedArmor;
  activeHotbarIndex: number;
  onUpdateSlots: (newSlots: (InventorySlot | null)[]) => void;
  onUpdateArmor: (newArmor: EquippedArmor) => void;
  onSelectHotbarIndex: (idx: number) => void;
  onClose: () => void;
}

// 2x2 Basic Crafting Recipes
interface Recipe2x2 {
  id: string;
  nameTr: string;
  // 4 items: [top-left, top-right, bottom-left, bottom-right]
  // null or BlockType. Any non-null match checks.
  match: (grid: (BlockType | null)[]) => boolean;
  result: { type: BlockType; count: number };
}

const RECIPES_2X2: Recipe2x2[] = [
  // 1 Wood -> 4 Planks (any single slot)
  {
    id: 'planks',
    nameTr: '4x Tahta Blok',
    match: (g) => {
      const nonNull = g.filter((x) => x !== null);
      return nonNull.length === 1 && nonNull[0] === BlockType.WOOD;
    },
    result: { type: BlockType.PLANKS, count: 4 },
  },
  // 2 Planks vertical -> 4 Sticks
  {
    id: 'sticks',
    nameTr: '4x Çubuk',
    match: (g) => {
      const leftCol = g[0] === BlockType.PLANKS && g[2] === BlockType.PLANKS && !g[1] && !g[3];
      const rightCol = g[1] === BlockType.PLANKS && g[3] === BlockType.PLANKS && !g[0] && !g[2];
      return leftCol || rightCol;
    },
    result: { type: BlockType.STICK, count: 4 },
  },
  // 4 Planks (2x2 filled) -> Crafting Table
  {
    id: 'crafting_table',
    nameTr: 'Çalışma Masası',
    match: (g) => g.every((x) => x === BlockType.PLANKS),
    result: { type: BlockType.CRAFTING_TABLE, count: 1 },
  },
  // 1 Coal + 1 Stick vertical -> 4 Torches
  {
    id: 'torch',
    nameTr: '4x Meşale',
    match: (g) => {
      const leftCol = g[0] === BlockType.COAL && g[2] === BlockType.STICK && !g[1] && !g[3];
      const rightCol = g[1] === BlockType.COAL && g[3] === BlockType.STICK && !g[0] && !g[2];
      return leftCol || rightCol;
    },
    result: { type: BlockType.TORCH, count: 4 },
  },
  // 1 Coal Ore directly -> 1 Coal
  {
    id: 'coal_convert',
    nameTr: 'Kömür',
    match: (g) => {
      const nonNull = g.filter((x) => x !== null);
      return nonNull.length === 1 && nonNull[0] === BlockType.COAL_ORE;
    },
    result: { type: BlockType.COAL, count: 1 },
  },
  // 1 Iron Ore -> 1 Iron Ingot
  {
    id: 'iron_convert',
    nameTr: 'Demir Külçesi',
    match: (g) => {
      const nonNull = g.filter((x) => x !== null);
      return nonNull.length === 1 && nonNull[0] === BlockType.IRON_ORE;
    },
    result: { type: BlockType.IRON_INGOT, count: 1 },
  },
  // 1 Diamond Ore -> 1 Diamond Gem
  {
    id: 'diamond_convert',
    nameTr: 'Elmas Mücevher',
    match: (g) => {
      const nonNull = g.filter((x) => x !== null);
      return nonNull.length === 1 && nonNull[0] === BlockType.DIAMOND_ORE;
    },
    result: { type: BlockType.DIAMOND_GEM, count: 1 },
  },
  // 4 Sand -> 1 Glass
  {
    id: 'glass',
    nameTr: 'Cam Blok',
    match: (g) => g.every((x) => x === BlockType.SAND),
    result: { type: BlockType.GLASS, count: 1 },
  },
  // 4 Cobblestone -> 4 Stone Bricks
  {
    id: 'stone_bricks',
    nameTr: 'Tuğla Blok',
    match: (g) => g.every((x) => x === BlockType.COBBLESTONE),
    result: { type: BlockType.BRICKS, count: 4 },
  },
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  slots,
  equippedArmor,
  activeHotbarIndex,
  onUpdateSlots,
  onUpdateArmor,
  onSelectHotbarIndex,
  onClose,
}) => {
  const atlas = getTextureAtlas();

  // Floating item held on cursor
  const [cursorItem, setCursorItem] = useState<InventorySlot | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 2x2 Crafting Matrix: 0=TL, 1=TR, 2=BL, 3=BR
  const [craftGrid, setCraftGrid] = useState<(InventorySlot | null)[]>([null, null, null, null]);
  const [craftOutput, setCraftOutput] = useState<InventorySlot | null>(null);
  const [showRecipeBook, setShowRecipeBook] = useState(false);

  // Track mouse coordinates for cursor item drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // Recalculate 2x2 crafting output whenever crafting grid changes
  useEffect(() => {
    const gridTypes = craftGrid.map((s) => (s ? s.type : null));
    const matchedRecipe = RECIPES_2X2.find((r) => r.match(gridTypes));
    if (matchedRecipe) {
      setCraftOutput({ type: matchedRecipe.result.type, count: matchedRecipe.result.count });
    } else {
      setCraftOutput(null);
    }
  }, [craftGrid]);

  // Return items in crafting grid to inventory on close
  const handleClose = () => {
    let newSlots = [...slots];
    // Return crafting grid items
    for (const item of craftGrid) {
      if (item) {
        newSlots = addItemToSlots(newSlots, item.type, item.count);
      }
    }
    // Return cursor item
    if (cursorItem) {
      newSlots = addItemToSlots(newSlots, cursorItem.type, cursorItem.count);
      setCursorItem(null);
    }
    onUpdateSlots(newSlots);
    onClose();
  };

  // Helper to add item to slots (stack up to 64)
  const addItemToSlots = (
    currentSlots: (InventorySlot | null)[],
    type: BlockType,
    count: number
  ): (InventorySlot | null)[] => {
    const next = [...currentSlots];
    let remaining = count;

    // 1. Try to merge into existing stacks
    for (let i = 0; i < next.length; i++) {
      const slot = next[i];
      if (slot && slot.type === type && slot.count < 64) {
        const canAdd = Math.min(remaining, 64 - slot.count);
        next[i] = { type, count: slot.count + canAdd };
        remaining -= canAdd;
        if (remaining <= 0) break;
      }
    }

    // 2. Put remainder into first empty slots
    if (remaining > 0) {
      for (let i = 0; i < next.length; i++) {
        if (!next[i]) {
          const add = Math.min(remaining, 64);
          next[i] = { type, count: add };
          remaining -= add;
          if (remaining <= 0) break;
        }
      }
    }

    return next;
  };

  // Click on a main/hotbar inventory slot
  const handleSlotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const targetSlot = slots[index];
    const newSlots = [...slots];

    // Right click with item in hand: deposit 1
    if (isRightClick && cursorItem) {
      if (!targetSlot) {
        newSlots[index] = { type: cursorItem.type, count: 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
        soundManager.playPlace();
      } else if (targetSlot.type === cursorItem.type && targetSlot.count < 64) {
        newSlots[index] = { type: targetSlot.type, count: targetSlot.count + 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
        soundManager.playPlace();
      }
      onUpdateSlots(newSlots);
      return;
    }

    // Right click on slot with NO item in hand: split half stack
    if (isRightClick && !cursorItem && targetSlot) {
      const half = Math.ceil(targetSlot.count / 2);
      const remaining = targetSlot.count - half;
      setCursorItem({ type: targetSlot.type, count: half });
      if (remaining > 0) {
        newSlots[index] = { type: targetSlot.type, count: remaining };
      } else {
        newSlots[index] = null;
      }
      soundManager.playPlace();
      onUpdateSlots(newSlots);
      return;
    }

    // Shift + Left Click: Quick Transfer / Auto-Equip
    if (e.shiftKey && targetSlot) {
      const meta = BLOCK_METAS[targetSlot.type];
      // Quick equip armor if armor piece
      if (meta?.isArmor && meta.armorSlot) {
        const slotKey = meta.armorSlot;
        if (!equippedArmor[slotKey]) {
          onUpdateArmor({ ...equippedArmor, [slotKey]: targetSlot.type });
          if (targetSlot.count > 1) {
            newSlots[index] = { type: targetSlot.type, count: targetSlot.count - 1 };
          } else {
            newSlots[index] = null;
          }
          soundManager.playPlace();
          onUpdateSlots(newSlots);
          return;
        }
      }

      // Quick move between hotbar (0..8) and backpack (9..35)
      const isHotbar = index < 9;
      const searchStart = isHotbar ? 9 : 0;
      const searchEnd = isHotbar ? 36 : 9;

      let remaining = targetSlot.count;

      // Merge with existing
      for (let i = searchStart; i < searchEnd; i++) {
        const s = newSlots[i];
        if (s && s.type === targetSlot.type && s.count < 64) {
          const add = Math.min(remaining, 64 - s.count);
          newSlots[i] = { type: s.type, count: s.count + add };
          remaining -= add;
          if (remaining <= 0) break;
        }
      }

      // Fill empty slot
      if (remaining > 0) {
        for (let i = searchStart; i < searchEnd; i++) {
          if (!newSlots[i]) {
            newSlots[i] = { type: targetSlot.type, count: remaining };
            remaining = 0;
            break;
          }
        }
      }

      if (remaining < targetSlot.count) {
        newSlots[index] = remaining > 0 ? { type: targetSlot.type, count: remaining } : null;
        soundManager.playPlace();
        onUpdateSlots(newSlots);
      }
      return;
    }

    // Standard Left Click
    if (!cursorItem) {
      // Pick up item from slot
      if (targetSlot) {
        setCursorItem(targetSlot);
        newSlots[index] = null;
        soundManager.playPlace();
        onUpdateSlots(newSlots);
      }
    } else {
      // Drop item into slot
      if (!targetSlot) {
        newSlots[index] = cursorItem;
        setCursorItem(null);
        soundManager.playPlace();
        onUpdateSlots(newSlots);
      } else if (targetSlot.type === cursorItem.type) {
        // Stack together
        const space = 64 - targetSlot.count;
        if (space >= cursorItem.count) {
          newSlots[index] = { type: targetSlot.type, count: targetSlot.count + cursorItem.count };
          setCursorItem(null);
        } else {
          newSlots[index] = { type: targetSlot.type, count: 64 };
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - space });
        }
        soundManager.playPlace();
        onUpdateSlots(newSlots);
      } else {
        // Swap items
        newSlots[index] = cursorItem;
        setCursorItem(targetSlot);
        soundManager.playPlace();
        onUpdateSlots(newSlots);
      }
    }
  };

  // Click on Armor Slot
  const handleArmorSlotClick = (slotKey: keyof EquippedArmor) => {
    const curEquipped = equippedArmor[slotKey];
    if (cursorItem) {
      const meta = BLOCK_METAS[cursorItem.type];
      if (slotKey === 'offhand' || (meta?.isArmor && meta.armorSlot === slotKey)) {
        onUpdateArmor({ ...equippedArmor, [slotKey]: cursorItem.type });
        if (cursorItem.count > 1) {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - 1 });
        } else {
          setCursorItem(curEquipped ? { type: curEquipped, count: 1 } : null);
        }
        soundManager.playPlace();
      }
    } else if (curEquipped) {
      setCursorItem({ type: curEquipped, count: 1 });
      onUpdateArmor({ ...equippedArmor, [slotKey]: null });
      soundManager.playPlace();
    }
  };

  // Click on 2x2 Crafting Grid Slot
  const handleCraftGridClick = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const isRight = e.button === 2;
    const targetSlot = craftGrid[idx];
    const newGrid = [...craftGrid];

    if (isRight && cursorItem) {
      if (!targetSlot) {
        newGrid[idx] = { type: cursorItem.type, count: 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
        soundManager.playPlace();
      } else if (targetSlot.type === cursorItem.type && targetSlot.count < 64) {
        newGrid[idx] = { type: targetSlot.type, count: targetSlot.count + 1 };
        if (cursorItem.count > 1) {
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - 1 });
        } else {
          setCursorItem(null);
        }
        soundManager.playPlace();
      }
      setCraftGrid(newGrid);
      return;
    }

    if (!cursorItem) {
      if (targetSlot) {
        setCursorItem(targetSlot);
        newGrid[idx] = null;
        soundManager.playPlace();
        setCraftGrid(newGrid);
      }
    } else {
      if (!targetSlot) {
        newGrid[idx] = cursorItem;
        setCursorItem(null);
        soundManager.playPlace();
        setCraftGrid(newGrid);
      } else if (targetSlot.type === cursorItem.type) {
        const space = 64 - targetSlot.count;
        if (space >= cursorItem.count) {
          newGrid[idx] = { type: targetSlot.type, count: targetSlot.count + cursorItem.count };
          setCursorItem(null);
        } else {
          newGrid[idx] = { type: targetSlot.type, count: 64 };
          setCursorItem({ type: cursorItem.type, count: cursorItem.count - space });
        }
        soundManager.playPlace();
        setCraftGrid(newGrid);
      } else {
        newGrid[idx] = cursorItem;
        setCursorItem(targetSlot);
        soundManager.playPlace();
        setCraftGrid(newGrid);
      }
    }
  };

  // Click on Crafting Output Slot
  const handleCraftOutputClick = () => {
    if (!craftOutput) return;

    if (!cursorItem) {
      setCursorItem(craftOutput);
    } else if (cursorItem.type === craftOutput.type && cursorItem.count + craftOutput.count <= 64) {
      setCursorItem({ type: cursorItem.type, count: cursorItem.count + craftOutput.count });
    } else {
      return; // Hand already holding incompatible item or stack full
    }

    soundManager.playBreak();

    // Decrement 1 from all non-empty crafting grid slots
    const nextGrid = craftGrid.map((s) => {
      if (!s) return null;
      if (s.count > 1) return { type: s.type, count: s.count - 1 };
      return null;
    });
    setCraftGrid(nextGrid);
  };

  // Quick auto-craft recipe from recipe book
  const handleQuickCraft = (recipe: Recipe2x2) => {
    // Check if player has required ingredients in inventory
    // To keep it intuitive, we clear grid, check slots, take 1 of each and put into grid
    let newSlots = [...slots];
    // Put existing grid items back to inventory first
    for (const item of craftGrid) {
      if (item) newSlots = addItemToSlots(newSlots, item.type, item.count);
    }

    // Identify recipe needed
    let success = false;
    if (recipe.id === 'planks') {
      const idx = newSlots.findIndex((s) => s && s.type === BlockType.WOOD);
      if (idx !== -1) {
        const w = newSlots[idx]!;
        if (w.count > 1) newSlots[idx] = { type: w.type, count: w.count - 1 };
        else newSlots[idx] = null;
        setCraftGrid([{ type: BlockType.WOOD, count: 1 }, null, null, null]);
        success = true;
      }
    } else if (recipe.id === 'sticks') {
      const idx = newSlots.findIndex((s) => s && s.type === BlockType.PLANKS && s.count >= 2);
      if (idx !== -1) {
        const p = newSlots[idx]!;
        if (p.count > 2) newSlots[idx] = { type: p.type, count: p.count - 2 };
        else if (p.count === 2) newSlots[idx] = null;
        setCraftGrid([{ type: BlockType.PLANKS, count: 1 }, null, { type: BlockType.PLANKS, count: 1 }, null]);
        success = true;
      }
    } else if (recipe.id === 'crafting_table') {
      const idx = newSlots.findIndex((s) => s && s.type === BlockType.PLANKS && s.count >= 4);
      if (idx !== -1) {
        const p = newSlots[idx]!;
        if (p.count > 4) newSlots[idx] = { type: p.type, count: p.count - 4 };
        else if (p.count === 4) newSlots[idx] = null;
        setCraftGrid([
          { type: BlockType.PLANKS, count: 1 },
          { type: BlockType.PLANKS, count: 1 },
          { type: BlockType.PLANKS, count: 1 },
          { type: BlockType.PLANKS, count: 1 },
        ]);
        success = true;
      }
    } else if (recipe.id === 'torch') {
      const coalIdx = newSlots.findIndex((s) => s && s.type === BlockType.COAL);
      const stickIdx = newSlots.findIndex((s) => s && s.type === BlockType.STICK);
      if (coalIdx !== -1 && stickIdx !== -1) {
        const c = newSlots[coalIdx]!;
        const st = newSlots[stickIdx]!;
        newSlots[coalIdx] = c.count > 1 ? { type: c.type, count: c.count - 1 } : null;
        newSlots[stickIdx] = st.count > 1 ? { type: st.type, count: st.count - 1 } : null;
        setCraftGrid([{ type: BlockType.COAL, count: 1 }, null, { type: BlockType.STICK, count: 1 }, null]);
        success = true;
      }
    }

    if (success) {
      onUpdateSlots(newSlots);
      soundManager.playPlace();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Authentic Minecraft GUI Container (Matching image.png pixel styling) */}
      <div
        className="relative bg-[#c6c6c6] p-4 rounded-sm shadow-2xl flex flex-col"
        style={{
          borderTop: '4px solid #dbdbdb',
          borderLeft: '4px solid #dbdbdb',
          borderRight: '4px solid #555555',
          borderBottom: '4px solid #555555',
          boxShadow: 'inset -2px -2px 0px #373737, inset 2px 2px 0px #ffffff, 0 20px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top Header bar with Close button */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono font-bold text-[#373737] tracking-wider uppercase">
            Envanter
          </span>
          <button
            onClick={handleClose}
            className="w-5 h-5 flex items-center justify-center bg-[#8f8f8f] hover:bg-[#a0a0a0] active:bg-[#707070] text-[#1c1c1c] rounded-none border-t border-l border-white border-b border-r border-[#373737]"
            title="Kapat (E / Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Section: Armor Slots, Player 3D Preview, 2x2 Crafting Matrix */}
        <div className="flex gap-4 mb-4 items-start">
          {/* 1. Left Armor Column: 4 Slots (Helmet, Chestplate, Leggings, Boots) */}
          <div className="flex flex-col gap-1.5">
            {(['helmet', 'chestplate', 'leggings', 'boots'] as const).map((slotKey) => {
              const itemType = equippedArmor[slotKey];
              const iconUrl = itemType ? atlas.getIcon(itemType) : null;

              return (
                <div
                  key={slotKey}
                  onClick={() => handleArmorSlotClick(slotKey)}
                  className="w-10 h-10 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer"
                  style={{
                    borderTop: '2px solid #373737',
                    borderLeft: '2px solid #373737',
                    borderRight: '2px solid #ffffff',
                    borderBottom: '2px solid #ffffff',
                  }}
                  title={itemType ? BLOCK_METAS[itemType]?.nameTr : `Zırh Yuvası: ${slotKey}`}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={itemType ? BLOCK_METAS[itemType]?.name : ''}
                      className="w-7 h-7 object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    // Subtle Silhouette Icons matching image.png
                    <div className="opacity-35 text-[#373737] text-xs font-mono font-bold uppercase">
                      {slotKey === 'helmet' && '👑'}
                      {slotKey === 'chestplate' && '🥋'}
                      {slotKey === 'leggings' && '👖'}
                      {slotKey === 'boots' && '👢'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. Center: Player 3D Character Preview Canvas + Offhand/Shield Slot */}
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-36 bg-black relative overflow-hidden flex items-center justify-center"
              style={{
                borderTop: '2px solid #373737',
                borderLeft: '2px solid #373737',
                borderRight: '2px solid #ffffff',
                borderBottom: '2px solid #ffffff',
              }}
            >
              {/* Retro 2D/3D Steve Silhouette in classic posture */}
              <div className="flex flex-col items-center select-none scale-95 pointer-events-none">
                {/* Steve Head */}
                <div className="w-9 h-9 bg-[#b58156] border-2 border-[#633a1e] relative">
                  {/* Hair */}
                  <div className="w-full h-3 bg-[#4a2e18]" />
                  {/* Eyes */}
                  <div className="flex justify-between px-1.5 mt-1">
                    <div className="w-1.5 h-1 bg-white flex items-center justify-end">
                      <div className="w-1 h-1 bg-[#2563eb]" />
                    </div>
                    <div className="w-1.5 h-1 bg-white flex items-center justify-start">
                      <div className="w-1 h-1 bg-[#2563eb]" />
                    </div>
                  </div>
                  {/* Nose/Mouth */}
                  <div className="w-2.5 h-1 bg-[#8c5836] mx-auto mt-1" />
                </div>
                {/* Steve Torso & Arms */}
                <div className="flex items-start">
                  <div className="w-3.5 h-12 bg-[#0891b2] border-r border-black/30" />
                  <div className="w-7 h-12 bg-[#06b6d4] flex flex-col justify-end" />
                  <div className="w-3.5 h-12 bg-[#0891b2] border-l border-black/30" />
                </div>
                {/* Steve Pants */}
                <div className="flex">
                  <div className="w-4 h-12 bg-[#1e3a8a] border-r border-black/40" />
                  <div className="w-4 h-12 bg-[#1e3a8a]" />
                </div>
              </div>
            </div>

            {/* Offhand / Shield Slot below player preview */}
            <div className="mt-1.5">
              <div
                onClick={() => handleArmorSlotClick('offhand')}
                className="w-9 h-9 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer"
                style={{
                  borderTop: '2px solid #373737',
                  borderLeft: '2px solid #373737',
                  borderRight: '2px solid #ffffff',
                  borderBottom: '2px solid #ffffff',
                }}
                title="Kalkan / İkinci El Yuvası"
              >
                {equippedArmor.offhand ? (
                  <img
                    src={atlas.getIcon(equippedArmor.offhand) || ''}
                    alt=""
                    className="w-6 h-6 object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="opacity-35 text-[#373737] text-xs font-mono font-bold">🛡️</div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Right: Crafting Title, 2x2 Matrix, Arrow -> Output Slot, Recipe Book */}
          <div className="flex flex-col ml-2">
            <span className="text-xs font-mono font-bold text-[#373737] mb-1.5">
              Üretim (Crafting)
            </span>

            <div className="flex items-center gap-2">
              {/* 2x2 Matrix */}
              <div className="grid grid-cols-2 gap-1 bg-[#8b8b8b] p-1 border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-white">
                {[0, 1, 2, 3].map((idx) => {
                  const s = craftGrid[idx];
                  const iconUrl = s ? atlas.getIcon(s.type) : null;
                  return (
                    <div
                      key={idx}
                      onMouseDown={(e) => handleCraftGridClick(idx, e)}
                      className="w-9 h-9 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer hover:bg-[#9c9c9c]"
                      style={{
                        borderTop: '2px solid #373737',
                        borderLeft: '2px solid #373737',
                        borderRight: '2px solid #ffffff',
                        borderBottom: '2px solid #ffffff',
                      }}
                    >
                      {iconUrl && (
                        <img
                          src={iconUrl}
                          alt=""
                          className="w-6 h-6 object-contain [image-rendering:pixelated]"
                        />
                      )}
                      {s && s.count > 1 && (
                        <span
                          className="absolute bottom-0 right-0.5 text-[10px] font-mono font-bold text-white select-none pointer-events-none"
                          style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                        >
                          {s.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Minecraft Pixel Arrow -> */}
              <div className="text-[#555555] font-bold text-lg select-none px-1">
                ➔
              </div>

              {/* Output Slot */}
              <div
                onClick={handleCraftOutputClick}
                className={`w-11 h-11 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer transition-all ${
                  craftOutput ? 'hover:bg-[#9c9c9c] ring-2 ring-emerald-500/80 shadow-md' : ''
                }`}
                style={{
                  borderTop: '2px solid #373737',
                  borderLeft: '2px solid #373737',
                  borderRight: '2px solid #ffffff',
                  borderBottom: '2px solid #ffffff',
                }}
                title={craftOutput ? `${BLOCK_METAS[craftOutput.type]?.nameTr} (${craftOutput.count}x)` : 'Üretim Sonucu'}
              >
                {craftOutput && (
                  <>
                    <img
                      src={atlas.getIcon(craftOutput.type) || ''}
                      alt=""
                      className="w-8 h-8 object-contain [image-rendering:pixelated] drop-shadow animate-pulse"
                    />
                    {craftOutput.count > 1 && (
                      <span
                        className="absolute bottom-0.5 right-1 text-xs font-mono font-bold text-white select-none pointer-events-none"
                        style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                      >
                        {craftOutput.count}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Green Recipe Book Button */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRecipeBook(!showRecipeBook)}
                className={`flex items-center gap-1 px-2 py-1 rounded-none border-t border-l border-white border-b border-r border-[#373737] font-mono text-[10px] font-bold transition-all shadow-sm ${
                  showRecipeBook
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#22c55e] hover:bg-[#16a34a] text-stone-900 active:bg-[#15803d]'
                }`}
                title="Tarif Kitabı (Hızlı Üretim)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tarifler</span>
              </button>

              <span className="text-[10px] font-mono text-stone-600 italic">
                Tahta, Çubuk, Meşale...
              </span>
            </div>
          </div>
        </div>

        {/* Quick Recipe Book Drawer */}
        {showRecipeBook && (
          <div className="mb-3 p-2 bg-[#b5b5b5] border-2 border-[#555555] rounded-none">
            <div className="text-[10px] font-mono font-bold text-stone-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Hızlı 2x2 Tarifler (Tıkla ve Masaya Koy):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RECIPES_2X2.slice(0, 5).map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleQuickCraft(recipe)}
                  className="flex items-center gap-1 px-2 py-1 bg-[#d1d1d1] hover:bg-[#ffffff] active:bg-[#a8a8a8] border-t border-l border-white border-b border-r border-[#555] text-[10px] font-mono font-semibold text-stone-800"
                >
                  <img
                    src={atlas.getIcon(recipe.result.type) || ''}
                    alt=""
                    className="w-4 h-4 object-contain [image-rendering:pixelated]"
                  />
                  <span>{recipe.nameTr}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Bottom Main Inventory: 3 Rows of 9 Slots (Slots 9..35) */}
        <div className="mb-2">
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1 border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-white">
            {Array.from({ length: 27 }, (_, i) => {
              const slotIndex = i + 9;
              const slot = slots[slotIndex];
              const iconUrl = slot ? atlas.getIcon(slot.type) : null;

              return (
                <div
                  key={slotIndex}
                  onMouseDown={(e) => handleSlotClick(slotIndex, e)}
                  className="w-10 h-10 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer hover:bg-[#9c9c9c] transition-colors"
                  style={{
                    borderTop: '2px solid #373737',
                    borderLeft: '2px solid #373737',
                    borderRight: '2px solid #ffffff',
                    borderBottom: '2px solid #ffffff',
                  }}
                  title={slot ? `${BLOCK_METAS[slot.type]?.nameTr} (${slot.count})` : ''}
                >
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={slot ? BLOCK_METAS[slot.type]?.name : ''}
                      className="w-7 h-7 object-contain [image-rendering:pixelated]"
                    />
                  )}
                  {slot && slot.count > 1 && (
                    <span
                      className="absolute bottom-0 right-1 text-xs font-mono font-bold text-white select-none pointer-events-none"
                      style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                    >
                      {slot.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Hotbar Row: 1 Row of 9 Slots (Slots 0..8) with selection indicator and 1-9 labels */}
        <div>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1 border-t-2 border-l-2 border-[#373737] border-b-2 border-r-2 border-white">
            {Array.from({ length: 9 }, (_, idx) => {
              const slot = slots[idx];
              const isSelected = activeHotbarIndex === idx;
              const iconUrl = slot ? atlas.getIcon(slot.type) : null;

              return (
                <div
                  key={idx}
                  onMouseDown={(e) => {
                    handleSlotClick(idx, e);
                    onSelectHotbarIndex(idx);
                  }}
                  className={`w-10 h-10 bg-[#8b8b8b] relative flex items-center justify-center cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-white z-10 scale-105 bg-[#9e9e9e]' : 'hover:bg-[#9c9c9c]'
                  }`}
                  style={{
                    borderTop: isSelected ? '2px solid #ffffff' : '2px solid #373737',
                    borderLeft: isSelected ? '2px solid #ffffff' : '2px solid #373737',
                    borderRight: isSelected ? '2px solid #373737' : '2px solid #ffffff',
                    borderBottom: isSelected ? '2px solid #373737' : '2px solid #ffffff',
                  }}
                  title={slot ? `${BLOCK_METAS[slot.type]?.nameTr} (${slot.count})` : `Yuva ${idx + 1}`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-[#373737] font-bold select-none pointer-events-none">
                    {idx + 1}
                  </span>

                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={slot ? BLOCK_METAS[slot.type]?.name : ''}
                      className="w-7 h-7 object-contain [image-rendering:pixelated]"
                    />
                  )}
                  {slot && slot.count > 1 && (
                    <span
                      className="absolute bottom-0 right-1 text-xs font-mono font-bold text-white select-none pointer-events-none"
                      style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                    >
                      {slot.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick controls help footer */}
        <div className="mt-3 flex justify-between text-[10px] font-mono text-[#555555]">
          <span>Sol Tık: Al/Bırak · Sağ Tık: 1 Tane / Yarıya Böl · Shift+Tık: Hızlı Taşı/Kuşan</span>
          <span>E / ESC: Kapat</span>
        </div>
      </div>

      {/* Floating Item attached to Cursor during Drag & Drop */}
      {cursorItem && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <img
              src={atlas.getIcon(cursorItem.type) || ''}
              alt=""
              className="w-7 h-7 object-contain [image-rendering:pixelated] drop-shadow-xl"
            />
            {cursorItem.count > 1 && (
              <span
                className="absolute bottom-0 right-0 text-xs font-mono font-bold text-white"
                style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
              >
                {cursorItem.count}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

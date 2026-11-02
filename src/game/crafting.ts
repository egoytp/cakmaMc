import { BlockType } from './textures';

export interface CraftingRecipe {
  id: string;
  name: string;
  nameTr: string;
  category: 'blocks' | 'tools' | 'armor' | 'items';
  result: { type: BlockType; count: number };
  ingredients: Array<{ type: BlockType; count: number }>;
  requiresCraftingTable?: boolean;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Basic Blocks
  {
    id: 'planks',
    name: 'Oak Planks',
    nameTr: 'Tahta Blok (4x)',
    category: 'blocks',
    result: { type: BlockType.PLANKS, count: 4 },
    ingredients: [{ type: BlockType.WOOD, count: 1 }],
  },
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    nameTr: 'Çalışma Masası',
    category: 'blocks',
    result: { type: BlockType.CRAFTING_TABLE, count: 1 },
    ingredients: [{ type: BlockType.PLANKS, count: 4 }],
  },
  {
    id: 'furnace',
    name: 'Furnace',
    nameTr: 'Ocak / Fırın',
    category: 'blocks',
    result: { type: BlockType.FURNACE, count: 1 },
    ingredients: [{ type: BlockType.COBBLESTONE, count: 8 }],
    requiresCraftingTable: true,
  },
  {
    id: 'chest',
    name: 'Chest',
    nameTr: 'Sandık',
    category: 'blocks',
    result: { type: BlockType.CHEST, count: 1 },
    ingredients: [{ type: BlockType.PLANKS, count: 8 }],
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    nameTr: 'Kitaplık',
    category: 'blocks',
    result: { type: BlockType.BOOKSHELF, count: 1 },
    ingredients: [{ type: BlockType.PLANKS, count: 6 }],
  },

  // Basic Items
  {
    id: 'sticks',
    name: 'Sticks',
    nameTr: 'Çubuk (4x)',
    category: 'items',
    result: { type: BlockType.STICK, count: 4 },
    ingredients: [{ type: BlockType.PLANKS, count: 2 }],
  },
  {
    id: 'torch',
    name: 'Torch',
    nameTr: 'Meşale (4x)',
    category: 'items',
    result: { type: BlockType.TORCH, count: 4 },
    ingredients: [
      { type: BlockType.COAL, count: 1 },
      { type: BlockType.STICK, count: 1 },
    ],
  },
  {
    id: 'tnt',
    name: 'TNT',
    nameTr: 'TNT Dinamit',
    category: 'blocks',
    result: { type: BlockType.TNT, count: 1 },
    ingredients: [
      { type: BlockType.SAND, count: 4 },
      { type: BlockType.COAL, count: 5 },
    ],
  },

  // Mineral Blocks
  {
    id: 'iron_block',
    name: 'Iron Block',
    nameTr: 'Demir Bloğu',
    category: 'blocks',
    result: { type: BlockType.IRON_BLOCK, count: 1 },
    ingredients: [{ type: BlockType.IRON_INGOT, count: 9 }],
  },
  {
    id: 'gold_block',
    name: 'Gold Block',
    nameTr: 'Altın Bloğu',
    category: 'blocks',
    result: { type: BlockType.GOLD_BLOCK, count: 1 },
    ingredients: [{ type: BlockType.GOLD_INGOT, count: 9 }],
  },
  {
    id: 'diamond_block',
    name: 'Diamond Block',
    nameTr: 'Elmas Bloğu',
    category: 'blocks',
    result: { type: BlockType.DIAMOND_BLOCK, count: 1 },
    ingredients: [{ type: BlockType.DIAMOND_GEM, count: 9 }],
  },

  // Pickaxes
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    nameTr: 'Tahta Kazma (2x Hız)',
    category: 'tools',
    result: { type: BlockType.WOODEN_PICKAXE, count: 1 },
    ingredients: [
      { type: BlockType.PLANKS, count: 3 },
      { type: BlockType.STICK, count: 2 },
    ],
    requiresCraftingTable: true,
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    nameTr: 'Taş Kazma (3x Hız)',
    category: 'tools',
    result: { type: BlockType.STONE_PICKAXE, count: 1 },
    ingredients: [
      { type: BlockType.COBBLESTONE, count: 3 },
      { type: BlockType.STICK, count: 2 },
    ],
    requiresCraftingTable: true,
  },
  {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    nameTr: 'Demir Kazma (5x Hız)',
    category: 'tools',
    result: { type: BlockType.IRON_PICKAXE, count: 1 },
    ingredients: [
      { type: BlockType.IRON_INGOT, count: 3 },
      { type: BlockType.STICK, count: 2 },
    ],
    requiresCraftingTable: true,
  },
  {
    id: 'diamond_pickaxe',
    name: 'Diamond Pickaxe',
    nameTr: 'Elmas Kazma (8x Hız)',
    category: 'tools',
    result: { type: BlockType.DIAMOND_PICKAXE, count: 1 },
    ingredients: [
      { type: BlockType.DIAMOND_GEM, count: 3 },
      { type: BlockType.STICK, count: 2 },
    ],
    requiresCraftingTable: true,
  },

  // Swords
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    nameTr: 'Demir Kılıç (+6 Güç)',
    category: 'tools',
    result: { type: BlockType.IRON_SWORD, count: 1 },
    ingredients: [
      { type: BlockType.IRON_INGOT, count: 2 },
      { type: BlockType.STICK, count: 1 },
    ],
  },
  {
    id: 'diamond_sword',
    name: 'Diamond Sword',
    nameTr: 'Elmas Kılıç (+9 Güç)',
    category: 'tools',
    result: { type: BlockType.DIAMOND_SWORD, count: 1 },
    ingredients: [
      { type: BlockType.DIAMOND_GEM, count: 2 },
      { type: BlockType.STICK, count: 1 },
    ],
  },

  // Armors
  {
    id: 'iron_helmet',
    name: 'Iron Helmet',
    nameTr: 'Demir Kask (+2 Zırh)',
    category: 'armor',
    result: { type: BlockType.IRON_HELMET, count: 1 },
    ingredients: [{ type: BlockType.IRON_INGOT, count: 5 }],
  },
  {
    id: 'iron_chestplate',
    name: 'Iron Chestplate',
    nameTr: 'Demir Göğüslük (+6 Zırh)',
    category: 'armor',
    result: { type: BlockType.IRON_CHESTPLATE, count: 1 },
    ingredients: [{ type: BlockType.IRON_INGOT, count: 8 }],
  },
  {
    id: 'iron_leggings',
    name: 'Iron Leggings',
    nameTr: 'Demir Pantolon (+5 Zırh)',
    category: 'armor',
    result: { type: BlockType.IRON_LEGGINGS, count: 1 },
    ingredients: [{ type: BlockType.IRON_INGOT, count: 7 }],
  },
  {
    id: 'iron_boots',
    name: 'Iron Boots',
    nameTr: 'Demir Bot (+2 Zırh)',
    category: 'armor',
    result: { type: BlockType.IRON_BOOTS, count: 1 },
    ingredients: [{ type: BlockType.IRON_INGOT, count: 4 }],
  },
  {
    id: 'diamond_helmet',
    name: 'Diamond Helmet',
    nameTr: 'Elmas Kask (+3 Zırh)',
    category: 'armor',
    result: { type: BlockType.DIAMOND_HELMET, count: 1 },
    ingredients: [{ type: BlockType.DIAMOND_GEM, count: 5 }],
  },
  {
    id: 'diamond_chestplate',
    name: 'Diamond Chestplate',
    nameTr: 'Elmas Göğüslük (+8 Zırh)',
    category: 'armor',
    result: { type: BlockType.DIAMOND_CHESTPLATE, count: 1 },
    ingredients: [{ type: BlockType.DIAMOND_GEM, count: 8 }],
  },
  {
    id: 'diamond_leggings',
    name: 'Diamond Leggings',
    nameTr: 'Elmas Pantolon (+6 Zırh)',
    category: 'armor',
    result: { type: BlockType.DIAMOND_LEGGINGS, count: 1 },
    ingredients: [{ type: BlockType.DIAMOND_GEM, count: 7 }],
  },
  {
    id: 'diamond_boots',
    name: 'Diamond Boots',
    nameTr: 'Elmas Bot (+3 Zırh)',
    category: 'armor',
    result: { type: BlockType.DIAMOND_BOOTS, count: 1 },
    ingredients: [{ type: BlockType.DIAMOND_GEM, count: 4 }],
  },
];

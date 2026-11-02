import * as THREE from 'three';

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  WATER = 7,
  BRICKS = 8,
  COBBLESTONE = 9,
  PLANKS = 10,
  DIAMOND_ORE = 11,
  GOLD_ORE = 12,
  GLASS = 13,
  GLOWSTONE = 14,
  TNT = 15,
  APPLE = 16,
  COAL_ORE = 17,
  IRON_ORE = 18,
  EMERALD_ORE = 19,
  REDSTONE_ORE = 20,
  LAPIS_ORE = 21,
  OBSIDIAN = 22,
  BEDROCK = 23,
  CRAFTING_TABLE = 24,
  FURNACE = 25,
  BOOKSHELF = 26,
  CHEST = 27,
  TORCH = 28,
  SNOW = 29,
  ICE = 30,
  CLAY = 31,
  GRAVEL = 32,
  IRON_BLOCK = 33,
  GOLD_BLOCK = 34,
  DIAMOND_BLOCK = 35,
  EMERALD_BLOCK = 36,
  MOSSY_COBBLE = 37,

  // Items & Tools
  STICK = 50,
  COAL = 51,
  IRON_INGOT = 52,
  GOLD_INGOT = 53,
  DIAMOND_GEM = 54,
  WOODEN_PICKAXE = 55,
  STONE_PICKAXE = 56,
  IRON_PICKAXE = 57,
  DIAMOND_PICKAXE = 58,
  IRON_SWORD = 59,
  DIAMOND_SWORD = 60,
  IRON_HELMET = 61,
  IRON_CHESTPLATE = 62,
  IRON_LEGGINGS = 63,
  IRON_BOOTS = 64,
  DIAMOND_CHESTPLATE = 65,
  DIAMOND_HELMET = 66,
  DIAMOND_LEGGINGS = 67,
  DIAMOND_BOOTS = 68,
}

export interface BlockMeta {
  id: BlockType;
  name: string;
  nameTr: string;
  isTransparent?: boolean;
  isLiquid?: boolean;
  isFood?: boolean;
  foodPoints?: number;
  lightLevel?: number;
  color: string;
  isItem?: boolean;
  isTool?: boolean;
  toolType?: 'pickaxe' | 'sword';
  miningMultiplier?: number;
  isArmor?: boolean;
  armorSlot?: 'helmet' | 'chestplate' | 'leggings' | 'boots';
  defensePoints?: number;
}

export const BLOCK_METAS: Record<BlockType, BlockMeta> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', nameTr: 'Hava', isTransparent: true, color: 'transparent' },
  [BlockType.GRASS]: { id: BlockType.GRASS, name: 'Grass Block', nameTr: 'Çimen Bloğu', color: '#5b8c32' },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: 'Dirt', nameTr: 'Toprak', color: '#866043' },
  [BlockType.STONE]: { id: BlockType.STONE, name: 'Stone', nameTr: 'Taş', color: '#7a7a7a' },
  [BlockType.WOOD]: { id: BlockType.WOOD, name: 'Oak Wood', nameTr: 'Meşe Odunu', color: '#685332' },
  [BlockType.LEAVES]: { id: BlockType.LEAVES, name: 'Oak Leaves', nameTr: 'Meşe Yaprakları', isTransparent: true, color: '#3a7d28' },
  [BlockType.SAND]: { id: BlockType.SAND, name: 'Sand', nameTr: 'Kum', color: '#d9cd8c' },
  [BlockType.WATER]: { id: BlockType.WATER, name: 'Water', nameTr: 'Su', isTransparent: true, isLiquid: true, color: '#3b82f6' },
  [BlockType.BRICKS]: { id: BlockType.BRICKS, name: 'Bricks', nameTr: 'Tuğla', color: '#9c4436' },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: 'Cobblestone', nameTr: 'Kırık Taş', color: '#616161' },
  [BlockType.PLANKS]: { id: BlockType.PLANKS, name: 'Oak Planks', nameTr: 'Tahta Blok', color: '#b8945f' },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: 'Diamond Ore', nameTr: 'Elmas Cevheri', color: '#45ded4' },
  [BlockType.GOLD_ORE]: { id: BlockType.GOLD_ORE, name: 'Gold Ore', nameTr: 'Altın Cevheri', color: '#eab308' },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: 'Glass', nameTr: 'Cam', isTransparent: true, color: '#cce5ff' },
  [BlockType.GLOWSTONE]: { id: BlockType.GLOWSTONE, name: 'Glowstone', nameTr: 'Işıktaşı', lightLevel: 15, color: '#fef08a' },
  [BlockType.TNT]: { id: BlockType.TNT, name: 'TNT', nameTr: 'TNT Dinamit', color: '#dc2626' },
  [BlockType.APPLE]: { id: BlockType.APPLE, name: 'Red Apple', nameTr: 'Kırmızı Elma', isFood: true, foodPoints: 4, color: '#ef4444', isItem: true },

  // New Ores & Blocks
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: 'Coal Ore', nameTr: 'Kömür Cevheri', color: '#262626' },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: 'Iron Ore', nameTr: 'Demir Cevheri', color: '#d4b49b' },
  [BlockType.EMERALD_ORE]: { id: BlockType.EMERALD_ORE, name: 'Emerald Ore', nameTr: 'Zümrüt Cevheri', color: '#10b981' },
  [BlockType.REDSTONE_ORE]: { id: BlockType.REDSTONE_ORE, name: 'Redstone Ore', nameTr: 'Kızıltaş Cevheri', lightLevel: 8, color: '#ef4444' },
  [BlockType.LAPIS_ORE]: { id: BlockType.LAPIS_ORE, name: 'Lapis Ore', nameTr: 'Lapis Cevheri', color: '#1d4ed8' },
  [BlockType.OBSIDIAN]: { id: BlockType.OBSIDIAN, name: 'Obsidian', nameTr: 'Obsidyen', color: '#181124' },
  [BlockType.BEDROCK]: { id: BlockType.BEDROCK, name: 'Bedrock', nameTr: 'Katman Kayası', color: '#1c1917' },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: 'Crafting Table', nameTr: 'Çalışma Masası', color: '#a16207' },
  [BlockType.FURNACE]: { id: BlockType.FURNACE, name: 'Furnace', nameTr: 'Fırın / Ocak', color: '#52525b' },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: 'Bookshelf', nameTr: 'Kitaplık', color: '#854d0e' },
  [BlockType.CHEST]: { id: BlockType.CHEST, name: 'Chest', nameTr: 'Sandık', color: '#b45309' },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: 'Torch', nameTr: 'Meşale', lightLevel: 15, isTransparent: true, color: '#fbbf24' },
  [BlockType.SNOW]: { id: BlockType.SNOW, name: 'Snow Block', nameTr: 'Kar Bloğu', color: '#f8fafc' },
  [BlockType.ICE]: { id: BlockType.ICE, name: 'Ice', nameTr: 'Buz', isTransparent: true, color: '#93c5fd' },
  [BlockType.CLAY]: { id: BlockType.CLAY, name: 'Clay Block', nameTr: 'Kil Bloğu', color: '#94a3b8' },
  [BlockType.GRAVEL]: { id: BlockType.GRAVEL, name: 'Gravel', nameTr: 'Çakıl', color: '#64748b' },
  [BlockType.IRON_BLOCK]: { id: BlockType.IRON_BLOCK, name: 'Iron Block', nameTr: 'Demir Bloğu', color: '#e2e8f0' },
  [BlockType.GOLD_BLOCK]: { id: BlockType.GOLD_BLOCK, name: 'Gold Block', nameTr: 'Altın Bloğu', color: '#facc15' },
  [BlockType.DIAMOND_BLOCK]: { id: BlockType.DIAMOND_BLOCK, name: 'Diamond Block', nameTr: 'Elmas Bloğu', color: '#22d3ee' },
  [BlockType.EMERALD_BLOCK]: { id: BlockType.EMERALD_BLOCK, name: 'Emerald Block', nameTr: 'Zümrüt Bloğu', color: '#059669' },
  [BlockType.MOSSY_COBBLE]: { id: BlockType.MOSSY_COBBLE, name: 'Mossy Cobblestone', nameTr: 'Yosunlu Taş', color: '#475569' },

  // Items & Tools
  [BlockType.STICK]: { id: BlockType.STICK, name: 'Stick', nameTr: 'Çubuk', color: '#78350f', isItem: true },
  [BlockType.COAL]: { id: BlockType.COAL, name: 'Coal', nameTr: 'Kömür', color: '#171717', isItem: true },
  [BlockType.IRON_INGOT]: { id: BlockType.IRON_INGOT, name: 'Iron Ingot', nameTr: 'Demir Külçesi', color: '#cbd5e1', isItem: true },
  [BlockType.GOLD_INGOT]: { id: BlockType.GOLD_INGOT, name: 'Gold Ingot', nameTr: 'Altın Külçesi', color: '#fbbf24', isItem: true },
  [BlockType.DIAMOND_GEM]: { id: BlockType.DIAMOND_GEM, name: 'Diamond', nameTr: 'Elmas Mücevher', color: '#38bdf8', isItem: true },

  // Pickaxes
  [BlockType.WOODEN_PICKAXE]: { id: BlockType.WOODEN_PICKAXE, name: 'Wooden Pickaxe', nameTr: 'Tahta Kazma', isItem: true, isTool: true, toolType: 'pickaxe', miningMultiplier: 2, color: '#92400e' },
  [BlockType.STONE_PICKAXE]: { id: BlockType.STONE_PICKAXE, name: 'Stone Pickaxe', nameTr: 'Taş Kazma', isItem: true, isTool: true, toolType: 'pickaxe', miningMultiplier: 3, color: '#71717a' },
  [BlockType.IRON_PICKAXE]: { id: BlockType.IRON_PICKAXE, name: 'Iron Pickaxe', nameTr: 'Demir Kazma', isItem: true, isTool: true, toolType: 'pickaxe', miningMultiplier: 5, color: '#e2e8f0' },
  [BlockType.DIAMOND_PICKAXE]: { id: BlockType.DIAMOND_PICKAXE, name: 'Diamond Pickaxe', nameTr: 'Elmas Kazma', isItem: true, isTool: true, toolType: 'pickaxe', miningMultiplier: 8, color: '#06b6d4' },

  // Swords
  [BlockType.IRON_SWORD]: { id: BlockType.IRON_SWORD, name: 'Iron Sword', nameTr: 'Demir Kılıç', isItem: true, isTool: true, toolType: 'sword', miningMultiplier: 2, color: '#e2e8f0' },
  [BlockType.DIAMOND_SWORD]: { id: BlockType.DIAMOND_SWORD, name: 'Diamond Sword', nameTr: 'Elmas Kılıç', isItem: true, isTool: true, toolType: 'sword', miningMultiplier: 3, color: '#06b6d4' },

  // Armors
  [BlockType.IRON_HELMET]: { id: BlockType.IRON_HELMET, name: 'Iron Helmet', nameTr: 'Demir Kask', isItem: true, isArmor: true, armorSlot: 'helmet', defensePoints: 2, color: '#cbd5e1' },
  [BlockType.IRON_CHESTPLATE]: { id: BlockType.IRON_CHESTPLATE, name: 'Iron Chestplate', nameTr: 'Demir Göğüslük', isItem: true, isArmor: true, armorSlot: 'chestplate', defensePoints: 6, color: '#cbd5e1' },
  [BlockType.IRON_LEGGINGS]: { id: BlockType.IRON_LEGGINGS, name: 'Iron Leggings', nameTr: 'Demir Pantolon', isItem: true, isArmor: true, armorSlot: 'leggings', defensePoints: 5, color: '#cbd5e1' },
  [BlockType.IRON_BOOTS]: { id: BlockType.IRON_BOOTS, name: 'Iron Boots', nameTr: 'Demir Bot', isItem: true, isArmor: true, armorSlot: 'boots', defensePoints: 2, color: '#cbd5e1' },
  [BlockType.DIAMOND_HELMET]: { id: BlockType.DIAMOND_HELMET, name: 'Diamond Helmet', nameTr: 'Elmas Kask', isItem: true, isArmor: true, armorSlot: 'helmet', defensePoints: 3, color: '#06b6d4' },
  [BlockType.DIAMOND_CHESTPLATE]: { id: BlockType.DIAMOND_CHESTPLATE, name: 'Diamond Chestplate', nameTr: 'Elmas Göğüslük', isItem: true, isArmor: true, armorSlot: 'chestplate', defensePoints: 8, color: '#06b6d4' },
  [BlockType.DIAMOND_LEGGINGS]: { id: BlockType.DIAMOND_LEGGINGS, name: 'Diamond Leggings', nameTr: 'Elmas Pantolon', isItem: true, isArmor: true, armorSlot: 'leggings', defensePoints: 6, color: '#06b6d4' },
  [BlockType.DIAMOND_BOOTS]: { id: BlockType.DIAMOND_BOOTS, name: 'Diamond Boots', nameTr: 'Elmas Bot', isItem: true, isArmor: true, armorSlot: 'boots', defensePoints: 3, color: '#06b6d4' },
};

function createPixelTexture(drawFn: (ctx: CanvasRenderingContext2D, size: number) => void, size = 16): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  drawFn(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function prng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class TextureAtlas {
  materials: Map<string, THREE.Material> = new Map();
  blockMaterials: Map<BlockType, THREE.Material | THREE.Material[]> = new Map();
  iconDataUrls: Map<BlockType, string> = new Map();

  constructor() {
    this.initTextures();
  }

  private initTextures() {
    // 1. DIRT
    const dirtTex = createPixelTexture((ctx, s) => {
      const rand = prng(101);
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.7) {
            ctx.fillStyle = '#6f4e34';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#9b704f';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 2. GRASS TOP
    const grassTopTex = createPixelTexture((ctx, s) => {
      const rand = prng(202);
      ctx.fillStyle = '#5b8c32';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.75) {
            ctx.fillStyle = '#4c7828';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#6da13d';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 3. GRASS SIDE (Properly upright: grass on top, dirt on bottom)
    const grassSideTex = createPixelTexture((ctx, s) => {
      const rand = prng(303);
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          if (rand() > 0.7) {
            ctx.fillStyle = '#6f4e34';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      for (let x = 0; x < s; x++) {
        const drop = Math.floor(rand() * 3) + 2;
        for (let y = 0; y < drop; y++) {
          ctx.fillStyle = rand() > 0.4 ? '#5b8c32' : '#4c7828';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 4. STONE
    const stoneTex = createPixelTexture((ctx, s) => {
      const rand = prng(404);
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.8) {
            ctx.fillStyle = '#595959';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#929292';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 5. WOOD SIDE
    const woodSideTex = createPixelTexture((ctx, s) => {
      const rand = prng(505);
      ctx.fillStyle = '#685332';
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x++) {
        const darkGroove = x % 4 === 0 || x % 5 === 2;
        for (let y = 0; y < s; y++) {
          const r = rand();
          if (darkGroove || r > 0.8) {
            ctx.fillStyle = '#4c3b21';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#7f6640';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 6. WOOD TOP
    const woodTopTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#b8945f';
      ctx.fillRect(0, 0, s, s);
      const cx = 7.5;
      const cy = 7.5;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > 7) {
            ctx.fillStyle = '#4c3b21';
            ctx.fillRect(x, y, 1, 1);
          } else if (Math.floor(d) % 2 === 0) {
            ctx.fillStyle = '#a6824f';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 7. LEAVES
    const leavesTex = createPixelTexture((ctx, s) => {
      const rand = prng(707);
      ctx.fillStyle = '#3a7d28';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.8) {
            ctx.fillStyle = '#2d631e';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.3) {
            ctx.fillStyle = '#4c9935';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.45) {
            ctx.fillStyle = '#1e4414';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 8. SAND
    const sandTex = createPixelTexture((ctx, s) => {
      const rand = prng(808);
      ctx.fillStyle = '#d9cd8c';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.85) {
            ctx.fillStyle = '#c5b774';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.15) {
            ctx.fillStyle = '#ebe1a6';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 9. WATER
    const waterTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = 'rgba(40, 110, 220, 0.75)';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = 'rgba(70, 150, 245, 0.4)';
      for (let y = 0; y < s; y += 4) {
        ctx.fillRect(0, y, s, 2);
      }
    });

    // 10. BRICKS
    const bricksTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#c5bfb8';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#9c4436';
      ctx.fillRect(1, 1, 6, 2);
      ctx.fillRect(8, 1, 7, 2);
      ctx.fillRect(1, 4, 3, 2);
      ctx.fillRect(5, 4, 6, 2);
      ctx.fillRect(12, 4, 3, 2);
      ctx.fillRect(1, 7, 6, 2);
      ctx.fillRect(8, 7, 7, 2);
      ctx.fillRect(1, 10, 3, 2);
      ctx.fillRect(5, 10, 6, 2);
      ctx.fillRect(12, 10, 3, 2);
      ctx.fillRect(1, 13, 6, 2);
      ctx.fillRect(8, 13, 7, 2);
    });

    // 11. COBBLESTONE
    const cobbleTex = createPixelTexture((ctx, s) => {
      const rand = prng(1111);
      ctx.fillStyle = '#616161';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.8) {
            ctx.fillStyle = '#424242';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#828282';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 12. PLANKS
    const planksTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#b8945f';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#8f6f40';
      ctx.fillRect(0, 3, s, 1);
      ctx.fillRect(0, 7, s, 1);
      ctx.fillRect(0, 11, s, 1);
      ctx.fillRect(0, 15, s, 1);
      ctx.fillRect(6, 0, 1, 3);
      ctx.fillRect(12, 4, 1, 3);
      ctx.fillRect(4, 8, 1, 3);
      ctx.fillRect(10, 12, 1, 3);
    });

    // Helper to generate ore texture
    const makeOreTexture = (gemColor: string, gemColorLight: string, seed: number) => {
      return createPixelTexture((ctx, s) => {
        const rand = prng(seed);
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y++) {
          for (let x = 0; x < s; x++) {
            const r = rand();
            if (r > 0.8) {
              ctx.fillStyle = '#595959';
              ctx.fillRect(x, y, 1, 1);
            } else if (r < 0.2) {
              ctx.fillStyle = '#929292';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        const coords = [
          [3, 4], [4, 4], [4, 5],
          [9, 2], [10, 2], [10, 3],
          [6, 9], [7, 9], [7, 10], [6, 10],
          [12, 11], [13, 11], [12, 12],
          [3, 11], [4, 12], [11, 6],
        ];
        for (const [gx, gy] of coords) {
          ctx.fillStyle = rand() > 0.5 ? gemColor : gemColorLight;
          ctx.fillRect(gx, gy, 1, 1);
        }
      });
    };

    // 13. ORES
    const diamondOreTex = makeOreTexture('#3be8d9', '#a5f3fc', 1313);
    const goldOreTex = makeOreTexture('#facc15', '#fef08a', 1414);
    const coalOreTex = makeOreTexture('#1c1917', '#44403c', 1717);
    const ironOreTex = makeOreTexture('#d4b49b', '#f5d0b5', 1818);
    const emeraldOreTex = makeOreTexture('#10b981', '#6ee7b7', 1919);
    const redstoneOreTex = makeOreTexture('#dc2626', '#f87171', 2020);
    const lapisOreTex = makeOreTexture('#1d4ed8', '#60a5fa', 2121);

    // 14. GLASS
    const glassTex = createPixelTexture((ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      ctx.fillStyle = 'rgba(230, 245, 255, 0.25)';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, s - 1, s, 1);
      ctx.fillRect(0, 0, 1, s);
      ctx.fillRect(s - 1, 0, 1, s);
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(4, 4, 1, 1);
    });

    // 15. GLOWSTONE
    const glowstoneTex = createPixelTexture((ctx, s) => {
      const rand = prng(1616);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.7) {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.25) {
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 16. TNT
    const tntSideTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 6, s, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(2, 7, 3, 1);
      ctx.fillRect(3, 8, 1, 2);
      ctx.fillRect(6, 7, 1, 3);
      ctx.fillRect(7, 8, 1, 1);
      ctx.fillRect(8, 7, 1, 3);
      ctx.fillRect(10, 7, 3, 1);
      ctx.fillRect(11, 8, 1, 2);
    });
    const tntTopTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#525252';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(7, 7, 2, 2);
    });

    // 17. CRAFTING TABLE
    const craftingTableTop = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(1, 1, 6, 6);
      ctx.fillRect(9, 1, 6, 6);
      ctx.fillRect(1, 9, 6, 6);
      ctx.fillRect(9, 9, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(11, 3, 2, 2);
    });
    const craftingTableSide = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#b8945f';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 2, 12, 12);
      // Tools silhouette
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(4, 5, 4, 2);
      ctx.fillRect(5, 7, 2, 5);
      ctx.fillRect(10, 4, 2, 8);
    });

    // 18. FURNACE
    const furnaceFront = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#616161';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(3, 5, 10, 7);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(5, 8, 6, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 9, 4, 1);
    });

    // 19. BOOKSHELF
    const bookshelfTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#b8945f';
      ctx.fillRect(0, 0, s, s);
      // Shelf 1
      const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = bookColors[i % bookColors.length];
        ctx.fillRect(2 + i * 2, 2, 2, 5);
      }
      // Shelf divider
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 7, s, 2);
      // Shelf 2
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = bookColors[(i + 2) % bookColors.length];
        ctx.fillRect(2 + i * 2, 9, 2, 5);
      }
    });

    // 20. OBSIDIAN & BEDROCK
    const obsidianTex = createPixelTexture((ctx, s) => {
      const rand = prng(2222);
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.8) {
            ctx.fillStyle = '#3b1d60';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.2) {
            ctx.fillStyle = '#0f081c';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
    const bedrockTex = createPixelTexture((ctx, s) => {
      const rand = prng(2323);
      ctx.fillStyle = '#262626';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = rand();
          if (r > 0.7) {
            ctx.fillStyle = '#171717';
            ctx.fillRect(x, y, 1, 1);
          } else if (r < 0.3) {
            ctx.fillStyle = '#404040';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 21. MINERAL BLOCKS
    const makeBlockTexture = (mainColor: string, borderDark: string, borderLight: string) => {
      return createPixelTexture((ctx, s) => {
        ctx.fillStyle = mainColor;
        ctx.fillRect(0, 0, s, s);
        // Bevel borders
        ctx.fillStyle = borderLight;
        ctx.fillRect(0, 0, s, 1);
        ctx.fillRect(0, 0, 1, s);
        ctx.fillStyle = borderDark;
        ctx.fillRect(0, s - 1, s, 1);
        ctx.fillRect(s - 1, 0, 1, s);
        // Inner frame
        ctx.fillRect(2, 2, s - 4, 1);
        ctx.fillRect(2, 2, 1, s - 4);
      });
    };
    const ironBlockTex = makeBlockTexture('#e2e8f0', '#94a3b8', '#ffffff');
    const goldBlockTex = makeBlockTexture('#facc15', '#ca8a04', '#fef08a');
    const diamondBlockTex = makeBlockTexture('#22d3ee', '#0891b2', '#a5f3fc');
    const emeraldBlockTex = makeBlockTexture('#059669', '#047857', '#34d399');

    // 22. SNOW, ICE, CLAY
    const snowTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(2, 4, 1, 1);
      ctx.fillRect(8, 10, 1, 1);
    });
    const iceTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = 'rgba(147, 197, 253, 0.75)';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(2, 2, 4, 1);
      ctx.fillRect(8, 8, 4, 1);
    });
    const clayTex = createPixelTexture((ctx, s) => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, s, s);
    });

    // 23. APPLE
    const appleTex = createPixelTexture((ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 5, 8, 8);
      ctx.fillRect(5, 4, 6, 1);
      ctx.fillRect(5, 13, 6, 1);
      ctx.fillRect(3, 6, 1, 6);
      ctx.fillRect(12, 6, 1, 6);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(5, 5, 2, 2);
      ctx.fillStyle = '#573d1c';
      ctx.fillRect(7, 2, 2, 2);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(9, 2, 2, 1);
    });

    // 24. ITEMS: Stick, Coal, Iron Ingot, Diamond Gem, Pickaxes, Swords
    const stickTex = createPixelTexture((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = '#78350f';
      for (let i = 2; i < 14; i++) {
        ctx.fillRect(i, 15 - i, 2, 2);
      }
    });

    const ironIngotTex = createPixelTexture((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(3, 5, 10, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 5, 10, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(3, 9, 10, 2);
    });

    const goldIngotTex = createPixelTexture((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(3, 5, 10, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 5, 10, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(3, 9, 10, 2);
    });

    const makePickaxeTex = (headColor: string) => {
      return createPixelTexture((ctx) => {
        ctx.clearRect(0, 0, 16, 16);
        // Handle
        ctx.fillStyle = '#78350f';
        for (let i = 3; i < 12; i++) {
          ctx.fillRect(i, 15 - i, 2, 2);
        }
        // Pick head
        ctx.fillStyle = headColor;
        ctx.fillRect(9, 2, 5, 3);
        ctx.fillRect(11, 4, 3, 3);
        ctx.fillRect(6, 4, 3, 3);
        ctx.fillRect(4, 7, 3, 3);
      });
    };

    const makeSwordTex = (bladeColor: string) => {
      return createPixelTexture((ctx) => {
        ctx.clearRect(0, 0, 16, 16);
        // Handle
        ctx.fillStyle = '#78350f';
        ctx.fillRect(3, 12, 2, 2);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(4, 10, 3, 2);
        ctx.fillRect(2, 11, 2, 2);
        // Blade
        ctx.fillStyle = bladeColor;
        for (let i = 5; i < 13; i++) {
          ctx.fillRect(i, 16 - i - 2, 2, 2);
        }
        ctx.fillRect(11, 2, 2, 2);
      });
    };

    // Material instances
    const matDirt = new THREE.MeshLambertMaterial({ map: dirtTex });
    const matGrassTop = new THREE.MeshLambertMaterial({ map: grassTopTex });
    const matGrassSide = new THREE.MeshLambertMaterial({ map: grassSideTex });
    const matStone = new THREE.MeshLambertMaterial({ map: stoneTex });
    const matWoodSide = new THREE.MeshLambertMaterial({ map: woodSideTex });
    const matWoodTop = new THREE.MeshLambertMaterial({ map: woodTopTex });
    const matLeaves = new THREE.MeshLambertMaterial({ map: leavesTex, transparent: true, alphaTest: 0.2 });
    const matSand = new THREE.MeshLambertMaterial({ map: sandTex });
    const matWater = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.7 });
    const matBricks = new THREE.MeshLambertMaterial({ map: bricksTex });
    const matCobblestone = new THREE.MeshLambertMaterial({ map: cobbleTex });
    const matPlanks = new THREE.MeshLambertMaterial({ map: planksTex });
    const matDiamondOre = new THREE.MeshLambertMaterial({ map: diamondOreTex });
    const matGoldOre = new THREE.MeshLambertMaterial({ map: goldOreTex });
    const matCoalOre = new THREE.MeshLambertMaterial({ map: coalOreTex });
    const matIronOre = new THREE.MeshLambertMaterial({ map: ironOreTex });
    const matEmeraldOre = new THREE.MeshLambertMaterial({ map: emeraldOreTex });
    const matRedstoneOre = new THREE.MeshLambertMaterial({ map: redstoneOreTex, emissive: new THREE.Color(0xd00000), emissiveIntensity: 0.4 });
    const matLapisOre = new THREE.MeshLambertMaterial({ map: lapisOreTex });
    const matGlass = new THREE.MeshLambertMaterial({ map: glassTex, transparent: true, opacity: 0.65 });
    const matGlowstone = new THREE.MeshLambertMaterial({ map: glowstoneTex, emissive: new THREE.Color(0xffd700), emissiveIntensity: 0.6 });
    const matTntSide = new THREE.MeshLambertMaterial({ map: tntSideTex });
    const matTntTop = new THREE.MeshLambertMaterial({ map: tntTopTex });
    const matApple = new THREE.MeshLambertMaterial({ map: appleTex, transparent: true, alphaTest: 0.2 });
    const matObsidian = new THREE.MeshLambertMaterial({ map: obsidianTex });
    const matBedrock = new THREE.MeshLambertMaterial({ map: bedrockTex });
    const matBookshelf = new THREE.MeshLambertMaterial({ map: bookshelfTex });
    const matSnow = new THREE.MeshLambertMaterial({ map: snowTex });
    const matIce = new THREE.MeshLambertMaterial({ map: iceTex, transparent: true, opacity: 0.8 });
    const matClay = new THREE.MeshLambertMaterial({ map: clayTex });
    const matIronBlock = new THREE.MeshLambertMaterial({ map: ironBlockTex });
    const matGoldBlock = new THREE.MeshLambertMaterial({ map: goldBlockTex });
    const matDiamondBlock = new THREE.MeshLambertMaterial({ map: diamondBlockTex });
    const matEmeraldBlock = new THREE.MeshLambertMaterial({ map: emeraldBlockTex });

    // Multi-face cubes
    const grassMats = [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide];
    const woodMats = [matWoodSide, matWoodSide, matWoodTop, matWoodTop, matWoodSide, matWoodSide];
    const tntMats = [matTntSide, matTntSide, matTntTop, matTntTop, matTntSide, matTntSide];
    const craftMats = [
      new THREE.MeshLambertMaterial({ map: craftingTableSide }),
      new THREE.MeshLambertMaterial({ map: craftingTableSide }),
      new THREE.MeshLambertMaterial({ map: craftingTableTop }),
      matPlanks,
      new THREE.MeshLambertMaterial({ map: craftingTableSide }),
      new THREE.MeshLambertMaterial({ map: craftingTableSide }),
    ];
    const furnaceMats = [
      matCobblestone,
      matCobblestone,
      matCobblestone,
      matCobblestone,
      new THREE.MeshLambertMaterial({ map: furnaceFront }),
      matCobblestone,
    ];

    // Register blocks
    this.blockMaterials.set(BlockType.GRASS, grassMats);
    this.blockMaterials.set(BlockType.DIRT, matDirt);
    this.blockMaterials.set(BlockType.STONE, matStone);
    this.blockMaterials.set(BlockType.WOOD, woodMats);
    this.blockMaterials.set(BlockType.LEAVES, matLeaves);
    this.blockMaterials.set(BlockType.SAND, matSand);
    this.blockMaterials.set(BlockType.WATER, matWater);
    this.blockMaterials.set(BlockType.BRICKS, matBricks);
    this.blockMaterials.set(BlockType.COBBLESTONE, matCobblestone);
    this.blockMaterials.set(BlockType.PLANKS, matPlanks);
    this.blockMaterials.set(BlockType.DIAMOND_ORE, matDiamondOre);
    this.blockMaterials.set(BlockType.GOLD_ORE, matGoldOre);
    this.blockMaterials.set(BlockType.COAL_ORE, matCoalOre);
    this.blockMaterials.set(BlockType.IRON_ORE, matIronOre);
    this.blockMaterials.set(BlockType.EMERALD_ORE, matEmeraldOre);
    this.blockMaterials.set(BlockType.REDSTONE_ORE, matRedstoneOre);
    this.blockMaterials.set(BlockType.LAPIS_ORE, matLapisOre);
    this.blockMaterials.set(BlockType.GLASS, matGlass);
    this.blockMaterials.set(BlockType.GLOWSTONE, matGlowstone);
    this.blockMaterials.set(BlockType.TNT, tntMats);
    this.blockMaterials.set(BlockType.APPLE, matApple);
    this.blockMaterials.set(BlockType.CRAFTING_TABLE, craftMats);
    this.blockMaterials.set(BlockType.FURNACE, furnaceMats);
    this.blockMaterials.set(BlockType.BOOKSHELF, matBookshelf);
    this.blockMaterials.set(BlockType.OBSIDIAN, matObsidian);
    this.blockMaterials.set(BlockType.BEDROCK, matBedrock);
    this.blockMaterials.set(BlockType.SNOW, matSnow);
    this.blockMaterials.set(BlockType.ICE, matIce);
    this.blockMaterials.set(BlockType.CLAY, matClay);
    this.blockMaterials.set(BlockType.GRAVEL, matCobblestone);
    this.blockMaterials.set(BlockType.IRON_BLOCK, matIronBlock);
    this.blockMaterials.set(BlockType.GOLD_BLOCK, matGoldBlock);
    this.blockMaterials.set(BlockType.DIAMOND_BLOCK, matDiamondBlock);
    this.blockMaterials.set(BlockType.EMERALD_BLOCK, matEmeraldBlock);
    this.blockMaterials.set(BlockType.CHEST, woodMats);
    this.blockMaterials.set(BlockType.TORCH, matGlowstone);
    this.blockMaterials.set(BlockType.MOSSY_COBBLE, matCobblestone);

    // Tools & Item Materials
    this.blockMaterials.set(BlockType.STICK, new THREE.MeshBasicMaterial({ map: stickTex, transparent: true }));
    this.blockMaterials.set(BlockType.IRON_INGOT, new THREE.MeshBasicMaterial({ map: ironIngotTex, transparent: true }));
    this.blockMaterials.set(BlockType.GOLD_INGOT, new THREE.MeshBasicMaterial({ map: goldIngotTex, transparent: true }));
    this.blockMaterials.set(BlockType.DIAMOND_GEM, matDiamondBlock);
    this.blockMaterials.set(BlockType.COAL, matCoalOre);

    this.blockMaterials.set(BlockType.WOODEN_PICKAXE, new THREE.MeshBasicMaterial({ map: makePickaxeTex('#a16207'), transparent: true }));
    this.blockMaterials.set(BlockType.STONE_PICKAXE, new THREE.MeshBasicMaterial({ map: makePickaxeTex('#71717a'), transparent: true }));
    this.blockMaterials.set(BlockType.IRON_PICKAXE, new THREE.MeshBasicMaterial({ map: makePickaxeTex('#e2e8f0'), transparent: true }));
    this.blockMaterials.set(BlockType.DIAMOND_PICKAXE, new THREE.MeshBasicMaterial({ map: makePickaxeTex('#22d3ee'), transparent: true }));

    this.blockMaterials.set(BlockType.IRON_SWORD, new THREE.MeshBasicMaterial({ map: makeSwordTex('#e2e8f0'), transparent: true }));
    this.blockMaterials.set(BlockType.DIAMOND_SWORD, new THREE.MeshBasicMaterial({ map: makeSwordTex('#22d3ee'), transparent: true }));

    this.blockMaterials.set(BlockType.IRON_HELMET, matIronBlock);
    this.blockMaterials.set(BlockType.IRON_CHESTPLATE, matIronBlock);
    this.blockMaterials.set(BlockType.IRON_LEGGINGS, matIronBlock);
    this.blockMaterials.set(BlockType.IRON_BOOTS, matIronBlock);
    this.blockMaterials.set(BlockType.DIAMOND_HELMET, matDiamondBlock);
    this.blockMaterials.set(BlockType.DIAMOND_CHESTPLATE, matDiamondBlock);
    this.blockMaterials.set(BlockType.DIAMOND_LEGGINGS, matDiamondBlock);
    this.blockMaterials.set(BlockType.DIAMOND_BOOTS, matDiamondBlock);

    // Cache preview icons
    for (const type of Object.values(BlockType)) {
      if (typeof type === 'number' && type !== BlockType.AIR) {
        const mat = this.blockMaterials.get(type);
        const singleMat = Array.isArray(mat) ? mat[2] || mat[0] : mat;
        if (singleMat && 'map' in singleMat && singleMat.map) {
          const canvas = (singleMat.map as THREE.CanvasTexture).image as HTMLCanvasElement;
          if (canvas && canvas.toDataURL) {
            this.iconDataUrls.set(type, canvas.toDataURL());
          }
        }
      }
    }
  }

  getMaterial(type: BlockType): THREE.Material | THREE.Material[] {
    return this.blockMaterials.get(type) || this.blockMaterials.get(BlockType.STONE)!;
  }

  getIcon(type: BlockType): string {
    return this.iconDataUrls.get(type) || '';
  }
}

let atlasInstance: TextureAtlas | null = null;
export function getTextureAtlas(): TextureAtlas {
  if (!atlasInstance) {
    atlasInstance = new TextureAtlas();
  }
  return atlasInstance;
}

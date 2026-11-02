import * as THREE from 'three';
import { BlockType, getTextureAtlas, BLOCK_METAS } from './textures';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_HEIGHT = 64;
export const SEA_LEVEL = 12;

// High quality 2D/3D procedural Perlin & Ridged noise
export class Noise2D {
  private perm: number[] = [];

  constructor(seed = 1337) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;

    let s = (seed ^ 0x5bf03635) % 2147483647;
    if (s <= 0) s += 2147483646;

    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }

    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  octave(x: number, y: number, octaves = 4, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  // Ridged noise for sharp, dramatic mountain ridges and alpine peaks
  ridged(x: number, y: number, octaves = 3, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      const val = 1.0 - Math.abs(this.noise(x * frequency, y * frequency));
      total += val * val * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  // Fast 3D noise approximation for cave carving
  noise3D(x: number, y: number, z: number): number {
    const xy = this.noise(x, y);
    const yz = this.noise(y + 31.41, z);
    const xz = this.noise(x + 17.13, z + 53.21);
    return (xy + yz + xz) / 3.0;
  }
}

// Face definitions: [dirX, dirY, dirZ], quad vertices, face index for multi-materials
// Face indices: 0: +X (Right), 1: -X (Left), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (Front), 5: -Z (Back)
const FACES = [
  {
    dir: [1, 0, 0],
    faceIdx: 0,
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    normal: [1, 0, 0],
    tint: 0.85,
  },
  {
    dir: [-1, 0, 0],
    faceIdx: 1,
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    normal: [-1, 0, 0],
    tint: 0.85,
  },
  {
    dir: [0, 1, 0],
    faceIdx: 2,
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    normal: [0, 1, 0],
    tint: 1.0,
  },
  {
    dir: [0, -1, 0],
    faceIdx: 3,
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    normal: [0, -1, 0],
    tint: 0.55,
  },
  {
    dir: [0, 0, 1],
    faceIdx: 4,
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    normal: [0, 0, 1],
    tint: 0.75,
  },
  {
    dir: [0, 0, -1],
    faceIdx: 5,
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    normal: [0, 0, -1],
    tint: 0.75,
  },
];

export class Chunk {
  cx: number;
  cz: number;
  blocks: Uint8Array;
  mesh: THREE.Mesh | null = null;
  waterMesh: THREE.Mesh | null = null;
  isDirty = true;
  world: VoxelWorld;

  constructor(cx: number, cz: number, world: VoxelWorld) {
    this.cx = cx;
    this.cz = cz;
    this.world = world;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_HEIGHT * CHUNK_SIZE_Z);
  }

  getIndex(lx: number, ly: number, lz: number): number {
    return lx + lz * CHUNK_SIZE_X + ly * CHUNK_SIZE_X * CHUNK_SIZE_Z;
  }

  getBlock(lx: number, ly: number, lz: number): BlockType {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(lx, ly, lz)];
  }

  setBlock(lx: number, ly: number, lz: number, type: BlockType) {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return;
    }
    this.blocks[this.getIndex(lx, ly, lz)] = type;
    this.isDirty = true;
  }

  heights = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);

  // Generates procedurally rich terrain with jagged mountains, snow peaks, rolling valleys, caves & ores
  generateTerrain(noise: Noise2D) {
    const worldX = this.cx * CHUNK_SIZE_X;
    const worldZ = this.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = worldX + lx;
        const wz = worldZ + lz;

        // 1. Continental landmass noise (broad ocean vs land elevations)
        const continent = noise.octave(wx * 0.007, wz * 0.007, 3, 0.5);

        // 2. Mountain presence mask: where mountains rise
        const mountainMask = Math.pow(Math.max(0, noise.octave(wx * 0.01 + 50, wz * 0.01 + 50, 3, 0.5) * 1.5 - 0.2), 1.6);

        // 3. Sharp mountain ridges (up to 38 blocks of jagged elevation)
        const mountainRidges = Math.pow(noise.ridged(wx * 0.018, wz * 0.018, 3, 0.5), 2.2) * 38.0 * mountainMask;

        // 4. Rolling hills & terrain detail
        const hills = noise.octave(wx * 0.035, wz * 0.035, 4, 0.45) * 8.0;

        // Total calculated ground surface elevation
        const rawHeight = 15.0 + (continent * 7.0) + mountainRidges + hills;
        const height = Math.min(CHUNK_HEIGHT - 4, Math.max(2, Math.floor(rawHeight)));
        this.heights[lx + lz * CHUNK_SIZE_X] = height;

        for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
          // Bottom bedrock layer
          if (ly === 0) {
            this.setBlock(lx, ly, lz, BlockType.BEDROCK);
            continue;
          }
          if (ly === 1 && noise.noise(wx * 0.3, wz * 0.3) > 0) {
            this.setBlock(lx, ly, lz, BlockType.BEDROCK);
            continue;
          }

          if (ly > height) {
            if (ly <= SEA_LEVEL) {
              this.setBlock(lx, ly, lz, BlockType.WATER);
            } else {
              this.setBlock(lx, ly, lz, BlockType.AIR);
            }
          } else {
            // Realistic 3D Cave carving: dual noise worm tunnels & subterranean chambers
            const c1 = noise.noise3D(wx * 0.034, ly * 0.052, wz * 0.034);
            const c2 = noise.noise3D(wx * 0.034 + 131.7, ly * 0.052 + 57.3, wz * 0.034 + 89.1);
            const isTunnel = (c1 * c1 + c2 * c2) < 0.022 && ly > 2 && ly < height - 2;

            // Natural open chambers / ravines
            const cavernVal = noise.noise3D(wx * 0.02, ly * 0.026, wz * 0.02);
            const isCavern = cavernVal > 0.41 && ly > 3 && ly < 26 && ly < height - 3;

            const isCave = isTunnel || isCavern;

            if (isCave) {
              this.setBlock(lx, ly, lz, BlockType.AIR);
              continue;
            }

            // Surface block
            if (ly === height) {
              if (height >= 38) {
                // High mountain peaks: snow cap!
                this.setBlock(lx, ly, lz, BlockType.SNOW);
              } else if (height >= 30) {
                // High slopes: bare stone & gravel
                this.setBlock(lx, ly, lz, BlockType.STONE);
              } else if (height <= SEA_LEVEL + 1) {
                // Shorelines / beaches
                this.setBlock(lx, ly, lz, BlockType.SAND);
              } else {
                // Green valleys & meadows
                this.setBlock(lx, ly, lz, BlockType.GRASS);
              }
            } else if (ly >= height - 3) {
              // Subsurface layer
              if (height >= 38) {
                this.setBlock(lx, ly, lz, BlockType.SNOW);
              } else if (height >= 30) {
                this.setBlock(lx, ly, lz, BlockType.COBBLESTONE);
              } else if (height <= SEA_LEVEL + 1) {
                this.setBlock(lx, ly, lz, BlockType.SAND);
              } else {
                this.setBlock(lx, ly, lz, BlockType.DIRT);
              }
            } else {
              // Deep stone with strictly depth-based ore distribution (embedded in stone only)
              const oreNoise1 = noise.noise(wx * 0.20 + ly * 0.28, wz * 0.20);
              const oreNoise2 = noise.noise(wx * 0.25, wz * 0.25 + ly * 0.18);

              // 1. Diamond Ore: Deepest layers only (y=2 to 12), genuine rarity
              if (ly >= 2 && ly <= 12 && oreNoise1 > 0.44 && oreNoise2 > 0.25) {
                this.setBlock(lx, ly, lz, BlockType.DIAMOND_ORE);
              }
              // 2. Redstone Ore: Deep layers (y=3 to 16)
              else if (ly >= 3 && ly <= 16 && oreNoise1 < -0.38) {
                this.setBlock(lx, ly, lz, BlockType.REDSTONE_ORE);
              }
              // 3. Gold Ore: Deep/mid layers (y=6 to 22)
              else if (ly >= 6 && ly <= 22 && oreNoise2 > 0.38) {
                this.setBlock(lx, ly, lz, BlockType.GOLD_ORE);
              }
              // 4. Iron Ore: Mid layers (y=8 to 40)
              else if (ly >= 8 && ly <= 40 && (oreNoise1 > 0.27 || oreNoise1 < -0.29)) {
                this.setBlock(lx, ly, lz, BlockType.IRON_ORE);
              }
              // 5. Coal Ore: Near surface to mid depth (y=18 to 55)
              else if (ly >= 18 && ly <= 55 && oreNoise2 > 0.20) {
                this.setBlock(lx, ly, lz, BlockType.COAL_ORE);
              }
              // 6. Emerald Ore: Mountain peaks only (y >= 34)
              else if (ly >= 34 && height >= 38 && oreNoise1 > 0.38) {
                this.setBlock(lx, ly, lz, BlockType.EMERALD_ORE);
              }
              // 7. Obsidian near bedrock
              else if (ly <= 4 && oreNoise1 > 0.46) {
                this.setBlock(lx, ly, lz, BlockType.OBSIDIAN);
              }
              // 8. Cobblestone pockets / veins
              else if (oreNoise1 > 0.40) {
                this.setBlock(lx, ly, lz, BlockType.COBBLESTONE);
              } else {
                this.setBlock(lx, ly, lz, BlockType.STONE);
              }
            }
          }
        }
      }
    }

    // Pass 2: Natural Trees (Spaced out, full rounded canopies, never sliced or overlapping)
    // Runs strictly AFTER Pass 1 terrain generation so air loops never overwrite leaves!
    const candidateSpots = [
      {
        lx: 4 + (Math.abs(Math.sin(this.cx * 13 + this.cz * 37)) * 3 | 0),
        lz: 4 + (Math.abs(Math.cos(this.cx * 29 + this.cz * 41)) * 3 | 0),
      },
      {
        lx: 11 + (Math.abs(Math.sin(this.cx * 43 + this.cz * 17)) * 3 | 0),
        lz: 11 + (Math.abs(Math.cos(this.cx * 19 + this.cz * 53)) * 3 | 0),
      },
      {
        lx: 4 + (Math.abs(Math.cos(this.cx * 31 + this.cz * 47)) * 3 | 0),
        lz: 11 + (Math.abs(Math.sin(this.cx * 23 + this.cz * 59)) * 3 | 0),
      },
    ];

    for (const spot of candidateSpots) {
      const wx = worldX + spot.lx;
      const wz = worldZ + spot.lz;

      // Forest biome probability check
      const forestNoise = noise.noise(wx * 0.045, wz * 0.045);
      const treeRand = Math.abs(Math.sin(wx * 37.13 + wz * 91.17)) * 43758.5453 % 1;

      // Only grow if in forest/meadow and passes density check (leaves natural clearings)
      if (forestNoise > -0.2 && treeRand > 0.38) {
        // Find top surface block
        let surfaceY = -1;
        for (let y = CHUNK_HEIGHT - 6; y >= SEA_LEVEL + 2; y--) {
          const b = this.getBlock(spot.lx, y, spot.lz);
          if (b !== BlockType.AIR) {
            if (b === BlockType.GRASS) {
              surfaceY = y;
            }
            break;
          }
        }

        // Only plant on green grass in valleys/plains (not in snow or stone slopes)
        if (surfaceY >= SEA_LEVEL + 2 && surfaceY <= 32) {
          const trunkH = treeRand > 0.75 ? 5 : 4;
          this.growTree(spot.lx, surfaceY + 1, spot.lz, trunkH);
        }
      }
    }
  }

  // Grows a complete, natural Minecraft oak tree with full 3D canopy
  growTree(lx: number, startY: number, lz: number, trunkHeight = 4) {
    if (startY + trunkHeight + 2 >= CHUNK_HEIGHT) return;

    // Soil underneath becomes dirt
    this.setBlock(lx, startY - 1, lz, BlockType.DIRT);

    // Wood trunk
    for (let ty = 0; ty < trunkHeight; ty++) {
      this.setBlock(lx, startY + ty, lz, BlockType.WOOD);
    }

    // Full 3D Rounded Leaves Canopy (4 layers)
    // Layer 0: 5x5 rounded (startY + trunkHeight - 2)
    // Layer 1: 5x5 rounded (startY + trunkHeight - 1)
    // Layer 2: 3x3 rounded (startY + trunkHeight)
    // Layer 3: Cross shape (startY + trunkHeight + 1)
    const layers = [
      { yOffset: trunkHeight - 2, radius: 2, omitCorners: true },
      { yOffset: trunkHeight - 1, radius: 2, omitCorners: true },
      { yOffset: trunkHeight, radius: 1, omitCorners: false },
      { yOffset: trunkHeight + 1, radius: 1, crossOnly: true },
    ];

    for (const layer of layers) {
      const cy = startY + layer.yOffset;
      if (cy >= CHUNK_HEIGHT) continue;

      const r = layer.radius;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (layer.crossOnly && Math.abs(dx) + Math.abs(dz) > 1) continue;
          if (layer.omitCorners && Math.abs(dx) === r && Math.abs(dz) === r) continue;

          const px = lx + dx;
          const pz = lz + dz;

          // Inside chunk boundary check
          if (px >= 0 && px < CHUNK_SIZE_X && pz >= 0 && pz < CHUNK_SIZE_Z) {
            const cur = this.getBlock(px, cy, pz);
            if (cur === BlockType.AIR) {
              this.setBlock(px, cy, pz, BlockType.LEAVES);
            }
          }
        }
      }
    }
  }

  // Build ultra-optimized mesh: batched material groups (only 1 draw call per material) & fast local array lookups
  buildMesh(scene: THREE.Scene, atlas: ReturnType<typeof getTextureAtlas>) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }

    const solidPositions: number[] = [];
    const solidNormals: number[] = [];
    const solidUvs: number[] = [];
    const solidColors: number[] = [];

    const waterPositions: number[] = [];
    const waterNormals: number[] = [];
    const waterUvs: number[] = [];
    const waterIndices: number[] = [];

    // Map material UUID to its index and array of quad indices
    const materials: THREE.Material[] = [];
    const matKeyToIndex = new Map<string, number>();
    const indicesByMat = new Map<number, number[]>();

    const worldStartX = this.cx * CHUNK_SIZE_X;
    const worldStartZ = this.cz * CHUNK_SIZE_Z;

    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      const yOffset = ly * (CHUNK_SIZE_X * CHUNK_SIZE_Z);
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const zOffset = lz * CHUNK_SIZE_X;
        for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
          const block = this.blocks[lx + zOffset + yOffset];
          if (block === BlockType.AIR) continue;

          const wx = worldStartX + lx;
          const wy = ly;
          const wz = worldStartZ + lz;

          if (block === BlockType.WATER) {
            // Check top face for water surface
            const blockAbove = ly + 1 < CHUNK_HEIGHT ? this.blocks[lx + zOffset + (ly + 1) * (CHUNK_SIZE_X * CHUNK_SIZE_Z)] : BlockType.AIR;
            if (blockAbove === BlockType.AIR) {
              const baseIndex = waterPositions.length / 3;
              const f = FACES[2]; // Top face
              for (const corner of f.corners) {
                waterPositions.push(wx + corner[0], wy + corner[1] - 0.1, wz + corner[2]);
                waterNormals.push(f.normal[0], f.normal[1], f.normal[2]);
              }
              waterUvs.push(0, 1, 1, 1, 1, 0, 0, 0);
              waterIndices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3);
            }
            continue;
          }

          // Solid blocks: check all 6 faces for occlusion culling
          for (const f of FACES) {
            const nlx = lx + f.dir[0];
            const nly = ly + f.dir[1];
            const nlz = lz + f.dir[2];

            let neighbor: BlockType;
            if (nly < 0 || nly >= CHUNK_HEIGHT) {
              neighbor = BlockType.AIR;
            } else if (nlx >= 0 && nlx < CHUNK_SIZE_X && nlz >= 0 && nlz < CHUNK_SIZE_Z) {
              // ULTRA-FAST: Direct typed array access inside the same chunk!
              neighbor = this.blocks[nlx + nlz * CHUNK_SIZE_X + nly * (CHUNK_SIZE_X * CHUNK_SIZE_Z)];
            } else {
              // Across chunk border: query world
              neighbor = this.world.getBlock(wx + f.dir[0], wy + f.dir[1], wz + f.dir[2]);
            }

            const neighborMeta = BLOCK_METAS[neighbor];
            const isTransparent = neighbor === BlockType.AIR || (neighborMeta && (neighborMeta.isLiquid || neighborMeta.isTransparent));

            if (isTransparent) {
              // Resolve material
              let rawMat = atlas.getMaterial(block);
              if (Array.isArray(rawMat)) {
                rawMat = rawMat[f.faceIdx] || rawMat[0];
              }
              const mKey = rawMat.uuid;
              let matIndex = matKeyToIndex.get(mKey);
              if (matIndex === undefined) {
                matIndex = materials.length;
                materials.push(rawMat);
                matKeyToIndex.set(mKey, matIndex);
                indicesByMat.set(matIndex, []);
              }

              const baseIndex = solidPositions.length / 3;
              const groundHeight = this.heights[lx + lz * CHUNK_SIZE_X] || 20;

              // Realistic lighting system: Sunlight attenuates with depth into dark caves
              const depthBelowSurface = Math.max(0, groundHeight - wy);
              const sunlight = wy >= groundHeight ? 1.0 : Math.max(0.14, 1.0 - (depthBelowSurface / 16.0) * 0.86);

              // Proximity to placed torches
              let torchLight = 0;
              if (this.world.torches.size > 0) {
                for (const t of this.world.torches.values()) {
                  const dx = t.x - wx;
                  const dy = t.y - wy;
                  const dz = t.z - wz;
                  const distSq = dx * dx + dy * dy + dz * dz;
                  if (distSq < 144) {
                    const dist = Math.sqrt(distSq);
                    const atten = Math.max(0, 1.0 - dist / 12.0);
                    if (atten > torchLight) torchLight = atten;
                  }
                }
              }

              // Combined illumination: Sunlight vs Torch glow
              const effectiveLight = Math.min(1.0, Math.max(sunlight, torchLight * 1.2));
              const baseTint = f.tint;

              // Warm amber tint when illuminated by torch
              const r = Math.min(1.0, baseTint * effectiveLight + (torchLight > 0.08 ? torchLight * 0.22 : 0));
              const g = Math.min(1.0, baseTint * effectiveLight + (torchLight > 0.08 ? torchLight * 0.14 : 0));
              const b = Math.min(1.0, baseTint * effectiveLight);

              for (const corner of f.corners) {
                solidPositions.push(wx + corner[0], wy + corner[1], wz + corner[2]);
                solidNormals.push(f.normal[0], f.normal[1], f.normal[2]);
                solidColors.push(r, g, b);
              }

              solidUvs.push(0, 1, 1, 1, 1, 0, 0, 0);

              // Push quad indices into this material's bucket
              const bucket = indicesByMat.get(matIndex)!;
              bucket.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3);
            }
          }
        }
      }
    }

    if (solidPositions.length > 0) {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(solidPositions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(solidNormals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(solidUvs, 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(solidColors, 3));

      // Concatenate indices grouped by material: exactly ONE addGroup per material!
      // This reduces draw calls by up to 95%!
      const sortedIndices: number[] = [];
      let groupOffset = 0;

      for (let m = 0; m < materials.length; m++) {
        const bucket = indicesByMat.get(m);
        if (!bucket || bucket.length === 0) continue;

        for (let i = 0; i < bucket.length; i++) {
          sortedIndices.push(bucket[i]);
        }
        geom.addGroup(groupOffset, bucket.length, m);
        groupOffset += bucket.length;
      }

      geom.setIndex(sortedIndices);

      this.mesh = new THREE.Mesh(geom, materials.length === 1 ? materials[0] : materials);
      // Disable expensive dynamic shadow maps on voxel terrain (vertex colors & normals give fast, authentic shading)
      this.mesh.castShadow = false;
      this.mesh.receiveShadow = false;
      scene.add(this.mesh);
    }

    if (waterPositions.length > 0) {
      const waterGeom = new THREE.BufferGeometry();
      waterGeom.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeom.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeom.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
      waterGeom.setIndex(waterIndices);

      const waterMat = atlas.getMaterial(BlockType.WATER);
      this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
      scene.add(this.waterMesh);
    }

    this.isDirty = false;
  }

  dispose(scene: THREE.Scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
  }
}

export class VoxelWorld {
  scene: THREE.Scene;
  atlas = getTextureAtlas();
  noise: Noise2D;
  seed: number;
  chunks = new Map<string, Chunk>();
  modifiedBlocks = new Map<string, BlockType>(); // key: "x,y,z"
  renderRadius = 5;

  constructor(scene: THREE.Scene, seed = 12345) {
    this.scene = scene;
    this.seed = seed;
    this.noise = new Noise2D(seed);
  }

  reseed(newSeed: number) {
    if (this.seed === newSeed) return;
    this.seed = newSeed;
    this.noise = new Noise2D(newSeed);
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene);
    }
    this.chunks.clear();
  }

  getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz, this);
      chunk.generateTerrain(this.noise);

      // Apply any modified blocks to this newly generated chunk
      const startX = cx * CHUNK_SIZE_X;
      const startZ = cz * CHUNK_SIZE_Z;
      for (const [posKey, type] of this.modifiedBlocks.entries()) {
        const [bx, by, bz] = posKey.split(',').map(Number);
        if (bx >= startX && bx < startX + CHUNK_SIZE_X && bz >= startZ && bz < startZ + CHUNK_SIZE_Z) {
          const lx = bx - startX;
          const lz = bz - startZ;
          chunk.setBlock(lx, by, lz, type);
        }
      }

      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  worldToChunkCoord(x: number, z: number): { cx: number; cz: number; lx: number; lz: number } {
    const cx = Math.floor(x / CHUNK_SIZE_X);
    const cz = Math.floor(z / CHUNK_SIZE_Z);
    let lx = Math.floor(x % CHUNK_SIZE_X);
    let lz = Math.floor(z % CHUNK_SIZE_Z);
    if (lx < 0) lx += CHUNK_SIZE_X;
    if (lz < 0) lz += CHUNK_SIZE_Z;
    return { cx, cz, lx, lz };
  }

  getBlock(x: number, y: number, z: number): BlockType {
    const iy = Math.floor(y);
    if (iy < 0 || iy >= CHUNK_HEIGHT) return BlockType.AIR;

    if (this.modifiedBlocks.size > 0) {
      const key = `${Math.floor(x)},${iy},${Math.floor(z)}`;
      const mod = this.modifiedBlocks.get(key);
      if (mod !== undefined) return mod;
    }

    const { cx, cz, lx, lz } = this.worldToChunkCoord(x, z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BlockType.AIR;

    return chunk.getBlock(lx, iy, lz);
  }

  torches = new Map<string, { x: number; y: number; z: number }>();

  setBlock(x: number, y: number, z: number, type: BlockType, syncMesh = true): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    if (iy < 0 || iy >= CHUNK_HEIGHT) return false;

    const key = `${ix},${iy},${iz}`;
    const oldType = this.getBlock(ix, iy, iz);
    this.modifiedBlocks.set(key, type);

    const isTorchChange = type === BlockType.TORCH || oldType === BlockType.TORCH;
    if (type === BlockType.TORCH) {
      this.torches.set(key, { x: ix, y: iy, z: iz });
    } else {
      this.torches.delete(key);
    }

    const { cx, cz, lx, lz } = this.worldToChunkCoord(ix, iz);
    const chunk = this.getOrCreateChunk(cx, cz);
    chunk.setBlock(lx, iy, lz, type);

    if (syncMesh) {
      chunk.buildMesh(this.scene, this.atlas);

      // If block is on the edge of the chunk, update neighbor chunk mesh as well
      if (lx === 0 || isTorchChange) this.getChunk(cx - 1, cz)?.buildMesh(this.scene, this.atlas);
      if (lx === CHUNK_SIZE_X - 1 || isTorchChange) this.getChunk(cx + 1, cz)?.buildMesh(this.scene, this.atlas);
      if (lz === 0 || isTorchChange) this.getChunk(cx, cz - 1)?.buildMesh(this.scene, this.atlas);
      if (lz === CHUNK_SIZE_Z - 1 || isTorchChange) this.getChunk(cx, cz + 1)?.buildMesh(this.scene, this.atlas);
    }

    return true;
  }

  // Update visible chunks around player position with distance prioritization and frame budgeting
  updateChunksAround(px: number, pz: number, radius = this.renderRadius, maxMeshBuilds = 2) {
    const center = this.worldToChunkCoord(px, pz);
    const neededKeys = new Set<string>();
    const candidates: { cx: number; cz: number; distSq: number }[] = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const distSq = dx * dx + dz * dz;
        if (distSq > radius * radius + 1) continue;
        const cx = center.cx + dx;
        const cz = center.cz + dz;
        const key = this.getChunkKey(cx, cz);
        neededKeys.add(key);
        candidates.push({ cx, cz, distSq });
      }
    }

    // Sort by distance to player: closest chunks build first
    candidates.sort((a, b) => a.distSq - b.distSq);

    let builds = 0;
    for (const c of candidates) {
      const chunk = this.getOrCreateChunk(c.cx, c.cz);
      if (chunk.isDirty && builds < maxMeshBuilds) {
        chunk.buildMesh(this.scene, this.atlas);
        builds++;
      }
    }

    // Unload chunks far away to maintain high FPS performance
    for (const [key, chunk] of this.chunks.entries()) {
      if (!neededKeys.has(key)) {
        chunk.dispose(this.scene);
        this.chunks.delete(key);
      }
    }
  }

  // Find accurate ground surface height at x, z to spawn player safely on top of the terrain
  getSpawnHeight(x: number, z: number): number {
    const { cx, cz } = this.worldToChunkCoord(x, z);
    // Crucial: ensure the chunk is generated first before probing height
    this.getOrCreateChunk(cx, cz);

    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const b = this.getBlock(x, y, z);
      if (b !== BlockType.AIR && b !== BlockType.WATER) {
        return y + 1.0;
      }
    }
    return 24.0;
  }

  // Clear and dispose all active chunk meshes
  clear() {
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene);
    }
    this.chunks.clear();
  }
}

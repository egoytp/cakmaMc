import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VoxelWorld } from './voxelWorld';
import { BlockType, BLOCK_METAS, getTextureAtlas } from './textures';
import { PlayerPhysics, PlayerInput } from './physics';
import { PlayerMesh, RemotePlayerData } from './playerMesh';
import { soundManager } from './audio';
import { InventorySlot } from '../components/InventoryModal';

export interface GameSettings {
  fov: number;
  sensitivity: number;
  renderDistance: number;
  volume: number;
  viewBobbing: boolean;
}

interface GameCanvasProps {
  isSinglePlayer: boolean;
  playerName: string;
  playerColor: string;
  roomId: string;
  worldSeed: number;
  settings: GameSettings;
  activeHotbarIndex: number;
  hotbarItems: (InventorySlot | null)[];
  onSelectSlot: (idx: number) => void;
  remotePlayers: Map<string, RemotePlayerData>;
  isChatOpen: boolean;
  isPaused: boolean;
  health: number;
  hunger: number;
  oxygen: number;
  isDead: boolean;
  onBlockBreak: (x: number, y: number, z: number, type: BlockType) => void;
  onBlockPlace: (x: number, y: number, z: number, type: BlockType) => void;
  onPlayerMove: (
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    isMoving: boolean,
    isSprinting: boolean,
    heldItem: number
  ) => void;
  isCraftingOpen: boolean;
  equippedPickaxe: BlockType | null;
  onOpenCrafting: () => void;
  onTogglePause: (paused: boolean) => void;
  onOpenChat: () => void;
  onUpdateStats: (stats: {
    fps: number;
    x: number;
    y: number;
    z: number;
    biome: string;
    light: number;
    timeOfDay: number;
  }) => void;
  onTakeDamage: (amount: number, reason: string) => void;
  onHeal: (amount: number) => void;
  onEatFood: (foodType: BlockType) => void;
  onItemPickup: (type: BlockType) => void;
  onOxygenChange: (oxygen: number) => void;
  onHungerChange: (deltaHunger: number) => void;
  onRegisterTeleport?: (fn: (x: number, y: number, z: number) => void) => void;
  onRegisterExternalBlockChange?: (fn: (x: number, y: number, z: number, type: BlockType) => void) => void;
  onRegisterTimeSync?: (fn: (time: number) => void) => void;
}

interface FloatingDrop {
  id: string;
  type: BlockType;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spawnTime: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isSinglePlayer,
  playerName: _playerName,
  playerColor,
  roomId: _roomId,
  worldSeed,
  settings,
  activeHotbarIndex,
  hotbarItems,
  onSelectSlot,
  remotePlayers,
  isChatOpen,
  isPaused,
  isCraftingOpen,
  equippedPickaxe,
  onOpenCrafting,
  health,
  hunger,
  oxygen,
  isDead,
  onBlockBreak,
  onBlockPlace,
  onPlayerMove,
  onTogglePause,
  onOpenChat,
  onUpdateStats,
  onTakeDamage,
  onHeal,
  onEatFood,
  onItemPickup,
  onOxygenChange,
  onHungerChange,
  onRegisterTeleport,
  onRegisterExternalBlockChange,
  onRegisterTimeSync,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    settings,
    activeHotbarIndex,
    hotbarItems,
    isChatOpen,
    isPaused,
    isCraftingOpen,
    equippedPickaxe,
    remotePlayers,
    health,
    hunger,
    oxygen,
    isDead,
    playerColor,
  });

  useEffect(() => {
    stateRef.current = {
      settings,
      activeHotbarIndex,
      hotbarItems,
      isChatOpen,
      isPaused,
      isCraftingOpen,
      equippedPickaxe,
      remotePlayers,
      health,
      hunger,
      oxygen,
      isDead,
      playerColor,
    };
    if (isCraftingOpen && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [settings, activeHotbarIndex, hotbarItems, isChatOpen, isPaused, isCraftingOpen, equippedPickaxe, remotePlayers, health, hunger, oxygen, isDead, playerColor]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene & Camera setup with extended view distance & realistic linear fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const initialViewDist = settings.renderDistance * 16;
    scene.fog = new THREE.Fog(0x87ceeb, initialViewDist * 0.85, initialViewDist * 1.6);

    const camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1200);

    // Dynamic torch point lights pool for realistic cave illumination
    const torchLights: THREE.PointLight[] = [];
    for (let i = 0; i < 8; i++) {
      const pl = new THREE.PointLight(0xffa733, 2.0, 16, 1.8);
      pl.visible = false;
      scene.add(pl);
      torchLights.push(pl);
    }

    // 3. Voxel World setup
    const atlas = getTextureAtlas();
    const voxelWorld = new VoxelWorld(scene, worldSeed);
    voxelWorld.renderRadius = settings.renderDistance;

    // CRITICAL: Pre-generate initial chunks around spawn FIRST so terrain and heights exist
    const spawnX = 0;
    const spawnZ = 0;
    voxelWorld.updateChunksAround(spawnX, spawnZ, settings.renderDistance, 999);

    // Spawn player accurately standing on top of the surface
    const spawnY = voxelWorld.getSpawnHeight(spawnX, spawnZ) + 0.1;
    const physics = new PlayerPhysics(voxelWorld, spawnX, spawnY, spawnZ);

    camera.position.set(spawnX, spawnY + physics.eyeHeight, spawnZ);

    // Teleportation registration for instant group-up with friends
    onRegisterTeleport?.((tx: number, ty: number, tz: number) => {
      physics.teleport(tx, ty + 0.5, tz);
      camera.position.set(tx, ty + 0.5 + physics.eyeHeight, tz);
    });

    // Fall damage callback
    physics.onFallDamage = (damage) => {
      cameraDamageRoll = (Math.random() > 0.5 ? 1 : -1) * 0.14;
      soundManager.playHurt();
      onTakeDamage(damage, 'fall');
    };

    // 4. Lighting & Celestial Setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.3);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 35;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Sun billboard
    const sunGeom = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3a1, side: THREE.DoubleSide });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);

    // Moon billboard
    const moonGeom = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1, side: THREE.DoubleSide });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    scene.add(moonMesh);

    // Stars particle field
    const starsCount = 600;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // 4b. Procedural 3D Voxel Cloud Layer (altitude 48)
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    });
    for (let cx = -4; cx <= 4; cx++) {
      for (let cz = -4; cz <= 4; cz++) {
        if ((cx + cz) % 2 === 0) {
          const w = 26 + ((Math.abs(cx * 5 + cz * 7)) % 12);
          const l = 24 + ((Math.abs(cz * 9 + cx * 3)) % 10);
          const cMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 3, l), cloudMat);
          cMesh.position.set(cx * 42, 48, cz * 42);
          cloudGroup.add(cMesh);
        }
      }
    }
    scene.add(cloudGroup);

    // 5. Block Selection Highlight Box
    const boxGeom = new THREE.BoxGeometry(1.006, 1.006, 1.006);
    const boxEdges = new THREE.EdgesGeometry(boxGeom);
    const boxLineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const highlightBox = new THREE.LineSegments(boxEdges, boxLineMat);
    highlightBox.visible = false;
    scene.add(highlightBox);

    // 6. First-Person Hand & Held Item Architecture
    const handGroup = new THREE.Group();
    handGroup.position.set(0.36, -0.32, -0.52);
    handGroup.rotation.set(0.2, -0.35, 0.1);
    camera.add(handGroup);
    scene.add(camera);

    // Bare Hand / Arm Group (Visible when holding AIR)
    const bareArmGroup = new THREE.Group();
    handGroup.add(bareArmGroup);

    // Sleeve (Shirt color)
    const sleeveGeom = new THREE.BoxGeometry(0.14, 0.28, 0.14);
    sleeveGeom.translate(0, 0.14, 0);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: playerColor || 0x2563eb });
    const sleeveMesh = new THREE.Mesh(sleeveGeom, sleeveMat);
    sleeveMesh.position.set(0, -0.05, 0);
    bareArmGroup.add(sleeveMesh);

    // Forearm & Hand Skin
    const skinGeom = new THREE.BoxGeometry(0.13, 0.26, 0.13);
    skinGeom.translate(0, 0.13, 0);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 });
    const skinMesh = new THREE.Mesh(skinGeom, skinMat);
    skinMesh.position.set(0, 0.2, 0);
    bareArmGroup.add(skinMesh);

    // Knuckles / Fist
    const fistGeom = new THREE.BoxGeometry(0.135, 0.08, 0.135);
    fistGeom.translate(0, 0.04, 0);
    const fistMesh = new THREE.Mesh(fistGeom, skinMat);
    fistMesh.position.set(0, 0.44, 0);
    bareArmGroup.add(fistMesh);

    // Held Item / Block Group
    const heldGroup = new THREE.Group();
    handGroup.add(heldGroup);
    heldGroup.visible = false;

    // Mini holding arm underneath/behind the held block
    const miniHoldArm = new THREE.Group();
    const miniSleeveMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), sleeveMat);
    miniSleeveMesh.position.set(0.06, -0.16, 0.08);
    miniHoldArm.add(miniSleeveMesh);

    const miniHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.11), skinMat);
    miniHandMesh.position.set(0.04, -0.02, 0.04);
    miniHoldArm.add(miniHandMesh);
    heldGroup.add(miniHoldArm);

    let heldItemObject: THREE.Object3D | null = null;
    let currentHeldType = BlockType.AIR;

    function updateHeldHandBlock(type: BlockType) {
      if (currentHeldType === type) return;
      currentHeldType = type;

      if (heldItemObject) {
        heldGroup.remove(heldItemObject);
        if (heldItemObject instanceof THREE.Mesh) {
          heldItemObject.geometry.dispose();
        }
        heldItemObject = null;
      }

      if (type === BlockType.AIR) {
        bareArmGroup.visible = true;
        heldGroup.visible = false;
      } else {
        bareArmGroup.visible = false;
        heldGroup.visible = true;

        const meta = BLOCK_METAS[type];
        const isTool = meta?.isTool;
        const isArmor = meta?.isArmor;
        const isFood = meta?.isFood;

        if (isTool || isArmor) {
          // 2D Tool item held tilted forward ready to strike (Pickaxe, Sword, etc.)
          const geom = new THREE.PlaneGeometry(0.36, 0.36);
          let mat = atlas.getMaterial(type);
          if (Array.isArray(mat)) mat = mat[0];
          const toolMat = (mat as THREE.Material).clone();
          (toolMat as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
          (toolMat as THREE.MeshBasicMaterial).transparent = true;

          const toolMesh = new THREE.Mesh(geom, toolMat);
          toolMesh.position.set(-0.02, 0.12, 0.02);
          toolMesh.rotation.set(0.35, -0.25, -0.55);
          heldItemObject = toolMesh;
          heldGroup.add(toolMesh);
        } else if (isFood) {
          // Food item (Apple, etc.)
          const geom = new THREE.PlaneGeometry(0.32, 0.32);
          let mat = atlas.getMaterial(type);
          if (Array.isArray(mat)) mat = mat[0];
          const foodMat = (mat as THREE.Material).clone();
          (foodMat as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
          (foodMat as THREE.MeshBasicMaterial).transparent = true;

          const foodMesh = new THREE.Mesh(geom, foodMat);
          foodMesh.position.set(0, 0.1, 0);
          foodMesh.rotation.set(0.3, -0.4, 0);
          heldItemObject = foodMesh;
          heldGroup.add(foodMesh);
        } else {
          // Full 3D Voxel Block (Isometric authentic Minecraft held block)
          // 0.30 scale cube with realistic isometric angles
          const geom = new THREE.BoxGeometry(0.30, 0.30, 0.30);
          const mat = atlas.getMaterial(type);
          const blockMesh = new THREE.Mesh(geom, mat);
          blockMesh.position.set(0.04, 0.14, -0.04);
          // Isometric Minecraft tilt: top face illuminated, front & right faces clearly visible
          blockMesh.rotation.set(0.24, -0.68, 0.14);
          heldItemObject = blockMesh;
          heldGroup.add(blockMesh);
        }
      }
    }

    // Hand swing animation variables
    let handSwingTime = 0;
    let isSwinging = false;
    let cameraDamageRoll = 0;

    function triggerHandSwing() {
      isSwinging = true;
      handSwingTime = 0;
    }

    // 7. Particle System for Block Crumbs / Breaking
    const maxParticles = 120;
    const particleGeom = new THREE.BufferGeometry();
    const pPositions = new Float32Array(maxParticles * 3);
    const pColors = new Float32Array(maxParticles * 3);
    const pVelocities: THREE.Vector3[] = [];
    const pLifetimes = new Float32Array(maxParticles);

    for (let i = 0; i < maxParticles; i++) {
      pLifetimes[i] = -1;
      pVelocities.push(new THREE.Vector3());
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
    });
    const particleSystem = new THREE.Points(particleGeom, pMaterial);
    scene.add(particleSystem);

    function spawnBlockParticles(x: number, y: number, z: number, colorHex: string) {
      const color = new THREE.Color(colorHex);
      let count = 0;
      for (let i = 0; i < maxParticles && count < 18; i++) {
        if (pLifetimes[i] <= 0) {
          pLifetimes[i] = 0.6;
          pPositions[i * 3] = x + 0.5 + (Math.random() - 0.5) * 0.6;
          pPositions[i * 3 + 1] = y + 0.5 + (Math.random() - 0.5) * 0.6;
          pPositions[i * 3 + 2] = z + 0.5 + (Math.random() - 0.5) * 0.6;

          pColors[i * 3] = color.r * (0.8 + Math.random() * 0.4);
          pColors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.4);
          pColors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.4);

          pVelocities[i].set((Math.random() - 0.5) * 4, Math.random() * 4 + 1.5, (Math.random() - 0.5) * 4);
          count++;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;
      particleGeom.attributes.color.needsUpdate = true;
    }

    // 8. Floating 3D Item Drops System
    const floatingDrops: FloatingDrop[] = [];

    function spawnItemDrop(x: number, y: number, z: number, type: BlockType) {
      if (type === BlockType.AIR || type === BlockType.WATER) return;
      const geom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const mat = atlas.getMaterial(type);
      const mesh = new THREE.Mesh(geom, mat);
      const dropPos = new THREE.Vector3(x + 0.5, y + 0.4, z + 0.5);
      mesh.position.copy(dropPos);
      scene.add(mesh);

      floatingDrops.push({
        id: 'drop_' + Math.random().toString(36).substring(2, 8),
        type,
        mesh,
        pos: dropPos,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 3.2, (Math.random() - 0.5) * 1.5),
        spawnTime: performance.now(),
      });
    }

    // 9. Remote Players Map
    const remotePlayerMeshes = new Map<string, PlayerMesh>();

    // 10. Input & Pointer Lock Handling
    let isPointerLocked = false;
    let cameraYaw = 0;
    let cameraPitch = 0;
    const input: PlayerInput = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      crouch: false,
    };

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      isPointerLocked = locked;
      if (!locked && !stateRef.current.isChatOpen && !stateRef.current.isDead) {
        onTogglePause(true);
      }
    };

    const handleCanvasClick = () => {
      if (!isPointerLocked && !stateRef.current.isPaused && !stateRef.current.isChatOpen && !stateRef.current.isCraftingOpen && !stateRef.current.isDead) {
        renderer.domElement.requestPointerLock();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked || stateRef.current.isDead || stateRef.current.isCraftingOpen) return;
      const sens = (stateRef.current.settings.sensitivity / 100) * 0.0022;
      cameraYaw -= e.movementX * sens;
      cameraPitch -= e.movementY * sens;
      cameraPitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, cameraPitch));
    };

    let targetVoxel: { x: number; y: number; z: number; faceNormal: [number, number, number] } | null = null;
    const raycaster = new THREE.Raycaster();
    const rayDir = new THREE.Vector3();

    function updateRaycast() {
      camera.getWorldDirection(rayDir);
      raycaster.set(camera.position, rayDir);

      const maxDistance = 5.2;
      const step = 0.05;
      let hit = false;

      const p = camera.position.clone();
      let lastAirX = Math.floor(p.x);
      let lastAirY = Math.floor(p.y);
      let lastAirZ = Math.floor(p.z);

      for (let dist = 0; dist < maxDistance; dist += step) {
        p.addScaledVector(rayDir, step);
        const bx = Math.floor(p.x);
        const by = Math.floor(p.y);
        const bz = Math.floor(p.z);

        const block = voxelWorld.getBlock(bx, by, bz);
        if (block !== BlockType.AIR && block !== BlockType.WATER) {
          const normalX = lastAirX - bx;
          const normalY = lastAirY - by;
          const normalZ = lastAirZ - bz;

          targetVoxel = {
            x: bx,
            y: by,
            z: bz,
            faceNormal: [normalX, normalY, normalZ],
          };

          highlightBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
          highlightBox.visible = true;
          hit = true;
          break;
        } else {
          lastAirX = bx;
          lastAirY = by;
          lastAirZ = bz;
        }
      }

      if (!hit) {
        targetVoxel = null;
        highlightBox.visible = false;
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!isPointerLocked || stateRef.current.isDead || stateRef.current.isCraftingOpen) return;

      if (e.button === 0) {
        // Left Click: Break block
        triggerHandSwing();
        if (targetVoxel) {
          const { x, y, z } = targetVoxel;
          const brokenType = voxelWorld.getBlock(x, y, z);
          if (brokenType !== BlockType.AIR) {
            voxelWorld.setBlock(x, y, z, BlockType.AIR, true);
            const color = BLOCK_METAS[brokenType]?.color || '#888888';
            spawnBlockParticles(x, y, z, color);
            soundManager.playBreak();

            // Spawn floating pickup item
            spawnItemDrop(x, y, z, brokenType);

            // Chance to drop red apple from oak leaves
            if (brokenType === BlockType.LEAVES && Math.random() < 0.35) {
              spawnItemDrop(x, y, z, BlockType.APPLE);
            }

            onBlockBreak(x, y, z, brokenType);
          }
        }
      } else if (e.button === 2) {
        // Right Click: Place block or Eat Food
        triggerHandSwing();

        const activeSlot = stateRef.current.hotbarItems[stateRef.current.activeHotbarIndex];
        if (!activeSlot || activeSlot.count <= 0) return;
        const heldType: BlockType = activeSlot.type;

        // If held item is food, eat it!
        if (BLOCK_METAS[heldType]?.isFood) {
          soundManager.playEat();
          onEatFood(heldType);
          return;
        }

        if (targetVoxel) {
          const { x, y, z, faceNormal } = targetVoxel;
          const px = x + faceNormal[0];
          const py = y + faceNormal[1];
          const pz = z + faceNormal[2];

          const pBox = new THREE.Box3(
            new THREE.Vector3(physics.position.x - physics.width / 2, physics.position.y, physics.position.z - physics.width / 2),
            new THREE.Vector3(physics.position.x + physics.width / 2, physics.position.y + physics.height, physics.position.z + physics.width / 2)
          );
          const blockBox = new THREE.Box3(new THREE.Vector3(px, py, pz), new THREE.Vector3(px + 1, py + 1, pz + 1));

          if (!pBox.intersectsBox(blockBox)) {
            if ((heldType as unknown) !== BlockType.AIR) {
              voxelWorld.setBlock(px, py, pz, heldType, true);
              soundManager.playPlace();
              onBlockPlace(px, py, pz, heldType);
            }
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.isChatOpen || stateRef.current.isDead) return;

      if (e.code === 'KeyE') {
        e.preventDefault();
        onOpenCrafting();
        return;
      }

      if (stateRef.current.isCraftingOpen) return;

      if (e.code === 'KeyW') input.forward = true;
      if (e.code === 'KeyS') input.backward = true;
      if (e.code === 'KeyA') input.left = true;
      if (e.code === 'KeyD') input.right = true;
      if (e.code === 'Space') {
        input.jump = true;
        if (physics.isOnGround) soundManager.playJump();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        // Only allow sprint if hunger > 6 (3 drumsticks)
        if (stateRef.current.hunger > 6) {
          input.sprint = true;
        }
      }

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slotIdx = parseInt(e.code.replace('Digit', '')) - 1;
        stateRef.current.activeHotbarIndex = slotIdx;
        onSelectSlot(slotIdx);
      }

      if (e.code === 'KeyT' || e.code === 'Enter') {
        e.preventDefault();
        onOpenChat();
      }

      if (e.code === 'Escape') {
        onTogglePause(!stateRef.current.isPaused);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') input.forward = false;
      if (e.code === 'KeyS') input.backward = false;
      if (e.code === 'KeyA') input.left = false;
      if (e.code === 'KeyD') input.right = false;
      if (e.code === 'Space') input.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sprint = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isPointerLocked || stateRef.current.isDead) return;
      const dir = Math.sign(e.deltaY);
      let nextSlot = stateRef.current.activeHotbarIndex + dir;
      if (nextSlot < 0) nextSlot = 8;
      if (nextSlot > 8) nextSlot = 0;
      stateRef.current.activeHotbarIndex = nextSlot;
      onSelectSlot(nextSlot);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    renderer.domElement.addEventListener('click', handleCanvasClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', handleResize);

    if (onRegisterExternalBlockChange) {
      onRegisterExternalBlockChange((x, y, z, type) => {
        voxelWorld.setBlock(x, y, z, type, true);
        if (type === BlockType.AIR) {
          spawnBlockParticles(x, y, z, '#999999');
          soundManager.playBreak();
        } else {
          soundManager.playPlace();
        }
      });
    }

    let timeOfDay = 6000;
    if (onRegisterTimeSync) {
      onRegisterTimeSync((serverTime) => {
        timeOfDay = serverTime;
      });
    }

    let footstepTimer = 0;
    let bobbingTimer = 0;
    let hungerTimer = 0;
    let regenTimer = 0;
    let drownTimer = 0;
    let currentOxygen = 10;
    let chunkUpdateTimer = 0;
    let lastPlayerChunkX = Math.floor(spawnX / 16);
    let lastPlayerChunkZ = Math.floor(spawnZ / 16);

    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let currentFps = 60;
    let animationFrameId = 0;

    // Main Game Loop
    function tick() {
      const delta = Math.min(clock.getDelta(), 0.05);

      // 1. Day/Night Cycle
      if (isSinglePlayer) {
        timeOfDay = (timeOfDay + delta * 20) % 24000;
      }
      const timeAngle = (timeOfDay / 24000) * Math.PI * 2 - Math.PI / 2;

      const sunDist = 160;
      sunMesh.position.set(camera.position.x + Math.cos(timeAngle) * sunDist, camera.position.y + Math.sin(timeAngle) * sunDist, camera.position.z);
      sunMesh.lookAt(camera.position);

      moonMesh.position.set(camera.position.x - Math.cos(timeAngle) * sunDist, camera.position.y - Math.sin(timeAngle) * sunDist, camera.position.z);
      moonMesh.lookAt(camera.position);

      sunLight.position.copy(sunMesh.position);
      sunLight.target.position.copy(camera.position);

      const sunElevation = Math.sin(timeAngle);
      let skyColor = new THREE.Color(0x87ceeb);
      let lightIntensity = 1.2;

      if (sunElevation > 0.1) {
        skyColor = new THREE.Color(0x87ceeb);
        lightIntensity = THREE.MathUtils.lerp(0.8, 1.3, sunElevation);
        starMat.opacity = 0;
      } else if (sunElevation > -0.15) {
        const t = (sunElevation + 0.15) / 0.25;
        skyColor = new THREE.Color(0x1a1a2e).lerp(new THREE.Color(0xf97316), t);
        lightIntensity = THREE.MathUtils.lerp(0.2, 0.8, t);
        starMat.opacity = 1 - t;
      } else {
        skyColor = new THREE.Color(0x050512);
        lightIntensity = 0.22;
        starMat.opacity = 0.85;
      }

      scene.background = skyColor;
      if (scene.fog) {
        scene.fog.color = skyColor;
        if (scene.fog instanceof THREE.Fog) {
          const currentRDist = stateRef.current.settings.renderDistance;
          const targetViewDist = currentRDist * 16;
          scene.fog.near = targetViewDist * 0.85;
          scene.fog.far = targetViewDist * 1.6;
        }
      }
      sunLight.intensity = lightIntensity;
      hemiLight.intensity = Math.max(0.25, lightIntensity * 0.7);

      // Dynamic Torch Point Lights: accurately illuminate nearby surroundings from placed torches
      if (voxelWorld.torches.size > 0) {
        const pPos = physics.position;
        const nearTorches: { x: number; y: number; z: number; distSq: number }[] = [];
        for (const t of voxelWorld.torches.values()) {
          const dx = t.x + 0.5 - pPos.x;
          const dy = t.y + 0.6 - pPos.y;
          const dz = t.z + 0.5 - pPos.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 324) {
            nearTorches.push({ x: t.x + 0.5, y: t.y + 0.6, z: t.z + 0.5, distSq });
          }
        }
        nearTorches.sort((a, b) => a.distSq - b.distSq);
        for (let i = 0; i < torchLights.length; i++) {
          if (i < nearTorches.length) {
            const nt = nearTorches[i];
            torchLights[i].position.set(nt.x, nt.y, nt.z);
            torchLights[i].visible = true;
          } else {
            torchLights[i].visible = false;
          }
        }
      } else {
        for (let i = 0; i < torchLights.length; i++) {
          torchLights[i].visible = false;
        }
      }

      // Cloud drift across sky
      cloudGroup.position.x = (cloudGroup.position.x + delta * 2.2) % 240;

      // 2. Physics & Player Movement
      const isInputActive = !stateRef.current.isChatOpen && !stateRef.current.isCraftingOpen && isPointerLocked && !stateRef.current.isDead;
      const currentInput = isInputActive ? input : { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, crouch: false };

      physics.update(delta, currentInput, cameraYaw);

      // Camera orientation & damage roll
      cameraDamageRoll = THREE.MathUtils.damp(cameraDamageRoll, 0, 7, delta);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = cameraYaw;
      camera.rotation.x = cameraPitch;
      camera.rotation.z = cameraDamageRoll;

      // View bobbing effect
      let bobOffsetY = 0;
      const isMovingHoriz = Math.hypot(physics.velocity.x, physics.velocity.z) > 0.5;
      if (isMovingHoriz && physics.isOnGround && stateRef.current.settings.viewBobbing && !stateRef.current.isDead) {
        const bobSpeed = input.sprint ? 14 : 9;
        bobbingTimer += delta * bobSpeed;
        bobOffsetY = Math.sin(bobbingTimer) * 0.04;

        footstepTimer += delta * bobSpeed;
        if (footstepTimer > Math.PI) {
          footstepTimer = 0;
          soundManager.playStep();
        }
      }

      camera.position.set(physics.position.x, physics.position.y + physics.eyeHeight + bobOffsetY, physics.position.z);

      // 3. Hand item & authentic Minecraft swing arc animation
      const activeSlot = stateRef.current.hotbarItems[stateRef.current.activeHotbarIndex];
      const activeItem = activeSlot ? activeSlot.type : BlockType.AIR;
      updateHeldHandBlock(activeItem);

      if (isSwinging) {
        const pickMultiplier = stateRef.current.equippedPickaxe
          ? (BLOCK_METAS[stateRef.current.equippedPickaxe]?.miningMultiplier || 1.5)
          : 1;
        handSwingTime += delta * 14 * Math.min(2.2, 0.7 + pickMultiplier * 0.35);
        const progress = Math.min(handSwingTime / Math.PI, 1);
        const swingArc = Math.sin(progress * Math.PI);
        handGroup.position.set(
          0.36 - swingArc * 0.14,
          -0.32 - swingArc * 0.10,
          -0.52 - swingArc * 0.16
        );
        handGroup.rotation.set(
          0.2 - swingArc * 0.95,
          -0.35 + swingArc * 0.42,
          0.1 - Math.sin(progress * Math.PI * 2) * 0.22
        );
        if (handSwingTime >= Math.PI) {
          isSwinging = false;
          handGroup.position.set(0.36, -0.32, -0.52);
          handGroup.rotation.set(0.2, -0.35, 0.1);
        }
      } else {
        const bobX = Math.cos(bobbingTimer * 0.5) * 0.015;
        const bobY = Math.sin(bobbingTimer) * 0.02;
        handGroup.position.set(0.36 + bobX, -0.32 + bobY, -0.52);
        handGroup.rotation.set(0.2, -0.35, 0.1);
      }

      // 4. Survival Loops: Drowning, Hunger, Healing, Starvation
      if (!stateRef.current.isDead) {
        // Drowning
        if (physics.isHeadInWater) {
          drownTimer += delta;
          if (drownTimer > 1.2) {
            drownTimer = 0;
            currentOxygen = Math.max(0, currentOxygen - 1);
            onOxygenChange(currentOxygen);
            if (currentOxygen === 0) {
              soundManager.playDrown();
              cameraDamageRoll = (Math.random() > 0.5 ? 1 : -1) * 0.12;
              onTakeDamage(2, 'drown');
            }
          }
        } else {
          if (currentOxygen < 10) {
            currentOxygen = 10;
            onOxygenChange(10);
          }
        }

        // Hunger Burn
        if (isMovingHoriz && physics.isOnGround) {
          const burnRate = input.sprint ? 0.35 : 0.12;
          hungerTimer += delta * burnRate;
          if (hungerTimer > 5.0) {
            hungerTimer = 0;
            onHungerChange(-1);
          }
        }

        // Health Regen (when hunger >= 18)
        if (stateRef.current.hunger >= 18 && stateRef.current.health < 20) {
          regenTimer += delta;
          if (regenTimer > 3.0) {
            regenTimer = 0;
            onHeal(1);
          }
        }

        // Starvation Damage (when hunger == 0)
        if (stateRef.current.hunger === 0) {
          hungerTimer += delta;
          if (hungerTimer > 3.5) {
            hungerTimer = 0;
            cameraDamageRoll = (Math.random() > 0.5 ? 1 : -1) * 0.12;
            soundManager.playHurt();
            onTakeDamage(1, 'starve');
          }
        }
      }

      // 5. Update floating 3D item drops
      const now = performance.now();
      const pCenter = new THREE.Vector3(physics.position.x, physics.position.y + 0.8, physics.position.z);

      for (let i = floatingDrops.length - 1; i >= 0; i--) {
        const drop = floatingDrops[i];

        drop.vel.y -= 15 * delta;
        drop.pos.x += drop.vel.x * delta;
        drop.pos.y += drop.vel.y * delta;
        drop.pos.z += drop.vel.z * delta;

        // Voxel collision check below drop
        const blockBelow = voxelWorld.getBlock(drop.pos.x, drop.pos.y - 0.15, drop.pos.z);
        if (blockBelow !== BlockType.AIR && blockBelow !== BlockType.WATER) {
          drop.pos.y = Math.floor(drop.pos.y - 0.15) + 1.22;
          drop.vel.y = 0;
          drop.vel.x *= 0.85;
          drop.vel.z *= 0.85;
        }

        drop.mesh.rotation.y += delta * 2.5;
        drop.mesh.position.set(
          drop.pos.x,
          drop.pos.y + Math.sin((now - drop.spawnTime) * 0.005) * 0.06,
          drop.pos.z
        );

        // Magnet towards player
        const dist = drop.pos.distanceTo(pCenter);
        if (dist < 2.0 && !stateRef.current.isDead) {
          drop.pos.lerp(pCenter, delta * 8);
          if (dist < 0.7 && now - drop.spawnTime > 300) {
            soundManager.playPop();
            onItemPickup(drop.type);
            scene.remove(drop.mesh);
            drop.mesh.geometry.dispose();
            floatingDrops.splice(i, 1);
          }
        }
      }

      // 6. Update raycast for targeted block
      updateRaycast();

      // 7. Update chunks around player (throttled + 2 chunks per frame budget to ensure 60 FPS)
      const currentRDist = stateRef.current.settings.renderDistance;
      if (voxelWorld.renderRadius !== currentRDist) {
        voxelWorld.renderRadius = currentRDist;
      }

      chunkUpdateTimer += delta;
      const currentChunkX = Math.floor(physics.position.x / 16);
      const currentChunkZ = Math.floor(physics.position.z / 16);
      if (chunkUpdateTimer > 0.12 || currentChunkX !== lastPlayerChunkX || currentChunkZ !== lastPlayerChunkZ) {
        chunkUpdateTimer = 0;
        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkZ = currentChunkZ;
        voxelWorld.updateChunksAround(physics.position.x, physics.position.z, currentRDist, 2);
      }

      // 8. Update particle system
      let activePCount = 0;
      for (let i = 0; i < maxParticles; i++) {
        if (pLifetimes[i] > 0) {
          pLifetimes[i] -= delta;
          pVelocities[i].y -= 9.8 * delta;
          pPositions[i * 3] += pVelocities[i].x * delta;
          pPositions[i * 3 + 1] += pVelocities[i].y * delta;
          pPositions[i * 3 + 2] += pVelocities[i].z * delta;
          activePCount++;
        }
      }
      if (activePCount > 0) {
        particleGeom.attributes.position.needsUpdate = true;
      }

      // 9. Sync Remote Players
      const currentRemoteMap = stateRef.current.remotePlayers;
      for (const [id, rData] of currentRemoteMap) {
        let pMesh = remotePlayerMeshes.get(id);
        if (!pMesh) {
          pMesh = new PlayerMesh(scene, rData);
          remotePlayerMeshes.set(id, pMesh);
        }
        pMesh.updateTarget(rData);
        pMesh.tick(delta);
      }
      for (const [id, pMesh] of remotePlayerMeshes) {
        if (!currentRemoteMap.has(id)) {
          pMesh.dispose(scene);
          remotePlayerMeshes.delete(id);
        }
      }

      // 10. Send position to server
      if (!isSinglePlayer && !stateRef.current.isDead) {
        onPlayerMove(
          physics.position.x,
          physics.position.y,
          physics.position.z,
          cameraYaw,
          cameraPitch,
          isMovingHoriz,
          input.sprint,
          activeItem
        );
      }

      // 11. Render
      renderer.render(scene, camera);

      // 12. Stats
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;

        const currentBlockBelow = voxelWorld.getBlock(physics.position.x, physics.position.y - 0.2, physics.position.z);
        const biome = currentBlockBelow === BlockType.SAND ? 'Desert / Beach' : physics.isInWater ? 'Ocean / River' : 'Plains & Forest';

        onUpdateStats({
          fps: currentFps,
          x: Math.round(physics.position.x * 10) / 10,
          y: Math.round(physics.position.y * 10) / 10,
          z: Math.round(physics.position.z * 10) / 10,
          biome,
          light: Math.round(lightIntensity * 15),
          timeOfDay: Math.round(timeOfDay),
        });
      }

      animationFrameId = requestAnimationFrame(tick);
    }

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);

      for (const pMesh of remotePlayerMeshes.values()) {
        pMesh.dispose(scene);
      }
      for (const drop of floatingDrops) {
        scene.remove(drop.mesh);
        drop.mesh.geometry.dispose();
      }
      voxelWorld.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [worldSeed, isSinglePlayer]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden touch-none"
    />
  );
};

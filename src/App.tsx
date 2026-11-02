import { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas, GameSettings } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { SettingsModal } from './components/SettingsModal';
import { InventoryModal, InventorySlot, EquippedArmor } from './components/InventoryModal';
import { BlockType, BLOCK_METAS } from './game/textures';
import { NetworkManager, ChatMessage } from './game/network';
import { RemotePlayerData } from './game/playerMesh';
import { soundManager } from './game/audio';

const DEFAULT_SETTINGS: GameSettings = {
  fov: 75,
  sensitivity: 65,
  renderDistance: 6,
  volume: 0.5,
  viewBobbing: true,
};

const INITIAL_INVENTORY_SLOTS: (InventorySlot | null)[] = [
  // 0..8: Hotbar
  { type: BlockType.WOOD, count: 32 },
  { type: BlockType.DIRT, count: 64 },
  { type: BlockType.STONE, count: 64 },
  { type: BlockType.COBBLESTONE, count: 32 },
  { type: BlockType.TORCH, count: 16 },
  { type: BlockType.WOODEN_PICKAXE, count: 1 },
  { type: BlockType.APPLE, count: 10 },
  { type: BlockType.IRON_INGOT, count: 8 },
  { type: BlockType.COAL, count: 16 },
  // 9..35: Main Backpack
  { type: BlockType.PLANKS, count: 32 },
  { type: BlockType.STICK, count: 16 },
  { type: BlockType.CRAFTING_TABLE, count: 1 },
  ...Array(24).fill(null),
];

export default function App() {
  // Game State
  const [inGame, setInGame] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [roomId, setRoomId] = useState('public-survival');
  const [worldSeed, setWorldSeed] = useState(12345);

  // Player Profile
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('vc_player_name') || `Steve_${Math.floor(Math.random() * 899 + 100)}`;
  });
  const [playerColor, setPlayerColor] = useState(() => {
    return localStorage.getItem('vc_player_color') || '#2563eb';
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('vc_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // UI Overlays
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);

  // Survival Mechanics State
  const [health, setHealth] = useState(20);
  const [hunger, setHunger] = useState(20);
  const [oxygen, setOxygen] = useState(10);
  const [isDead, setIsDead] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [pickupToast, setPickupToast] = useState('');

  // Inventory & Equipment (0..8 = Hotbar, 9..35 = Main Backpack)
  const [inventorySlots, setInventorySlots] = useState<(InventorySlot | null)[]>(INITIAL_INVENTORY_SLOTS);

  const [equippedArmor, setEquippedArmor] = useState<EquippedArmor>({
    helmet: null,
    chestplate: null,
    leggings: null,
    boots: null,
    offhand: null,
  });

  const [equippedPickaxe, setEquippedPickaxe] = useState<BlockType | null>(BlockType.WOODEN_PICKAXE);

  // Calculate Total Defense Points (0 - 20)
  const defensePoints =
    (equippedArmor.helmet ? BLOCK_METAS[equippedArmor.helmet]?.defensePoints || 0 : 0) +
    (equippedArmor.chestplate ? BLOCK_METAS[equippedArmor.chestplate]?.defensePoints || 0 : 0) +
    (equippedArmor.leggings ? BLOCK_METAS[equippedArmor.leggings]?.defensePoints || 0 : 0) +
    (equippedArmor.boots ? BLOCK_METAS[equippedArmor.boots]?.defensePoints || 0 : 0);

  // Hotbar Selection
  const [activeHotbarIndex, setActiveHotbarIndex] = useState(0);

  // Multiplayer State
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayerData>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ping, setPing] = useState(15);

  // In-Game Live Stats
  const [stats, setStats] = useState({
    fps: 60,
    x: 0,
    y: 20,
    z: 0,
    biome: 'Plains',
    light: 15,
    timeOfDay: 6000,
  });

  // Network ref and external block change bridge
  const networkRef = useRef<NetworkManager | null>(null);
  const externalBlockChangeFnRef = useRef<((x: number, y: number, z: number, type: BlockType) => void) | null>(null);
  const timeSyncFnRef = useRef<((time: number) => void) | null>(null);
  const teleportFnRef = useRef<((x: number, y: number, z: number) => void) | null>(null);

  // Save profile and settings
  useEffect(() => {
    localStorage.setItem('vc_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('vc_player_color', playerColor);
  }, [playerColor]);

  useEffect(() => {
    localStorage.setItem('vc_settings', JSON.stringify(settings));
    soundManager.setVolume(settings.volume);
  }, [settings]);

  // Connect or disconnect networking when inGame or roomId changes
  useEffect(() => {
    if (inGame && !isSinglePlayer) {
      const network = new NetworkManager({
        onInit: (data) => {
          setWorldSeed(data.seed);
          const pMap = new Map<string, RemotePlayerData>();
          for (const p of data.players) {
            if (p.id !== data.playerId) {
              pMap.set(p.id, p);
            }
          }
          setRemotePlayers(pMap);

          for (const change of data.blockChanges) {
            externalBlockChangeFnRef.current?.(change.x, change.y, change.z, change.type);
          }

          if (data.timeOfDay !== undefined) {
            timeSyncFnRef.current?.(data.timeOfDay);
          }
        },
        onPlayerJoined: (player) => {
          setRemotePlayers((prev) => {
            const next = new Map(prev);
            next.set(player.id, player);
            return next;
          });
        },
        onPlayerMoved: (pData) => {
          setRemotePlayers((prev) => {
            const next = new Map(prev);
            const existing = next.get(pData.id);
            if (existing) {
              next.set(pData.id, { ...existing, ...pData });
            } else {
              next.set(pData.id, {
                name: 'Player',
                color: '#3b82f6',
                ...pData,
              });
            }
            return next;
          });
        },
        onPlayerLeft: (id) => {
          setRemotePlayers((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        },
        onPlayersSync: (players) => {
          setRemotePlayers((prev) => {
            const next = new Map<string, RemotePlayerData>();
            for (const p of players) {
              if (p.id === network.myPlayerId) continue;
              const existing = prev.get(p.id);
              next.set(p.id, existing ? { ...existing, ...p } : p);
            }
            return next;
          });
        },
        onBlockChanged: (change) => {
          externalBlockChangeFnRef.current?.(change.x, change.y, change.z, change.type);
        },
        onChat: (msg) => {
          setChatMessages((prev) => [...prev, msg]);
          soundManager.playChat();
        },
        onTimeSync: (t) => {
          timeSyncFnRef.current?.(t);
        },
        onPingUpdate: (p) => {
          setPing(p);
        },
        onError: (err) => {
          console.warn('Network message:', err);
        },
      });

      network.connect(roomId, playerName, playerColor, stats.x, stats.y, stats.z);
      networkRef.current = network;

      return () => {
        network.disconnect();
        networkRef.current = null;
      };
    } else {
      setRemotePlayers(new Map());
    }
  }, [inGame, isSinglePlayer, roomId]);

  const handleItemPickup = useCallback((type: BlockType) => {
    const meta = BLOCK_METAS[type];
    const name = meta ? meta.nameTr : 'Eşya';
    setPickupToast(`+1 ${name}`);
    setTimeout(() => setPickupToast(''), 1800);

    setInventorySlots((prev) => {
      const next = [...prev];
      let placed = false;
      // 1. Try to merge into existing stacks (< 64)
      for (let i = 0; i < next.length; i++) {
        const slot = next[i];
        if (slot && slot.type === type && slot.count < 64) {
          next[i] = { type: slot.type, count: slot.count + 1 };
          placed = true;
          break;
        }
      }
      // 2. Put into first empty slot in hotbar (0..8) then backpack (9..35)
      if (!placed) {
        for (let i = 0; i < next.length; i++) {
          if (!next[i]) {
            next[i] = { type, count: 1 };
            placed = true;
            break;
          }
        }
      }
      return next;
    });
  }, []);

  // Handlers for local block changes
  const handleBlockBreak = useCallback((x: number, y: number, z: number, brokenType: BlockType) => {
    if (!isSinglePlayer && networkRef.current) {
      networkRef.current.sendBlockChange(x, y, z, BlockType.AIR);
    }
    if (brokenType !== BlockType.AIR && brokenType !== BlockType.WATER) {
      handleItemPickup(brokenType);
    }
  }, [isSinglePlayer, handleItemPickup]);

  const handleBlockPlace = useCallback((x: number, y: number, z: number, type: BlockType) => {
    if (!isSinglePlayer && networkRef.current) {
      networkRef.current.sendBlockChange(x, y, z, type);
    }
    // Decrement 1 from active hotbar slot
    setInventorySlots((prev) => {
      const next = [...prev];
      const cur = next[activeHotbarIndex];
      if (cur) {
        if (cur.count > 1) {
          next[activeHotbarIndex] = { type: cur.type, count: cur.count - 1 };
        } else {
          next[activeHotbarIndex] = null;
        }
      }
      return next;
    });
  }, [isSinglePlayer, activeHotbarIndex]);

  const handlePlayerMove = useCallback(
    (
      x: number,
      y: number,
      z: number,
      yaw: number,
      pitch: number,
      isMoving: boolean,
      isSprinting: boolean,
      heldItem: number
    ) => {
      if (!isSinglePlayer && networkRef.current) {
        networkRef.current.sendMove(x, y, z, yaw, pitch, isMoving, isSprinting, heldItem);
      }
    },
    [isSinglePlayer]
  );

  const handleSendChat = useCallback(
    (text: string) => {
      if (!isSinglePlayer && networkRef.current) {
        networkRef.current.sendChat(text);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'chat_' + Math.random().toString(36).substring(2, 8),
            sender: playerName,
            color: playerColor,
            text,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [isSinglePlayer, playerName, playerColor]
  );

  // Survival Handlers with Armor Defense Reduction
  const handleTakeDamage = useCallback((amount: number) => {
    const effectiveDefense = defensePoints;
    const reducedAmount = effectiveDefense > 0
      ? Math.max(1, Math.round(amount * (1 - (effectiveDefense * 0.035))))
      : amount;

    setHealth((prev) => {
      const next = Math.max(0, prev - reducedAmount);
      if (next === 0) {
        setIsDead(true);
        soundManager.playHurt();
      }
      return next;
    });
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 250);
  }, [defensePoints]);

  const handleHeal = useCallback((amount: number) => {
    setHealth((prev) => Math.min(20, prev + amount));
    setHunger((prev) => Math.max(0, prev - 1));
  }, []);

  const handleEatFood = useCallback((foodType: BlockType) => {
    const points = BLOCK_METAS[foodType]?.foodPoints || 4;
    setHunger((prev) => Math.min(20, prev + points));
    setHealth((prev) => Math.min(20, prev + 2));
    setPickupToast(`+${points} Açlık Dolduruldu`);
    setTimeout(() => setPickupToast(''), 1800);

    // Decrement from active slot
    setInventorySlots((prev) => {
      const next = [...prev];
      const cur = next[activeHotbarIndex];
      if (cur) {
        if (cur.count > 1) {
          next[activeHotbarIndex] = { type: cur.type, count: cur.count - 1 };
        } else {
          next[activeHotbarIndex] = null;
        }
      }
      return next;
    });
  }, [activeHotbarIndex]);

  const handleEquipArmor = useCallback((type: BlockType) => {
    const meta = BLOCK_METAS[type];
    if (!meta?.isArmor) return;

    setEquippedArmor((prev) => {
      if (type === BlockType.IRON_HELMET || type === BlockType.DIAMOND_HELMET) {
        return { ...prev, helmet: type };
      }
      if (type === BlockType.IRON_CHESTPLATE || type === BlockType.DIAMOND_CHESTPLATE) {
        return { ...prev, chestplate: type };
      }
      if (type === BlockType.IRON_LEGGINGS || type === BlockType.DIAMOND_LEGGINGS) {
        return { ...prev, leggings: type };
      }
      if (type === BlockType.IRON_BOOTS || type === BlockType.DIAMOND_BOOTS) {
        return { ...prev, boots: type };
      }
      return prev;
    });
    soundManager.playPlace();
    setPickupToast(`Kuşanıldı: ${meta.nameTr}`);
    setTimeout(() => setPickupToast(''), 1800);
  }, []);

  const handleEquipPickaxe = useCallback((type: BlockType) => {
    const meta = BLOCK_METAS[type];
    if (!meta?.isTool) return;
    setEquippedPickaxe(type);
    soundManager.playPlace();
    setPickupToast(`Kuşanıldı: ${meta.nameTr}`);
    setTimeout(() => setPickupToast(''), 1800);
  }, []);

  const handleRespawn = useCallback(() => {
    setHealth(20);
    setHunger(20);
    setOxygen(10);
    setIsDead(false);
  }, []);

  const handleTeleportToPlayer = useCallback((targetId: string) => {
    const p = remotePlayers.get(targetId);
    if (p && teleportFnRef.current) {
      teleportFnRef.current(p.x, p.y + 0.6, p.z);
      setPickupToast(`${p.name} adlı oyuncunun yanına ışınlandın!`);
      soundManager.playPop();
      setTimeout(() => setPickupToast(''), 2500);
    }
  }, [remotePlayers]);

  const startSinglePlayer = (seed = 12345) => {
    setIsSinglePlayer(true);
    setWorldSeed(seed);
    setHealth(20);
    setHunger(20);
    setOxygen(10);
    setIsDead(false);
    setInGame(true);
    setIsPaused(false);
  };

  const joinServer = (targetRoomId: string, seed?: number) => {
    setIsSinglePlayer(false);
    setRoomId(targetRoomId);
    if (seed !== undefined) setWorldSeed(seed);
    setHealth(20);
    setHunger(20);
    setOxygen(10);
    setIsDead(false);
    setInGame(true);
    setIsPaused(false);
  };

  const handleLeaveGame = () => {
    networkRef.current?.disconnect();
    setInGame(false);
    setIsPaused(false);
    setIsChatOpen(false);
    setIsCraftingOpen(false);
    setIsDead(false);
    setChatMessages([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {!inGame ? (
        <MainMenu
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          onStartSinglePlayer={startSinglePlayer}
          onJoinServer={joinServer}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <>
          <GameCanvas
            key={roomId}
            isSinglePlayer={isSinglePlayer}
            playerName={playerName}
            playerColor={playerColor}
            roomId={roomId}
            worldSeed={worldSeed}
            settings={settings}
            activeHotbarIndex={activeHotbarIndex}
            hotbarItems={inventorySlots.slice(0, 9)}
            onSelectSlot={setActiveHotbarIndex}
            remotePlayers={remotePlayers}
            isChatOpen={isChatOpen}
            isPaused={isPaused}
            health={health}
            hunger={hunger}
            oxygen={oxygen}
            isDead={isDead}
            onBlockBreak={handleBlockBreak}
            onBlockPlace={handleBlockPlace}
            onPlayerMove={handlePlayerMove}
            onTogglePause={(p) => setIsPaused(p)}
            onOpenChat={() => setIsChatOpen(true)}
            onUpdateStats={setStats}
            onTakeDamage={handleTakeDamage}
            onHeal={handleHeal}
            onEatFood={handleEatFood}
            onItemPickup={handleItemPickup}
            onOxygenChange={setOxygen}
            isCraftingOpen={isCraftingOpen}
            equippedPickaxe={equippedPickaxe}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            onHungerChange={(dH) => setHunger((prev) => Math.max(0, Math.min(20, prev + dH)))}
            onRegisterTeleport={(fn) => {
              teleportFnRef.current = fn;
            }}
            onRegisterExternalBlockChange={(fn) => {
              externalBlockChangeFnRef.current = fn;
            }}
            onRegisterTimeSync={(fn) => {
              timeSyncFnRef.current = fn;
            }}
          />

          <HUD
            activeHotbarIndex={activeHotbarIndex}
            hotbarItems={inventorySlots.slice(0, 9)}
            onSelectSlot={setActiveHotbarIndex}
            stats={stats}
            ping={ping}
            roomId={roomId}
            isSinglePlayer={isSinglePlayer}
            playerName={playerName}
            remotePlayers={remotePlayers}
            chatMessages={chatMessages}
            isChatOpen={isChatOpen}
            health={health}
            hunger={hunger}
            oxygen={oxygen}
            isDead={isDead}
            damageFlash={damageFlash}
            pickupToast={pickupToast}
            defensePoints={defensePoints}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            onSendChat={handleSendChat}
            onCloseChat={() => setIsChatOpen(false)}
            onRespawn={handleRespawn}
            onTeleportToPlayer={handleTeleportToPlayer}
            onLeaveGame={handleLeaveGame}
          />

          {isCraftingOpen && (
            <InventoryModal
              slots={inventorySlots}
              equippedArmor={equippedArmor}
              activeHotbarIndex={activeHotbarIndex}
              onUpdateSlots={setInventorySlots}
              onUpdateArmor={setEquippedArmor}
              onSelectHotbarIndex={setActiveHotbarIndex}
              onClose={() => setIsCraftingOpen(false)}
            />
          )}

          {isPaused && (
            <PauseMenu
              roomId={roomId}
              isSinglePlayer={isSinglePlayer}
              playerCount={remotePlayers.size + 1}
              onResume={() => setIsPaused(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLeaveGame={handleLeaveGame}
            />
          )}
        </>
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

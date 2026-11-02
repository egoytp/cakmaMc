import React, { useState, useEffect, useRef } from 'react';
import { BlockType, BLOCK_METAS, getTextureAtlas } from '../game/textures';
import { ChatMessage } from '../game/network';
import { RemotePlayerData } from '../game/playerMesh';
import { Users, Wifi, Sun, Moon, Compass, MessageSquare, Send, RotateCcw, LogOut, Hammer, Shield } from 'lucide-react';

import { InventorySlot } from './InventoryModal';

interface HUDProps {
  activeHotbarIndex: number;
  hotbarItems: (InventorySlot | null)[];
  onSelectSlot: (idx: number) => void;
  stats: {
    fps: number;
    x: number;
    y: number;
    z: number;
    biome: string;
    light: number;
    timeOfDay: number;
  };
  ping: number;
  roomId: string;
  isSinglePlayer: boolean;
  playerName: string;
  remotePlayers: Map<string, RemotePlayerData>;
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  health: number;
  hunger: number;
  oxygen: number;
  isDead: boolean;
  damageFlash: boolean;
  pickupToast: string;
  defensePoints: number;
  onOpenCrafting: () => void;
  onSendChat: (text: string) => void;
  onCloseChat: () => void;
  onRespawn: () => void;
  onTeleportToPlayer?: (playerId: string) => void;
  onLeaveGame: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  activeHotbarIndex,
  hotbarItems,
  onSelectSlot,
  stats,
  ping,
  roomId,
  isSinglePlayer,
  playerName,
  remotePlayers,
  chatMessages,
  isChatOpen,
  health,
  hunger,
  oxygen,
  isDead,
  damageFlash,
  pickupToast,
  defensePoints,
  onOpenCrafting,
  onSendChat,
  onCloseChat,
  onRespawn,
  onTeleportToPlayer,
  onLeaveGame,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [itemNameToast, setItemNameToast] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const atlas = getTextureAtlas();

  // Show block name briefly when slot changes
  useEffect(() => {
    const slot = hotbarItems[activeHotbarIndex];
    if (slot && BLOCK_METAS[slot.type]) {
      const meta = BLOCK_METAS[slot.type];
      const isFood = meta.isFood;
      setItemNameToast(
        `${meta.nameTr}${isFood ? ' (Sağ Tık: Ye)' : ''}`
      );
      const timer = setTimeout(() => {
        setItemNameToast('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeHotbarIndex, hotbarItems]);

  // Focus chat input when opened
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => chatInputRef.current?.focus(), 50);
    } else {
      setChatInput('');
    }
  }, [isChatOpen]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  // Tab key to show player list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowPlayerList(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowPlayerList(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChat(chatInput.trim());
      setChatInput('');
    }
    onCloseChat();
  };

  const isDay = stats.timeOfDay > 1000 && stats.timeOfDay < 13000;

  // Render 10 Armor Shields (20 Armor Defense Points)
  const renderArmor = () => {
    const shields = [];
    for (let i = 0; i < 10; i++) {
      const val = defensePoints - i * 2;
      const isFull = val >= 2;
      const isHalf = val === 1;

      shields.push(
        <div key={i} className="relative w-4 h-4">
          {/* Black shield container outline */}
          <svg viewBox="0 0 16 16" className="w-full h-full fill-stone-900 drop-shadow">
            <path d="M3 1h10v2H3z M2 3h12v4H2z M3 7h10v3H3z M4 10h8v2H4z M5 12h6v2H5z M7 14h2v1H7z" />
          </svg>
          {isFull ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-slate-300">
              <path d="M4 2h8v2H4z M3 4h10v3H3z M4 7h8v3H4z M5 10h6v2H5z M6 12h4v1H6z M7 13h2v1H7z" />
              <rect x="5" y="3" width="2" height="4" fill="#ffffff" />
            </svg>
          ) : isHalf ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-slate-300">
              <path d="M4 2h4v2H4z M3 4h5v3H3z M4 7h4v3H4z M5 10h3v2H5z M6 12h2v1H6z M7 13h1v1H7z" />
              <rect x="5" y="3" width="1" height="4" fill="#ffffff" />
            </svg>
          ) : null}
        </div>
      );
    }
    return shields;
  };

  // Render 10 Hearts (20 HP)
  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 10; i++) {
      const val = health - i * 2;
      const isFull = val >= 2;
      const isHalf = val === 1;

      hearts.push(
        <div key={i} className={`relative w-4 h-4 ${damageFlash ? 'animate-bounce' : ''}`}>
          {/* Black heart container outline */}
          <svg viewBox="0 0 16 16" className="w-full h-full fill-stone-900 drop-shadow">
            <path d="M2 3h3v2H2z M7 3h2v2H7z M11 3h3v2h-3z M1 5h14v4H1z M2 9h12v2H2z M3 11h10v2H3z M5 13h6v2H5z M7 15h2v1H7z" />
          </svg>
          {/* Inner heart fill */}
          {isFull ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-red-600">
              <path d="M2 4h3v2H2z M7 4h2v2H7z M11 4h3v2h-3z M2 6h12v3H2z M3 9h10v2H3z M4 11h8v2H4z M6 13h4v1H6z M7 14h2v1H7z" />
              <rect x="3" y="4" width="1" height="1" fill="#fca5a5" />
              <rect x="4" y="5" width="1" height="1" fill="#fca5a5" />
            </svg>
          ) : isHalf ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-red-600">
              <path d="M2 4h3v2H2z M7 4h1v2H7z M2 6h6v3H2z M3 9h5v2H3z M4 11h4v2H4z M6 13h2v1H6z M7 14h1v1H7z" />
              <rect x="3" y="4" width="1" height="1" fill="#fca5a5" />
            </svg>
          ) : null}
        </div>
      );
    }
    return hearts;
  };

  // Render 10 Drumsticks (20 Hunger)
  const renderHunger = () => {
    const drumsticks = [];
    for (let i = 9; i >= 0; i--) {
      const val = hunger - i * 2;
      const isFull = val >= 2;
      const isHalf = val === 1;

      drumsticks.push(
        <div key={i} className={`relative w-4 h-4 ${hunger <= 6 ? 'animate-pulse' : ''}`}>
          {/* Background outline */}
          <svg viewBox="0 0 16 16" className="w-full h-full fill-stone-900 drop-shadow">
            <path d="M6 2h6v2H6z M5 4h8v3H5z M4 7h10v3H4z M5 10h7v2H5z M3 11h3v4H3z M1 13h3v2H1z" />
          </svg>
          {/* Meat fill */}
          {isFull ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-amber-700">
              <path d="M7 3h4v2H7z M6 5h6v2H6z M5 7h8v2H5z M6 9h6v2H6z" />
              <path d="M4 11h2v3H4z M2 13h2v1H2z" fill="#f5f5f5" />
              <rect x="8" y="4" width="2" height="1" fill="#b45309" />
            </svg>
          ) : isHalf ? (
            <svg viewBox="0 0 16 16" className="absolute inset-0 w-full h-full fill-amber-700">
              <path d="M8 3h3v2H8z M8 5h4v2H8z M8 7h4v2H8z" />
              <path d="M4 11h2v3H4z M2 13h2v1H2z" fill="#f5f5f5" />
            </svg>
          ) : null}
        </div>
      );
    }
    return drumsticks;
  };

  // Render 10 Oxygen bubbles
  const renderOxygen = () => {
    const bubbles = [];
    for (let i = 0; i < 10; i++) {
      const active = i < oxygen;
      bubbles.push(
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border border-sky-300 transition-all ${
            active ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-transparent border-sky-800/40 opacity-30'
          }`}
        />
      );
    }
    return bubbles;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 overflow-hidden">
      {/* Red Hurt Damage Screen Flash */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 bg-red-600/35 transition-opacity duration-300 ${
          damageFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 1. Top Bar: Debug Stats & Server Info */}
      <div className="flex justify-between items-start">
        {/* Left Stats Cluster */}
        <div className="bg-black/60 backdrop-blur-none border border-stone-800 rounded px-3 py-2 text-xs font-mono text-stone-300 space-y-1">
          <div className="flex items-center space-x-3 text-stone-100 font-semibold">
            <span className="text-emerald-400 font-bold">{stats.fps} FPS</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              XYZ: {stats.x} / {stats.y} / {stats.z}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-stone-400">
            <span>Biyom: <span className="text-stone-200">{stats.biome}</span></span>
            <span>·</span>
            <span className="flex items-center gap-1">
              {isDay ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-300" />}
              {isDay ? 'Gündüz' : 'Gece'}
            </span>
          </div>
        </div>

        {/* Right Server / Room Info */}
        <div className="bg-black/60 backdrop-blur-none border border-stone-800 rounded px-3 py-2 text-xs font-mono text-right space-y-1">
          <div className="flex items-center justify-end space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-200">
              {isSinglePlayer ? 'Tek Oyunculu (Çevrimdışı)' : `Sunucu: ${roomId}`}
            </span>
          </div>
          {!isSinglePlayer && (
            <div className="flex items-center justify-end space-x-3 text-stone-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                {remotePlayers.size + 1} Oyuncu
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-400" />
                {ping} ms
              </span>
            </div>
          )}

          {/* Friend Radar / Distance Locator */}
          {remotePlayers.size > 0 && (
            <div className="mt-1 pt-1 border-t border-stone-800 flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 text-[11px] text-sky-400 font-bold">
                <Compass className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>Arkadaş Konumu:</span>
              </div>
              {Array.from(remotePlayers.values()).map((p) => {
                const dx = Math.round(p.x - stats.x);
                const dz = Math.round(p.z - stats.z);
                const dist = Math.round(Math.hypot(dx, dz));
                return (
                  <div key={p.id} className="text-[10px] bg-sky-950/90 px-2 py-1 rounded border border-sky-500/50 text-stone-200 flex items-center gap-2 shadow-md">
                    <span style={{ color: p.color || '#38bdf8' }} className="font-bold">{p.name}</span>
                    <span className="text-emerald-400 font-semibold">{dist}m</span>
                    <span className="text-stone-400 text-[9px]">({Math.round(p.x)}, {Math.round(p.y)}, {Math.round(p.z)})</span>
                    {onTeleportToPlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTeleportToPlayer(p.id);
                        }}
                        className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-[9px] uppercase tracking-wide transition-colors cursor-pointer shadow pointer-events-auto"
                        title={`${p.name} yanına ışınlan`}
                      >
                        Işınlan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Dead-Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute w-4 h-0.5 bg-white/80 mix-blend-difference" />
          <div className="absolute h-4 w-0.5 bg-white/80 mix-blend-difference" />
        </div>
      </div>

      {/* 3. In-Game Chat Box (Bottom-Left) */}
      <div className="w-96 max-w-full flex flex-col justify-end space-y-2 mb-20">
        <div
          className={`space-y-1 overflow-y-auto max-h-48 p-2 rounded transition-opacity ${
            isChatOpen ? 'bg-black/75 pointer-events-auto' : 'bg-transparent'
          }`}
        >
          {chatMessages.slice(-12).map((msg) => (
            <div key={msg.id} className="text-xs font-mono text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <span className="font-bold" style={{ color: msg.color || '#38bdf8' }}>
                [{msg.sender}]:
              </span>{' '}
              <span>{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {isChatOpen && (
          <form
            onSubmit={handleChatSubmit}
            className="flex items-center gap-2 bg-black/80 border border-stone-700 rounded p-1.5 pointer-events-auto"
          >
            <MessageSquare className="w-4 h-4 text-stone-400 ml-1" />
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Mesajınızı yazın (Enter)..."
              maxLength={120}
              className="flex-1 bg-transparent text-xs text-white placeholder-stone-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* 4. Bottom Center: Survival Vitals (Hearts + Hunger + Oxygen) and Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        {/* Item Pickup Toast Notification */}
        {pickupToast && (
          <div className="mb-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono px-3 py-1 rounded shadow-lg animate-bounce">
            {pickupToast}
          </div>
        )}

        {/* Selected Item Name Toast */}
        {itemNameToast && !pickupToast && (
          <div className="mb-2 bg-black/80 text-yellow-300 text-xs font-mono px-3 py-1 rounded border border-stone-700 shadow-md">
            {itemNameToast}
          </div>
        )}

        {/* Oxygen Bubbles (shown when underwater) */}
        {oxygen < 10 && (
          <div className="w-[390px] flex justify-end gap-1.5 mb-1 pr-1">
            {renderOxygen()}
          </div>
        )}

        {/* Armor Defense Bar (Left) above Health Hearts if defense > 0 */}
        {defensePoints > 0 && (
          <div className="w-[390px] flex justify-start items-center mb-1 px-1">
            <div className="flex gap-1 items-center">
              {renderArmor()}
            </div>
            <span className="ml-2 text-[10px] font-mono text-slate-300 font-bold">
              {defensePoints} DEF
            </span>
          </div>
        )}

        {/* Health Hearts (Left) & Hunger Drumsticks (Right) Strip */}
        <div className="w-[390px] flex justify-between items-center mb-1.5 px-1">
          {/* Hearts (10 Hearts = 20 HP) */}
          <div className="flex gap-1 items-center">
            {renderHearts()}
          </div>

          {/* Hunger (10 Drumsticks = 20 Food) */}
          <div className="flex gap-1 items-center">
            {renderHunger()}
          </div>
        </div>

        {/* 9 Slots Minecraft Hotbar Container + Crafting Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-stone-900/90 border-2 border-stone-600 p-1 rounded-sm gap-1 shadow-2xl backdrop-blur-none">
            {hotbarItems.map((slot, idx) => {
              const isSelected = activeHotbarIndex === idx;
              const iconUrl = slot ? atlas.getIcon(slot.type) : null;

              return (
                <button
                  key={idx}
                  onClick={() => onSelectSlot(idx)}
                  className={`relative w-11 h-11 flex items-center justify-center rounded-sm transition-all ${
                    isSelected
                      ? 'border-2 border-white bg-white/20 scale-105 z-10 shadow-lg'
                      : 'border border-stone-700 bg-stone-800/80 hover:bg-stone-700/80'
                  }`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-stone-400 font-bold">
                    {idx + 1}
                  </span>

                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={slot ? BLOCK_METAS[slot.type]?.name : ''}
                      className="w-7 h-7 object-contain [image-rendering:pixelated]"
                    />
                  ) : slot ? (
                    <div
                      className="w-6 h-6 rounded-sm border border-black/30"
                      style={{ backgroundColor: BLOCK_METAS[slot.type]?.color || '#888' }}
                    />
                  ) : null}

                  {slot && slot.count > 1 && (
                    <span
                      className="absolute bottom-0 right-1 text-xs font-mono font-bold text-white select-none pointer-events-none"
                      style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                    >
                      {slot.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Crafting / Inventory Button (E) */}
          <button
            type="button"
            onClick={onOpenCrafting}
            className="w-11 h-11 flex flex-col items-center justify-center rounded-sm border-2 border-amber-600/80 bg-amber-950/80 hover:bg-amber-900 text-amber-300 transition-all shadow-xl active:scale-95"
            title="Üretim Masası & Envanter (E)"
          >
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="text-[8px] font-mono font-bold mt-0.5 tracking-tight">E:ÜRET</span>
          </button>
        </div>

        {/* Controls quick hint bar */}
        <div className="mt-2 text-[10px] text-stone-400 font-mono tracking-wider">
          WASD Yürü · Space Zıpla · Sol Tık Kır · Sağ Tık Koy/Ye · E Üretim · T Sohbet · Tab Oyuncular · Esc Menü
        </div>
      </div>

      {/* 5. Online Player List Overlay (Tab Menu) */}
      {showPlayerList && !isSinglePlayer && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/85 border border-stone-700 rounded-lg p-4 w-80 shadow-2xl z-30 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
            <h3 className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              Aktif Oyuncular ({remotePlayers.size + 1})
            </h3>
            <span className="text-[10px] font-mono text-stone-400">Oda: {roomId}</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-mono bg-stone-800/60 p-2 rounded border border-blue-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-white font-semibold">{playerName} (Sen)</span>
              </div>
              <span className="text-emerald-400 text-[10px]">{ping}ms</span>
            </div>

            {Array.from(remotePlayers.values()).map((p) => {
              const dx = Math.round(p.x - stats.x);
              const dz = Math.round(p.z - stats.z);
              const dist = Math.round(Math.hypot(dx, dz));
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs font-mono bg-stone-900/80 p-2 rounded border border-stone-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color || '#38bdf8' }}
                    />
                    <div>
                      <div className="text-stone-200 font-semibold">{p.name}</div>
                      <div className="text-[10px] text-stone-400">
                        {dist}m uzakta · ({Math.round(p.x)}, {Math.round(p.y)}, {Math.round(p.z)})
                      </div>
                    </div>
                  </div>
                  {onTeleportToPlayer && (
                    <button
                      onClick={() => onTeleportToPlayer(p.id)}
                      className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-[10px] transition-colors cursor-pointer shadow"
                    >
                      Işınlan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Survival Death / Respawn Screen */}
      {isDead && (
        <div className="fixed inset-0 z-50 bg-red-950/85 backdrop-blur-none flex flex-col items-center justify-center p-4 pointer-events-auto">
          <div className="text-center max-w-md w-full bg-black/80 border-2 border-red-700/60 rounded-2xl p-8 shadow-2xl space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-red-500 font-['Press_Start_2P'] uppercase drop-shadow-[0_4px_12px_rgba(239,68,68,0.8)]">
                ÖLDÜN!
              </h1>
              <p className="text-stone-300 font-mono text-xs mt-3">
                Canın tükendi. Eşyaların dünyaya dağıldı!
              </p>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-400 space-y-1">
              <div>Konum: <span className="text-stone-200">X: {stats.x} Y: {stats.y} Z: {stats.z}</span></div>
              <div>Biyom: <span className="text-stone-200">{stats.biome}</span></div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onRespawn}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-mono rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeniden Doğ (Respawn)</span>
              </button>

              <button
                type="button"
                onClick={onLeaveGame}
                className="w-full py-2.5 bg-stone-850 hover:bg-stone-750 text-stone-300 font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-stone-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ana Menüye Dön</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

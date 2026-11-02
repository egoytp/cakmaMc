import React, { useState, useEffect } from 'react';
import { Play, Globe, Plus, Key, Settings as SettingsIcon, Users, RefreshCw, Sparkles, Copy, Check, X } from 'lucide-react';

export interface RoomInfo {
  id: string;
  name: string;
  seed: number;
  playerCount: number;
  maxPlayers: number;
  isPrivate?: boolean;
}

interface MainMenuProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  onStartSinglePlayer: (seed: number) => void;
  onJoinServer: (roomId: string, seed?: number) => void;
  onOpenSettings: () => void;
}

const COLOR_PRESETS = [
  { name: 'Steve Mavi', hex: '#2563eb' },
  { name: 'Alex Yeşil', hex: '#16a34a' },
  { name: 'Zümrüt Yeşili', hex: '#059669' },
  { name: 'Kızıl Kırmızı', hex: '#dc2626' },
  { name: 'Güneş Sarısı', hex: '#ca8a04' },
  { name: 'Mor Ametist', hex: '#9333ea' },
  { name: 'Elmas Camgöbeği', hex: '#0891b2' },
  { name: 'Lav Turuncu', hex: '#ea580c' },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  setPlayerName,
  playerColor,
  setPlayerColor,
  onStartSinglePlayer,
  onJoinServer,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'multiplayer' | 'create_room' | 'direct_connect'>('home');
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('Benim Dünyam');
  const [newRoomSeed, setNewRoomSeed] = useState(String(Math.floor(Math.random() * 89999 + 10000)));
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(10);
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInviteGuide, setShowInviteGuide] = useState(false);

  // Check URL query parameters for room code invite (e.g. ?room=ROOM-1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomCodeInput(roomFromUrl);
      setActiveTab('direct_connect');
    }
  }, []);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch {
      // Fallback default rooms
      setRooms([
        { id: 'public-survival', name: 'Earth Alpha [Survival]', seed: 12345, playerCount: 1, maxPlayers: 16 },
        { id: 'public-creative', name: 'Sky Highlands [Creative]', seed: 88888, playerCount: 0, maxPlayers: 16 },
        { id: 'public-desert', name: 'Dune Oasis [Multiplayer]', seed: 45678, playerCount: 0, maxPlayers: 16 },
      ]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'multiplayer') {
      fetchRooms();
    }
  }, [activeTab]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          seed: Number(newRoomSeed) || 42424,
          maxPlayers: newRoomMaxPlayers,
          isPrivate: newRoomPrivate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onJoinServer(data.id, data.seed);
      } else {
        // Fallback local room creation
        const fallbackId = 'ROOM-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        onJoinServer(fallbackId, Number(newRoomSeed) || 42424);
      }
    } catch {
      const fallbackId = 'ROOM-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      onJoinServer(fallbackId, Number(newRoomSeed) || 42424);
    }
  };

  const handleDirectConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
    if (code) {
      onJoinServer(code);
    }
  };

  const getShareableUrl = () => {
    return window.location.origin;
  };

  const copyShareLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="relative w-full h-screen bg-stone-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Dynamic Animated Pixel Backdrop Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Floating subtle ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* Game Title Logo Lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono text-emerald-400 mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Gerçek Zamanlı 3D Voxel Sandbox</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-['Press_Start_2P'] uppercase text-emerald-400">
            VOXEL<span className="text-amber-400">CRAFT</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-400 font-mono mt-2 tracking-wide">
            Online Çok Oyunculu Blok Dünyası
          </p>
        </div>

        {/* Player Profile Setup Strip */}
        <div className="w-full bg-stone-900/90 border border-stone-800 rounded-xl p-4 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Oyuncu Adın
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                placeholder="Steve"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Karakter Rengi
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.name}
                    onClick={() => setPlayerColor(p.hex)}
                    style={{ backgroundColor: p.hex }}
                    className={`w-6 h-6 rounded-md transition-transform ${
                      playerColor === p.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Home Menu */}
        {activeTab === 'home' && (
          <div className="w-full space-y-3">
            <button
              onClick={() => onStartSinglePlayer(12345)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] border border-emerald-400/30"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Tek Oyunculu Oyna (Singleplayer)</span>
            </button>

            <button
              onClick={() => setActiveTab('multiplayer')}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] border border-blue-400/30"
            >
              <Globe className="w-5 h-5" />
              <span>Online Çok Oyunculu (Multiplayer)</span>
            </button>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setActiveTab('direct_connect')}
                className="py-3 px-4 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-800 flex items-center justify-center gap-2 text-xs font-mono font-semibold transition-colors"
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>Oda Koduyla Katıl</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="py-3 px-4 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-800 flex items-center justify-center gap-2 text-xs font-mono font-semibold transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-stone-400" />
                <span>Ayarlar</span>
              </button>
            </div>

            {/* Quick Share with Friends Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-850 text-xs font-mono text-stone-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Arkadaşlarınla birlikte oynamak çok kolay!</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowInviteGuide(true)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow"
                >
                  Nasıl Oynanır?
                </button>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-stone-850 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg text-xs font-mono transition-colors"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Multiplayer Server Browser */}
        {activeTab === 'multiplayer' && (
          <div className="w-full bg-stone-900/95 border border-stone-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-sm text-stone-200 uppercase tracking-wider font-mono">
                  Aktif Sunucular
                </h2>
              </div>
              <button
                onClick={fetchRooms}
                disabled={isLoadingRooms}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Room List */}
            <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
              {rooms.length === 0 ? (
                <div className="text-center py-6 text-stone-500 font-mono text-xs">
                  {isLoadingRooms ? 'Sunucular yükleniyor...' : 'Aktif sunucu bulunamadı.'}
                </div>
              ) : (
                rooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-950/80 border border-stone-800/80 hover:border-stone-700 transition-all"
                  >
                    <div>
                      <div className="font-bold text-xs text-white font-mono flex items-center gap-2">
                        <span>{r.name}</span>
                        <span className="text-[10px] text-stone-500 font-normal">#{r.id}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                        Tohum: <span className="text-stone-300">{r.seed}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-stone-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        {r.playerCount}/{r.maxPlayers}
                      </span>
                      <button
                        onClick={() => onJoinServer(r.id, r.seed)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded transition-colors"
                      >
                        Bağlan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('create_room')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Özel Oda Oluştur</span>
              </button>
              <button
                onClick={() => setActiveTab('direct_connect')}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Kodla Katıl</span>
              </button>
              <button
                onClick={() => setActiveTab('home')}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors"
              >
                Geri
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Create Room */}
        {activeTab === 'create_room' && (
          <form
            onSubmit={handleCreateRoom}
            className="w-full bg-stone-900/95 border border-stone-800 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h2 className="font-bold text-sm text-stone-200 uppercase tracking-wider font-mono border-b border-stone-800 pb-2">
              Yeni Özel Dünya Oluştur
            </h2>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Oda / Dünya Adı
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                maxLength={30}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                  Dünya Tohumu (Seed)
                </label>
                <input
                  type="text"
                  value={newRoomSeed}
                  onChange={(e) => setNewRoomSeed(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                  Maksimum Oyuncu
                </label>
                <input
                  type="number"
                  min={2}
                  max={24}
                  value={newRoomMaxPlayers}
                  onChange={(e) => setNewRoomMaxPlayers(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newRoomPrivate}
                onChange={(e) => setNewRoomPrivate(e.target.checked)}
                className="rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-0"
              />
              <label htmlFor="isPrivate" className="text-xs font-mono text-stone-300">
                Gizli Oda (Sadece oda koduna sahip arkadaşlar girebilsin)
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shadow-lg shadow-emerald-900/30"
              >
                Dünyayı Başlat & Katıl
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('multiplayer')}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Direct Connect via Code */}
        {activeTab === 'direct_connect' && (
          <form
            onSubmit={handleDirectConnect}
            className="w-full bg-stone-900/95 border border-stone-800 rounded-xl p-5 shadow-2xl space-y-4"
          >
            <h2 className="font-bold text-sm text-stone-200 uppercase tracking-wider font-mono border-b border-stone-800 pb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Oda Koduyla Katıl</span>
            </h2>

            <p className="text-xs font-mono text-stone-400">
              Arkadaşının paylaştığı oda kodunu (örneğin: <span className="text-amber-400 font-bold">ROOM-XYZ</span>) veya sunucu adını gir:
            </p>

            <div>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="Örn: ROOM-4821 veya public-survival"
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shadow-lg shadow-amber-900/30"
              >
                Odaya Bağlan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors"
              >
                Geri
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-3 text-center text-[10px] font-mono text-stone-600">
        Three.js Voxel Engine · Node.js WebSocket Gerçek Zamanlı Multiplayer
      </div>

      {/* Invite & How To Play Guide Modal */}
      {showInviteGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Arkadaşlarınla Nasıl Oynarsın?</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteGuide(false)}
                className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-stone-300">
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-850 space-y-1.5">
                <span className="text-stone-400 text-[11px] block">1. Arkadaşına Göndereceğin Oyun Linki:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl()}
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors"
                  >
                    {copySuccess ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <p><strong className="text-white">Linki Gönderin:</strong> Yukarıdaki linki arkadaşınıza WhatsApp, Discord veya mesaj ile iletin.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <p><strong className="text-white">Tarayıcıdan Açsın:</strong> Arkadaşınız linke tıklayıp herhangi bir şey indirmeden tarayıcısından girsin.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <p><strong className="text-white">Aynı Odaya Girin:</strong> "Online Çok Oyunculu" menüsünden aynı sunucuyu seçin veya "Özel Oda" oluşturup oda kodunu (örneğin <span className="text-amber-400">ROOM-ABC</span>) paylaşın.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <p><strong className="text-emerald-400">Gerçek Zamanlı Senkron:</strong> Birbirinizi 3D karakter olarak görecek, birlikte blok kırıp koyabilecek ve canlı sohbet edebileceksiniz!</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInviteGuide(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold rounded-lg transition-colors"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

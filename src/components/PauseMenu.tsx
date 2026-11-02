import React, { useState } from 'react';
import { Play, Copy, Check, Settings as SettingsIcon, LogOut, Users, Share2 } from 'lucide-react';

interface PauseMenuProps {
  roomId: string;
  isSinglePlayer: boolean;
  playerCount: number;
  onResume: () => void;
  onOpenSettings: () => void;
  onLeaveGame: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  roomId,
  isSinglePlayer,
  playerCount,
  onResume,
  onOpenSettings,
  onLeaveGame,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-none flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <h2 className="text-xl font-bold font-['Press_Start_2P'] text-emerald-400 mb-1">
          DURAKLATILDI
        </h2>
        <p className="text-xs font-mono text-stone-400 mb-6">
          {isSinglePlayer ? 'Tek Oyunculu Mod' : `Oda: ${roomId}`}
        </p>

        {/* Multiplayer Invite Card */}
        {!isSinglePlayer && (
          <div className="w-full bg-stone-950/80 border border-stone-800 rounded-xl p-3 mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-stone-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Aktif Oyuncular:
              </span>
              <span className="font-bold text-white">{playerCount} Kişi</span>
            </div>

            <div className="pt-2 border-t border-stone-850 flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Alındı' : 'Davet Linki'}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kopyalandı' : 'Kod: ' + roomId}</span>
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Oyuna Dön</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono rounded-xl flex items-center justify-center gap-2 transition-colors border border-stone-700 text-sm"
          >
            <SettingsIcon className="w-4 h-4 text-stone-400" />
            <span>Ayarlar</span>
          </button>

          <button
            onClick={onLeaveGame}
            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-mono rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-800/40 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Ana Menüye Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Volume2, Eye, Sliders, Move } from 'lucide-react';
import { GameSettings } from '../game/GameCanvas';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-5">
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Oyun Ayarları</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Render Distance */}
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Görüş Mesafesi (Render Distance)
              </span>
              <span className="font-bold text-emerald-400">{settings.renderDistance} Chunk ({settings.renderDistance * 16}m)</span>
            </div>
            <input
              type="range"
              min={3}
              max={20}
              step={1}
              value={settings.renderDistance}
              onChange={(e) => onUpdateSettings({ renderDistance: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-stone-950 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-stone-500 mt-0.5">
              <span>Hızlı (3)</span>
              <span>Dengeli (6)</span>
              <span>Geniş (12)</span>
              <span>Maksimum (20)</span>
            </div>
          </div>

          {/* Field of View (FOV) */}
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                Bakış Açısı (FOV)
              </span>
              <span className="font-bold text-emerald-400">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min={60}
              max={95}
              step={5}
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-stone-950 rounded cursor-pointer"
            />
          </div>

          {/* Mouse Sensitivity */}
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                Fare Hassasiyeti (Sensitivity)
              </span>
              <span className="font-bold text-emerald-400">{settings.sensitivity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={settings.sensitivity}
              onChange={(e) => onUpdateSettings({ sensitivity: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-stone-950 rounded cursor-pointer"
            />
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                Ses Düzeyi (Volume)
              </span>
              <span className="font-bold text-emerald-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-stone-950 rounded cursor-pointer"
            />
          </div>

          {/* View Bobbing Checkbox */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <label htmlFor="viewBobbing" className="text-xs font-mono text-stone-300 cursor-pointer">
              Yürüyüş Sallantısı (View Bobbing)
            </label>
            <input
              type="checkbox"
              id="viewBobbing"
              checked={settings.viewBobbing}
              onChange={(e) => onUpdateSettings({ viewBobbing: e.target.checked })}
              className="rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg transition-colors"
          >
            Kaydet ve Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

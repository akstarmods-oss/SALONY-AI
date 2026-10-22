import React from 'react';
import { Settings, Sparkles, Flashlight, Brain, Smartphone } from 'lucide-react';
import { AssistantState } from '../services/liveSession';

interface HeaderProps {
  state: AssistantState;
  isTorchOn: boolean;
  onToggleTorch: () => void;
  onOpenSettings: () => void;
  onOpenMemories: () => void;
  onOpenAndroidProject: () => void;
  memoryCount: number;
  selectedVoice: string;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isTorchOn,
  onToggleTorch,
  onOpenSettings,
  onOpenMemories,
  onOpenAndroidProject,
  memoryCount,
}) => {
  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return {
          text: 'Speaking',
          color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          dot: 'bg-fuchsia-400 animate-ping',
        };
      case 'listening':
        return {
          text: 'Live • 24kHz',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400 animate-pulse',
        };
      case 'connecting':
        return {
          text: 'Connecting...',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400 animate-spin',
        };
      case 'disconnected':
      default:
        return {
          text: 'Standby',
          color: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
          dot: 'bg-slate-500',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-4 py-3 border-b border-purple-900/20 backdrop-blur-md bg-black/30 sticky top-0 z-30">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[1px] shadow-[0_0_15px_rgba(168,85,247,0.35)] shrink-0">
          <div className="w-full h-full bg-[#070514] rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-wider font-['Space_Grotesk'] bg-gradient-to-r from-white via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              SALONY AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Android
            </span>
          </div>
          <p className="text-[11px] text-purple-300/60 -mt-0.5 font-medium">Native Assistant & Device Control</p>
        </div>
      </div>

      {/* Status indicator & Quick Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Status Pill */}
        <div
          className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all ${status.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span>{status.text}</span>
        </div>

        {/* Android Project / IDE Button */}
        <button
          onClick={onOpenAndroidProject}
          className="p-2 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 hover:text-white hover:bg-emerald-900/50 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1"
          title="AndroidIDE Project Files & Build Guide"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden md:inline text-xs font-semibold">Android Project</span>
        </button>

        {/* Memory Dashboard Button with badge */}
        <button
          onClick={onOpenMemories}
          className="relative p-2 rounded-xl bg-purple-950/40 text-cyan-300 border border-purple-800/40 hover:text-white hover:bg-purple-900/40 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] flex items-center gap-1"
          title="Open Salony's Memory Dashboard"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          {memoryCount > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-400 text-black leading-tight">
              {memoryCount}
            </span>
          )}
        </button>

        {/* Torch toggle button */}
        <button
          onClick={onToggleTorch}
          className={`p-2 rounded-xl border transition-all ${
            isTorchOn
              ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
              : 'bg-purple-950/40 text-purple-300/70 border-purple-800/40 hover:text-white hover:bg-purple-900/40'
          }`}
          title={isTorchOn ? 'Turn off Torch' : 'Turn on Torch'}
        >
          <Flashlight className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-purple-950/40 text-purple-300/70 border border-purple-800/40 hover:text-white hover:bg-purple-900/40 transition-all"
          title="Settings & Voice Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

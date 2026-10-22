import React from 'react';
import { Youtube, MessageCircle, Flashlight, Heart, Sparkles, Smile, Brain, HelpCircle } from 'lucide-react';

interface QuickActionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectPrompt, disabled }) => {
  const suggestions = [
    { label: 'Yaad rakhna...', icon: <Brain className="w-3.5 h-3.5 text-cyan-300" />, prompt: 'Salony, yaad rakhna mera favourite colour electric blue hai' },
    { label: 'Kya yaad hai?', icon: <HelpCircle className="w-3.5 h-3.5 text-fuchsia-300" />, prompt: 'Salony, mere baare me kya kya yaad hai tumhe?' },
    { label: 'YouTube kholo', icon: <Youtube className="w-3.5 h-3.5 text-red-400" />, prompt: 'Salony, YouTube kholo' },
    { label: 'Torch on karo', icon: <Flashlight className="w-3.5 h-3.5 text-amber-300" />, prompt: 'Salony, torch on karo' },
    { label: 'WhatsApp kholo', icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />, prompt: 'Salony, WhatsApp kholo' },
    { label: 'Kaisi ho Salony?', icon: <Smile className="w-3.5 h-3.5 text-cyan-300" />, prompt: 'Kaisi ho Salony?' },
    { label: 'Kuch sweet bolo', icon: <Heart className="w-3.5 h-3.5 text-pink-400" />, prompt: 'Salony, kuch sweet aur romantic bolo na' },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-purple-300/60">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Voice Suggestions & Memory Commands</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(item.prompt)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/30 hover:bg-purple-900/50 border border-purple-800/40 hover:border-cyan-500/50 text-xs font-medium text-purple-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

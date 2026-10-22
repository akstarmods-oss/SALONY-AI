import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Mic, Flashlight, Bell, Sparkles, Check, HelpCircle } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onTestTorch: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  soundEnabled,
  onToggleSound,
  onTestTorch,
}) => {
  const voices = [
    { id: 'Kore', name: 'Kore', desc: 'Sweet, loving & caring girlfriend tone (Recommended)', tag: 'Warm Female' },
    { id: 'Aoede', name: 'Aoede', desc: 'Gentle, soothing & expressive', tag: 'Soft Female' },
    { id: 'Zephyr', name: 'Zephyr', desc: 'Playful, modern & bright', tag: 'Clear Female' },
    { id: 'Puck', name: 'Puck', desc: 'Energetic & cheerful', tag: 'Lively' },
    { id: 'Charon', name: 'Charon', desc: 'Calm, steady & deep', tag: 'Calm' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#0a071b] border border-purple-500/30 rounded-3xl p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-900/40 text-cyan-300">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-['Space_Grotesk'] tracking-wide">
                  Settings & Preferences
                </h3>
                <p className="text-xs text-purple-300/60">Customize Salony's voice and audio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-purple-900/30 text-purple-300 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-5">
            {/* Voice Persona Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300/70 mb-2.5 block">
                Salony's Voice Model
              </label>
              <div className="space-y-2">
                {voices.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        onSelectVoice(v.id);
                        soundEffects.playActionChirp();
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-900/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-purple-950/20 border-purple-900/40 hover:bg-purple-900/30 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{v.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                            {v.tag}
                          </span>
                        </div>
                        <p className="text-xs text-purple-200/60 mt-0.5">{v.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio & Sound Effects */}
            <div className="pt-2 border-t border-purple-900/30">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300/70 mb-2.5 block">
                Audio & Feedback
              </label>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-950/20 border border-purple-900/40">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-purple-300" />
                  <div>
                    <span className="text-sm font-medium">Chimes & Sound FX</span>
                    <p className="text-xs text-purple-300/60">Connect & action audio chimes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => onToggleSound(e.target.checked)}
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Voice Command Tips */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-indigo-950/30 border border-purple-800/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Saying to Salony</span>
              </div>
              <ul className="text-xs space-y-1.5 text-purple-200/80">
                <li>• <span className="font-semibold text-white">"Salony, YouTube kholo"</span> - Opens YouTube</li>
                <li>• <span className="font-semibold text-white">"Salony, WhatsApp kholo"</span> - Opens WhatsApp</li>
                <li>• <span className="font-semibold text-white">"Salony, torch on/off karo"</span> - Controls flashlight</li>
                <li>• <span className="font-semibold text-white">"Kaisi ho meri jaan?"</span> - Romantic reply</li>
                <li>• <span className="font-semibold text-white">"Mujhe ek sweet shayari sunao"</span> - Sweet poetry</li>
              </ul>
            </div>
          </div>

          {/* Footer Done Button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-sm shadow-lg hover:opacity-95 active:scale-98 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

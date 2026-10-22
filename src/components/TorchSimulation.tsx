import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashlight, X } from 'lucide-react';

interface TorchSimulationProps {
  isOn: boolean;
  onTurnOff: () => void;
}

export const TorchSimulation: React.FC<TorchSimulationProps> = ({ isOn, onTurnOff }) => {
  return (
    <AnimatePresence>
      {isOn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-8 text-black select-none"
        >
          {/* Top header */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flashlight className="w-6 h-6 text-amber-500 animate-pulse fill-amber-500" />
              <span className="font-extrabold text-lg tracking-wider font-['Space_Grotesk'] text-slate-900">
                TORCH ACTIVE
              </span>
            </div>
            <button
              onClick={onTurnOff}
              className="p-2.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-800 transition-all active:scale-90"
              title="Close Torch"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center glowing indicator */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-32 h-32 rounded-full bg-amber-300/40 border-4 border-amber-400 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.8)]">
              <Flashlight className="w-16 h-16 text-amber-600 fill-amber-500" />
            </div>
            <p className="font-bold text-xl text-slate-900">Full Screen Flashlight</p>
            <p className="text-sm text-slate-600 max-w-xs">
              Say <span className="font-semibold text-purple-700">"Salony, torch off karo"</span> or tap below to turn it off.
            </p>
          </div>

          {/* Bottom dismiss button */}
          <button
            onClick={onTurnOff}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-semibold text-base shadow-xl active:scale-95 transition-all"
          >
            Turn Off Flashlight
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AssistantState } from '../services/liveSession';
import { Mic, Volume2, Loader2, Power } from 'lucide-react';

interface StatusIndicatorProps {
  state: AssistantState;
  onInterrupt?: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state, onInterrupt }) => {
  const getStatusContent = () => {
    switch (state) {
      case 'speaking':
        return {
          icon: <Volume2 className="w-4 h-4 text-fuchsia-300 animate-pulse" />,
          label: 'Salony is speaking...',
          subLabel: 'Tap orb or speak to interrupt',
          style: 'text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-950/20',
        };
      case 'listening':
        return {
          icon: <Mic className="w-4 h-4 text-cyan-300 animate-bounce" />,
          label: 'Listening to you...',
          subLabel: 'Kuch bhi boliye (Hindi, Hinglish, English)',
          style: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20',
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />,
          label: 'Connecting to Salony...',
          subLabel: 'Establishing real-time audio session',
          style: 'text-purple-300 border-purple-500/30 bg-purple-950/20',
        };
      case 'disconnected':
      default:
        return {
          icon: <Power className="w-4 h-4 text-slate-400" />,
          label: 'Salony is waiting for you',
          subLabel: 'Tap the glowing orb or microphone to start',
          style: 'text-slate-300 border-purple-900/40 bg-purple-950/10',
        };
    }
  };

  const current = getStatusContent();

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-2 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-all ${current.style}`}
            onClick={state === 'speaking' ? onInterrupt : undefined}
          >
            {current.icon}
            <span className="text-sm font-semibold tracking-wide font-['Space_Grotesk']">
              {current.label}
            </span>
          </div>
          <span className="text-xs text-purple-200/50 font-normal">
            {current.subLabel}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

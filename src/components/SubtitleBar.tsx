import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface SubtitleBarProps {
  lastTranscript: {
    role: 'user' | 'model';
    text: string;
  } | null;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({ lastTranscript }) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 min-h-[58px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {lastTranscript ? (
          <motion.div
            key={lastTranscript.text}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`w-full px-4 py-2.5 rounded-2xl border backdrop-blur-md text-sm text-center shadow-lg flex items-center justify-center gap-2 ${
              lastTranscript.role === 'model'
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
            }`}
          >
            {lastTranscript.role === 'model' ? (
              <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0 fill-pink-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            )}
            <p className="font-medium tracking-wide line-clamp-2 italic">
              "{lastTranscript.text}"
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-purple-300/40 font-medium tracking-wider flex items-center gap-1.5"
          >
            <span>✨</span>
            <span>Natural Hinglish, Hindi & English Voice Assistant</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

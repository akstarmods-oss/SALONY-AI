import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, PhoneOff, RotateCcw, VolumeX } from 'lucide-react';
import { AssistantState } from '../services/liveSession';

interface VoiceControlsProps {
  state: AssistantState;
  isMuted: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  isMuted,
  onToggleConnect,
  onToggleMute,
  onInterrupt,
}) => {
  const isConnected = state === 'listening' || state === 'speaking' || state === 'connecting';

  return (
    <div className="w-full flex items-center justify-center gap-6 px-6 py-4 pb-8">
      {/* Secondary Left Action: Mute Mic (when connected) or Reconnect */}
      {isConnected ? (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all shadow-lg ${
            isMuted
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'bg-purple-950/40 text-purple-200/80 border-purple-800/40 hover:bg-purple-900/50 hover:text-white'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
      ) : (
        <div className="w-12 h-12" /> // spacer to keep center balanced
      )}

      {/* Prominent Center Power / Talk Button */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring around main button when connected */}
        {isConnected && (
          <motion.div
            className="absolute rounded-full -inset-2.5 border-2 border-cyan-400/40 pointer-events-none"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <button
          onClick={onToggleConnect}
          className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isConnected
              ? 'bg-gradient-to-tr from-rose-600 via-purple-600 to-cyan-500 border-white/60 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]'
              : 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-400 border-cyan-300/50 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)]'
          }`}
          title={isConnected ? 'Tap to Disconnect' : 'Tap to Start Voice with Salony'}
        >
          {isConnected ? (
            <PhoneOff className="w-8 h-8 drop-shadow-md text-white animate-pulse" />
          ) : (
            <Mic className="w-8 h-8 drop-shadow-md text-white" />
          )}
        </button>
      </div>

      {/* Secondary Right Action: Interruption button or Disconnect button */}
      {isConnected ? (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={state === 'speaking' ? onInterrupt : onToggleConnect}
          className={`w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all shadow-lg ${
            state === 'speaking'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-purple-950/40 text-purple-200/80 border-purple-800/40 hover:bg-purple-900/50 hover:text-white'
          }`}
          title={state === 'speaking' ? 'Interrupt Salony' : 'End Session'}
        >
          {state === 'speaking' ? <VolumeX className="w-5 h-5" /> : <PhoneOff className="w-5 h-5 text-rose-400" />}
        </motion.button>
      ) : (
        <div className="w-12 h-12" />
      )}
    </div>
  );
};

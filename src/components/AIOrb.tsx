import React from 'react';
import { motion } from 'motion/react';
import { AssistantState } from '../services/liveSession';

interface AIOrbProps {
  state: AssistantState;
  inputVolume: number;
  outputVolume: number;
  onClick?: () => void;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  state,
  inputVolume,
  outputVolume,
  onClick,
}) => {
  // Volume to drive physical response
  const reactiveVolume = state === 'speaking' ? outputVolume : state === 'listening' ? inputVolume : 0;
  const scaleMultiplier = 1 + reactiveVolume * 0.45;
  const glowIntensity =
    state === 'speaking'
      ? 0.85 + reactiveVolume * 0.4
      : state === 'listening'
      ? 0.55 + reactiveVolume * 0.35
      : state === 'connecting'
      ? 0.5
      : 0.2;

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none py-6 my-auto"
      style={{ minHeight: '340px' }}
      title="Tap to interact with Salony"
    >
      {/* Ambient background bloom glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none filter blur-3xl opacity-60"
        style={{
          width: '320px',
          height: '320px',
          background:
            state === 'speaking'
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.75) 0%, rgba(6, 182, 212, 0.4) 50%, rgba(236, 72, 153, 0.2) 75%, transparent 100%)'
              : state === 'listening'
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, rgba(147, 51, 234, 0.35) 60%, transparent 80%)'
              : state === 'connecting'
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(59, 130, 246, 0.25) 60%, transparent 80%)'
              : 'radial-gradient(circle, rgba(76, 29, 149, 0.3) 0%, rgba(30, 27, 75, 0.15) 60%, transparent 80%)',
        }}
        animate={{
          scale: [scaleMultiplier * 0.95, scaleMultiplier * 1.08, scaleMultiplier * 0.95],
          opacity: [glowIntensity * 0.8, glowIntensity * 1.15, glowIntensity * 0.8],
        }}
        transition={{
          duration: state === 'speaking' ? 1.4 : state === 'listening' ? 2.5 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer Soundwaves / Expanding Ring Ripples (Speaking & Listening) */}
      {(state === 'speaking' || (state === 'listening' && inputVolume > 0.05)) && (
        <>
          <motion.div
            className="absolute rounded-full border border-purple-500/30 pointer-events-none"
            initial={{ width: 180, height: 180, opacity: 0.8 }}
            animate={{
              width: [180, 310 + reactiveVolume * 80],
              height: [180, 310 + reactiveVolume * 80],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute rounded-full border border-cyan-400/25 pointer-events-none"
            initial={{ width: 180, height: 180, opacity: 0.8 }}
            animate={{
              width: [180, 270 + reactiveVolume * 60],
              height: [180, 270 + reactiveVolume * 60],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: 0.7,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        </>
      )}

      {/* Connecting Gyro Orbital Rings */}
      {state === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-56 h-56 rounded-full border-2 border-dashed border-cyan-400/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full border border-purple-400/40"
            style={{ borderTopColor: '#c084fc', borderBottomColor: '#22d3ee' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* Orbiting Satellite Particle Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-52 h-52 rounded-full border border-purple-500/20 relative"
          animate={{ rotate: 360 }}
          transition={{
            duration: state === 'speaking' ? 8 : state === 'listening' ? 14 : 22,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Satellite bead 1 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
          {/* Satellite bead 2 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_10px_#d8b4fe]" />
        </motion.div>

        <motion.div
          className="absolute w-44 h-44 rounded-full border border-cyan-500/20 relative"
          animate={{ rotate: -360 }}
          transition={{
            duration: state === 'speaking' ? 10 : state === 'listening' ? 18 : 28,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_#e879f9]" />
        </motion.div>
      </div>

      {/* Main Core Orb */}
      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center overflow-hidden shadow-2xl transition-all"
        style={{
          width: '180px',
          height: '180px',
          background:
            state === 'speaking'
              ? 'radial-gradient(circle at 35% 35%, #ec4899 0%, #8b5cf6 45%, #1e1b4b 95%)'
              : state === 'listening'
              ? 'radial-gradient(circle at 35% 35%, #06b6d4 0%, #6366f1 45%, #0f172a 95%)'
              : state === 'connecting'
              ? 'radial-gradient(circle at 35% 35%, #a855f7 0%, #3b82f6 50%, #09090b 95%)'
              : 'radial-gradient(circle at 35% 35%, #4c1d95 0%, #1e1b4b 60%, #05050f 95%)',
          boxShadow:
            state === 'speaking'
              ? `0 0 ${40 + reactiveVolume * 45}px rgba(168, 85, 247, 0.7), inset 0 0 25px rgba(255, 255, 255, 0.45)`
              : state === 'listening'
              ? `0 0 ${35 + reactiveVolume * 35}px rgba(6, 182, 212, 0.65), inset 0 0 20px rgba(255, 255, 255, 0.35)`
              : state === 'connecting'
              ? '0 0 30px rgba(139, 92, 246, 0.45), inset 0 0 15px rgba(255, 255, 255, 0.2)'
              : '0 0 18px rgba(91, 33, 182, 0.25), inset 0 0 10px rgba(255, 255, 255, 0.08)',
        }}
        animate={{
          scale: [scaleMultiplier, scaleMultiplier * 1.05, scaleMultiplier],
        }}
        transition={{
          duration: state === 'speaking' ? 1.2 : state === 'listening' ? 2 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner Liquid Plasma Waves */}
        <div className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 10,50 Q 25,25 50,50 T 90,50 Q 75,75 50,50 T 10,50"
              fill="url(#orbGrad)"
              animate={{
                d:
                  state === 'speaking'
                    ? [
                        'M 10,50 Q 25,15 50,50 T 90,50 Q 75,85 50,50 T 10,50',
                        'M 10,50 Q 25,75 50,45 T 90,55 Q 75,25 50,55 T 10,50',
                        'M 10,50 Q 25,15 50,50 T 90,50 Q 75,85 50,50 T 10,50',
                      ]
                    : [
                        'M 10,50 Q 25,35 50,50 T 90,50 Q 75,65 50,50 T 10,50',
                        'M 10,50 Q 25,60 50,48 T 90,52 Q 75,40 50,52 T 10,50',
                        'M 10,50 Q 25,35 50,50 T 90,50 Q 75,65 50,50 T 10,50',
                      ],
              }}
              transition={{
                duration: state === 'speaking' ? 2 : 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </div>

        {/* Specular glass highlight reflection on top edge */}
        <div className="absolute top-2 left-6 right-6 h-12 rounded-full bg-gradient-to-b from-white/35 to-transparent blur-[1px] pointer-events-none transform -rotate-12" />

        {/* Dynamic Voice Bars inside orb when active */}
        {state === 'speaking' && (
          <div className="relative z-20 flex items-center justify-center gap-1.5 px-3">
            {[45, 80, 100, 70, 90, 60, 40].map((baseH, idx) => {
              const h = Math.max(12, baseH * (0.3 + reactiveVolume * 0.9));
              return (
                <motion.div
                  key={idx}
                  className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 via-white to-fuchsia-300 shadow-[0_0_8px_#ffffff]"
                  animate={{
                    height: [h * 0.6, h * 1.2, h * 0.6],
                  }}
                  transition={{
                    duration: 0.35 + idx * 0.08,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Listening gentle breathing dot pulse */}
        {state === 'listening' && (
          <div className="relative z-20 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_8px_#38bdf8]"
                animate={{
                  scale: [1, 1.8 + inputVolume * 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.25,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Disconnected subtle core glow */}
        {state === 'disconnected' && (
          <div className="relative z-20 flex flex-col items-center justify-center text-purple-300/60 text-xs font-medium tracking-widest">
            <span className="w-2 h-2 rounded-full bg-purple-500/50 mb-1" />
            STANDBY
          </div>
        )}
      </motion.div>
    </div>
  );
};

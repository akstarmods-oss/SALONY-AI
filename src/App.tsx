import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { AIOrb } from './components/AIOrb';
import { StatusIndicator } from './components/StatusIndicator';
import { SubtitleBar } from './components/SubtitleBar';
import { QuickActions } from './components/QuickActions';
import { VoiceControls } from './components/VoiceControls';
import { SettingsModal } from './components/SettingsModal';
import { MemoryDashboard } from './components/MemoryDashboard';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { TorchSimulation } from './components/TorchSimulation';
import { ActionToast } from './components/ActionToast';
import { ErrorAlert } from './components/ErrorAlert';
import { LiveSession, AssistantState } from './services/liveSession';
import { ToolActionResult, toolManager } from './services/toolManager';
import { soundEffects } from './services/soundEffects';
import { memoryService } from './services/memoryService';

export default function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastTranscript, setLastTranscript] = useState<{ role: 'user' | 'model'; text: string } | null>(null);
  const [activeAction, setActiveAction] = useState<ToolActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMemoryDashboardOpen, setIsMemoryDashboardOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  const sessionRef = useRef<LiveSession | null>(null);

  // Fetch current memory count from persistence
  const refreshMemoryCount = useCallback(async () => {
    try {
      const items = await memoryService.getMemories();
      setMemoryCount(items.length);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshMemoryCount();
  }, [refreshMemoryCount]);

  // Initialize and update LiveSession
  const getSession = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = new LiveSession({
        voice: selectedVoice,
        onStateChange: (newState) => {
          setState(newState);
        },
        onInputVolumeChange: (vol) => {
          if (!isMuted) {
            setInputVolume(vol);
          }
        },
        onOutputVolumeChange: (vol) => {
          setOutputVolume(vol);
        },
        onTranscript: (role, text) => {
          setLastTranscript({ role, text });
        },
        onToolAction: (actionResult) => {
          setActiveAction(actionResult);
          if (actionResult.action === 'TORCH_ON') {
            setIsTorchOn(true);
          } else if (actionResult.action === 'TORCH_OFF') {
            setIsTorchOn(false);
          }
        },
        onMemoryEvent: (type, payload) => {
          refreshMemoryCount();
          if (type === 'saved' && payload?.key) {
            setActiveAction({
              type: 'controlDeviceAction',
              success: true,
              message: `Salony remembered: ${payload.key}`,
            });
          } else if (type === 'updated' && payload?.key) {
            setActiveAction({
              type: 'controlDeviceAction',
              success: true,
              message: `Salony updated memory: ${payload.key}`,
            });
          } else if (type === 'deleted' && payload?.key) {
            setActiveAction({
              type: 'controlDeviceAction',
              success: true,
              message: `Salony forgot memory: ${payload.key}`,
            });
          }
        },
        onError: (errMsg) => {
          setError(errMsg);
        },
      });
    }
    return sessionRef.current;
  }, [selectedVoice, isMuted, refreshMemoryCount]);

  // Synchronize torch listener
  useEffect(() => {
    toolManager.onTorchChange = (isOn) => {
      setIsTorchOn(isOn);
    };
  }, []);

  // Update sound effects global toggle
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Voice Connection / Disconnection
  const handleToggleConnect = async () => {
    setError(null);
    const session = getSession();

    if (state === 'disconnected') {
      await session.connect(selectedVoice);
    } else {
      session.disconnect();
    }
  };

  // Handle interruption
  const handleInterrupt = () => {
    if (sessionRef.current && state === 'speaking') {
      sessionRef.current.handleInterruption();
    }
  };

  // Handle mute microphone
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    if (!isMuted) {
      setInputVolume(0);
    }
  };

  // Handle quick action prompt suggestion
  const handleSelectPrompt = async (prompt: string) => {
    setError(null);
    const session = getSession();

    if (state === 'disconnected') {
      await session.connect(selectedVoice);
      setTimeout(() => {
        session.sendTextPrompt(prompt);
      }, 700);
    } else {
      session.sendTextPrompt(prompt);
    }
  };

  // Handle manual torch toggle
  const handleToggleTorch = () => {
    if (isTorchOn) {
      toolManager.executeDeviceAction('TORCH_OFF');
    } else {
      toolManager.executeDeviceAction('TORCH_ON');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030014] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient futuristic lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/15 filter blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/15 filter blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-indigo-950/20 filter blur-[140px]" />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen max-w-xl mx-auto w-full">
        {/* Top Header */}
        <Header
          state={state}
          isTorchOn={isTorchOn}
          onToggleTorch={handleToggleTorch}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMemories={() => setIsMemoryDashboardOpen(true)}
          onOpenAndroidProject={() => setIsAndroidModalOpen(true)}
          memoryCount={memoryCount}
          selectedVoice={selectedVoice}
        />

        {/* Action notification toast (e.g. YouTube/WhatsApp/Memory saved) */}
        <ActionToast action={activeAction} onDismiss={() => setActiveAction(null)} />

        {/* Error notification alert */}
        <ErrorAlert
          error={error}
          onDismiss={() => setError(null)}
          onRetry={handleToggleConnect}
        />

        {/* Central Voice Experience Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 my-auto">
          {/* Animated AI Orb */}
          <AIOrb
            state={state}
            inputVolume={isMuted ? 0 : inputVolume}
            outputVolume={outputVolume}
            onClick={state === 'speaking' ? handleInterrupt : handleToggleConnect}
          />

          {/* Status Context Indicator */}
          <StatusIndicator state={state} onInterrupt={handleInterrupt} />
        </main>

        {/* Bottom Section: Subtitle Bar, Quick Voice Prompts & Primary Voice Controls */}
        <footer className="w-full flex flex-col items-center gap-2 pt-2">
          {/* Real-time Subtitle / Caption Bar */}
          <SubtitleBar lastTranscript={lastTranscript} />

          {/* Quick Voice Suggestions */}
          <QuickActions
            onSelectPrompt={handleSelectPrompt}
            disabled={state === 'connecting'}
          />

          {/* Primary Voice Controls */}
          <VoiceControls
            state={state}
            isMuted={isMuted}
            onToggleConnect={handleToggleConnect}
            onToggleMute={handleToggleMute}
            onInterrupt={handleInterrupt}
          />
        </footer>
      </div>

      {/* Screen Torch Simulation Overlay */}
      <TorchSimulation
        isOn={isTorchOn}
        onTurnOff={() => toolManager.executeDeviceAction('TORCH_OFF')}
      />

      {/* Visual Memory Dashboard */}
      <MemoryDashboard
        isOpen={isMemoryDashboardOpen}
        onClose={() => setIsMemoryDashboardOpen(false)}
        onMemoriesUpdated={refreshMemoryCount}
      />

      {/* Android IDE Native Assistant Modal */}
      <AndroidProjectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={(voice) => {
          setSelectedVoice(voice);
          if (state !== 'disconnected') {
            sessionRef.current?.disconnect();
          }
        }}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onTestTorch={handleToggleTorch}
      />
    </div>
  );
}

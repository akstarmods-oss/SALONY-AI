/**
 * LiveSession: High-level session manager coordinating WebSocket connection,
 * AudioStreamer, AudioPlayer, ToolManager, and assistant state.
 */

import { AudioPlayer } from './audioPlayer';
import { AudioStreamer } from './audioStreamer';
import { toolManager, ToolActionResult } from './toolManager';
import { soundEffects } from './soundEffects';
import { MemoryItem } from '../types/memory';

export type AssistantState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export interface LiveSessionConfig {
  voice?: string;
  onStateChange?: (state: AssistantState) => void;
  onInputVolumeChange?: (volume: number) => void;
  onOutputVolumeChange?: (volume: number) => void;
  onTranscript?: (role: 'user' | 'model', text: string) => void;
  onToolAction?: (result: ToolActionResult) => void;
  onMemoryEvent?: (type: 'saved' | 'updated' | 'deleted' | 'cleared', payload: any) => void;
  onError?: (errorMsg: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private streamer: AudioStreamer;
  private player: AudioPlayer;
  private state: AssistantState = 'disconnected';
  private config: LiveSessionConfig;
  private userSpeakingTimer: any = null;

  constructor(config: LiveSessionConfig = {}) {
    this.config = config;
    this.streamer = new AudioStreamer();
    this.player = new AudioPlayer();

    // Streamer callbacks (mic)
    this.streamer.onAudioData = (base64Chunk: string) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'audio', audio: base64Chunk }));
      }
    };

    this.streamer.onVolumeChange = (volume: number) => {
      if (this.config.onInputVolumeChange) {
        this.config.onInputVolumeChange(volume);
      }

      // If user speaks decisively while Salony is speaking, trigger local interruption
      // Higher threshold avoids speaker echo accidentally interrupting Salony
      if (volume > 0.35 && this.state === 'speaking') {
        this.handleInterruption();
      }
    };

    // Player callbacks (Salony's voice)
    this.player.onVolumeChange = (volume: number) => {
      if (this.config.onOutputVolumeChange) {
        this.config.onOutputVolumeChange(volume);
      }
    };

    this.player.onPlaybackStateChange = (isPlaying: boolean) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isPlaying) {
        this.setState('speaking');
      } else {
        // Automatically return to listening mode for continuous conversation!
        this.setState('listening');
      }
    };

    // Tool actions
    toolManager.onActionExecuted = (result: ToolActionResult) => {
      soundEffects.playActionChirp();
      if (this.config.onToolAction) {
        this.config.onToolAction(result);
      }
    };
  }

  getState(): AssistantState {
    return this.state;
  }

  private setState(newState: AssistantState): void {
    if (this.state === newState) return;
    this.state = newState;
    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }
  }

  /**
   * Connect to Gemini Live API via WebSocket and begin continuous microphone capture.
   */
  async connect(selectedVoice: string = 'Kore'): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.setState('connecting');

    try {
      // First ensure microphone permission and start continuous audio stream
      await this.streamer.start();

      // Build WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(selectedVoice)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        soundEffects.playConnectChime();
        this.setState('listening');
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'audio' && data.audio) {
            this.player.queueAudioChunk(data.audio);
          } else if (data.type === 'interrupted') {
            this.handleInterruption();
          } else if (data.type === 'turn_complete') {
            this.player.notifyTurnComplete();
          } else if (data.type === 'transcript') {
            if (this.config.onTranscript) {
              this.config.onTranscript(data.role, data.text);
            }
          } else if (data.type === 'tool_call') {
            if (data.name === 'openWebsite') {
              const url = data.validatedUrl || data.args?.url;
              const label = data.args?.label;
              if (url) {
                await toolManager.openWebsite(url, label);
              }
            } else if (data.name === 'controlDeviceAction') {
              const action = data.args?.action;
              const reason = data.args?.reason;
              if (action) {
                await toolManager.executeDeviceAction(action, reason);
              }
            }
          } else if (data.type === 'memory_saved') {
            soundEffects.playActionChirp();
            if (this.config.onMemoryEvent) {
              this.config.onMemoryEvent('saved', data.memory);
            }
          } else if (data.type === 'memory_updated') {
            soundEffects.playActionChirp();
            if (this.config.onMemoryEvent) {
              this.config.onMemoryEvent('updated', data.memory);
            }
          } else if (data.type === 'memory_deleted') {
            if (this.config.onMemoryEvent) {
              this.config.onMemoryEvent('deleted', { id: data.memoryId, key: data.key });
            }
          } else if (data.type === 'all_memories_cleared') {
            if (this.config.onMemoryEvent) {
              this.config.onMemoryEvent('cleared', { count: data.count });
            }
          } else if (data.type === 'error') {
            if (this.config.onError) {
              this.config.onError(data.error);
            }
          } else if (data.type === 'status' && data.status === 'disconnected') {
            this.disconnect();
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        if (this.config.onError) {
          this.config.onError('Connection error. Please verify server connectivity.');
        }
        this.disconnect();
      };

      this.ws.onclose = () => {
        this.disconnect();
      };
    } catch (err: any) {
      console.error('Failed to start session:', err);
      let errMsg = 'Failed to connect.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (err.message) {
        errMsg = err.message;
      }
      if (this.config.onError) {
        this.config.onError(errMsg);
      }
      this.disconnect();
    }
  }

  /**
   * Stops playback when interrupted and immediately returns to listening.
   */
  handleInterruption(): void {
    this.player.stop();
    if (this.state !== 'disconnected') {
      this.setState('listening');
    }
  }

  /**
   * Disconnects the session cleanly, stops mic and audio playback.
   */
  disconnect(): void {
    soundEffects.playDisconnectChime();
    this.streamer.stop();
    this.player.stop();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.setState('disconnected');
    if (this.config.onInputVolumeChange) this.config.onInputVolumeChange(0);
    if (this.config.onOutputVolumeChange) this.config.onOutputVolumeChange(0);
  }

  /**
   * Sends text prompt to Gemini Live session if user triggers a quick suggestion or voice test.
   */
  sendTextPrompt(prompt: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text: prompt }));
      if (this.config.onTranscript) {
        this.config.onTranscript('user', prompt);
      }
    }
  }
}

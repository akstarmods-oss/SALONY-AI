import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Folder,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'setup' | 'actions'>('files');
  const [selectedFile, setSelectedFile] = useState<string>('MainActivity.kt');
  const [copied, setCopied] = useState<boolean>(false);

  const fileMap: Record<string, { path: string; language: string; content: string }> = {
    'MainActivity.kt': {
      path: 'app/src/main/java/com/salony/ai/MainActivity.kt',
      language: 'kotlin',
      content: `package com.salony.ai

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.salony.ai.ui.screens.*
import com.salony.ai.ui.theme.SalonyAITheme
import com.salony.ai.voice.VoiceAssistantService

class MainActivity : ComponentActivity() {
    private var voiceService: VoiceAssistantService? = null
    // Full Kotlin Jetpack Compose activity coordinating permissions,
    // foreground voice service binding, and screen navigation.
}`,
    },
    'AndroidManifest.xml': {
      path: 'app/src/main/AndroidManifest.xml',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="com.android.alarm.permission.SET_ALARM" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    
    <application android:name=".SalonyApplication" ...>
        <service android:name=".voice.VoiceAssistantService" android:foregroundServiceType="microphone" />
        <service android:name=".accessibility.SalonyAccessibilityService" android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" />
    </application>
</manifest>`,
    },
    'build.gradle.kts': {
      path: 'app/build.gradle.kts',
      language: 'kotlin',
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.salony.ai"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.salony.ai"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
    buildFeatures { compose = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.material3:material3")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")
}`,
    },
    'DeviceActionRegistry.kt': {
      path: 'app/src/main/java/com/salony/ai/actions/DeviceActionRegistry.kt',
      language: 'kotlin',
      content: `package com.salony.ai.actions

class DeviceActionRegistry(context: Context, memoryRepo: MemoryRepository, logRepo: ActionLogRepository) {
    // Registers and dispatches modular device actions:
    // - OpenAppAction (YouTube, WhatsApp, Camera, Spotify)
    // - OpenSettingsAction (Wi-Fi, Bluetooth, Display, Sound)
    // - SetAlarmAction, SetTimerAction
    // - DialPhoneAction, SendSmsAction (with safety confirmation)
    // - ToggleTorchAction (CameraManager flash)
    // - MemoryActions (Save, Search, Update, Delete memories)
}`,
    },
    'VoiceAssistantService.kt': {
      path: 'app/src/main/java/com/salony/ai/voice/VoiceAssistantService.kt',
      language: 'kotlin',
      content: `package com.salony.ai.voice

import android.app.Service
import android.content.pm.ServiceInfo

class VoiceAssistantService : Service() {
    // Android Foreground Service running with FOREGROUND_SERVICE_TYPE_MICROPHONE
    // Keeps active 16kHz audio streaming and 24kHz playback alive while user navigates other apps.
}`,
    },
    'GeminiLiveClient.kt': {
      path: 'app/src/main/java/com/salony/ai/voice/GeminiLiveClient.kt',
      language: 'kotlin',
      content: `package com.salony.ai.voice

import okhttp3.WebSocket
import okhttp3.WebSocketListener

class GeminiLiveClient(actionRegistry: DeviceActionRegistry, scope: CoroutineScope) {
    // Connects via OkHttp WebSocket to Gemini Live endpoint.
    // Handles 16kHz audio capture, 24kHz playback, turn-taking, and device action calls.
}`,
    },
    'SalonyAccessibilityService.kt': {
      path: 'app/src/main/java/com/salony/ai/accessibility/SalonyAccessibilityService.kt',
      language: 'kotlin',
      content: `package com.salony.ai.accessibility

import android.accessibilityservice.AccessibilityService

class SalonyAccessibilityService : AccessibilityService() {
    // Optional accessibility service for user-directed interactions.
    // Strictly requires explicit user opt-in in Android Settings.
    // Guarded against banking apps and sensitive password fields.
}`,
    },
  };

  const handleCopy = () => {
    const code = fileMap[selectedFile]?.content || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="w-full max-w-4xl bg-[#09061c] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <div className="w-full h-full bg-[#080d1a] rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg sm:text-xl font-['Space_Grotesk'] tracking-wide">
                    Android Native Project (AndroidIDE)
                  </h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                    Kotlin + Compose
                  </span>
                </div>
                <p className="text-xs text-purple-300/60 font-medium">
                  Full Android personal assistant with modular device actions & foreground service
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-2 py-3 border-b border-purple-900/30 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'files'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Project Source Code</span>
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'setup'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>AndroidIDE Build Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'actions'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Supported Device Actions</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden py-3">
            {activeTab === 'files' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full overflow-hidden">
                {/* File Tree List */}
                <div className="p-2 rounded-2xl bg-slate-950/60 border border-purple-900/30 overflow-y-auto space-y-1">
                  <span className="text-[10px] uppercase font-bold text-purple-400 px-2 py-1 block">
                    Android Project Files (/android)
                  </span>
                  {Object.keys(fileMap).map((fileName) => {
                    const isSelected = selectedFile === fileName;
                    return (
                      <button
                        key={fileName}
                        onClick={() => setSelectedFile(fileName)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40 font-semibold'
                            : 'text-slate-300 hover:bg-purple-900/30'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Code Preview */}
                <div className="md:col-span-2 flex flex-col rounded-2xl bg-[#050314] border border-purple-900/40 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-purple-900/30 text-xs text-purple-300">
                    <span className="font-mono truncate">{fileMap[selectedFile]?.path}</span>
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-xs font-semibold flex items-center gap-1 text-white transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-emerald-300/90 overflow-auto flex-1 leading-relaxed whitespace-pre-wrap select-all">
                    {fileMap[selectedFile]?.content}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="space-y-4 overflow-y-auto h-full pr-2 text-xs text-purple-200/90 leading-relaxed">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    How to Open & Run in AndroidIDE
                  </h3>
                  <p>
                    The complete Gradle project is generated in the <code className="text-cyan-300">/android</code> root folder of this workspace, configured for Android SDK 34, Kotlin 1.9, and Jetpack Compose.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-white text-xs">Step 1: Transfer the Project</span>
                    <p className="text-purple-300/70">
                      Copy the <code className="text-cyan-300">/android</code> folder to your phone storage (e.g. <code className="text-cyan-300">/sdcard/AndroidIDEProjects/SalonyAI</code>).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-white text-xs">Step 2: Open in AndroidIDE</span>
                    <p className="text-purple-300/70">
                      Open AndroidIDE on your phone, choose <b>Open Project</b>, and select the folder. Let Gradle sync dependencies.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-white text-xs">Step 3: Build Debug APK</span>
                    <p className="text-purple-300/70">
                      Run <code className="text-cyan-300">./gradlew assembleDebug</code> or tap the Build button in AndroidIDE to generate and install the APK.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-white text-xs">Step 4: Connect to Voice Live Backend</span>
                    <p className="text-purple-300/70">
                      In the app settings, set the WebSocket URL to your running server (e.g. <code className="text-cyan-300">ws://&lt;PC-IP&gt;:3000/live</code> or cloud URL).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-3 overflow-y-auto h-full pr-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">Launch Apps (`openApp`)</span>
                    <p className="text-purple-300/70">
                      Launches YouTube, WhatsApp, Camera, Spotify, Calculator, Settings, or any installed launcher application.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">System Settings (`openSettings`)</span>
                    <p className="text-purple-300/70">
                      Opens Wi-Fi, Bluetooth, Display, Sound, Accessibility, or App Permissions screens via Android Intents.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">Alarms & Timers (`setAlarm`, `setTimer`)</span>
                    <p className="text-purple-300/70">
                      Sets clock alarms with hour/minutes and countdown timers with seconds using the AlarmClock provider.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">Calls & SMS (`dialPhone`, `sendSms`)</span>
                    <p className="text-purple-300/70">
                      Opens phone dialer and prepares SMS text messages with safety confirmations before consequential actions.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">Hardware Torch (`toggleTorch`)</span>
                    <p className="text-purple-300/70">
                      Controls physical camera flash via CameraManager.setTorchMode on Android Marshmallow and above.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                    <span className="font-bold text-cyan-300">Personal Memory (`saveMemory`, etc.)</span>
                    <p className="text-purple-300/70">
                      Persists facts, preferences, projects, and goals across sessions with search, edit, and deletion safeguards.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-300/60 shrink-0">
            <span>Project located in <code className="text-emerald-400">/android</code></span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 text-white font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

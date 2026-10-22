package com.akstarcompany.salony.ai.voice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

import com.akstarcompany.salony.ai.MainActivity;
import com.akstarcompany.salony.ai.R;
import com.akstarcompany.salony.ai.actions.DeviceActionHandler;
import com.akstarcompany.salony.ai.model.VoiceState;

public class VoiceAssistantService extends Service {

    public static final String CHANNEL_ID = "salony_voice_channel";
    public static final int NOTIFICATION_ID = 1001;

    public interface ServiceCallback {
        void onStateChanged(VoiceState state);
        void onInputVolume(float volume);
        void onOutputVolume(float volume);
        void onTranscript(String role, String text);
        void onError(String message);
    }

    private final IBinder binder = new LocalBinder();
    private AudioRecordStreamer recordStreamer;
    private AudioTrackPlayer audioPlayer;
    private GeminiLiveClient liveClient;
    private DeviceActionHandler actionHandler;
    private PowerManager.WakeLock wakeLock;

    private VoiceState currentState = VoiceState.DISCONNECTED;
    private ServiceCallback callback;

    public class LocalBinder extends Binder {
        public VoiceAssistantService getService() {
            return VoiceAssistantService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        actionHandler = new DeviceActionHandler(this);
        recordStreamer = new AudioRecordStreamer();
        audioPlayer = new AudioTrackPlayer();
        liveClient = new GeminiLiveClient();

        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SalonyAI::VoiceWakeLock");
        }

        setupListeners();
        createNotificationChannel();
    }

    private void setupListeners() {
        recordStreamer.setListener(new AudioRecordStreamer.AudioStreamListener() {
            @Override
            public void onAudioChunk(byte[] pcmData, String base64Data) {
                if (liveClient.isConnected()) {
                    liveClient.sendAudioChunk(base64Data);
                }
            }

            @Override
            public void onRmsVolume(float normalizedVolume) {
                if (currentState == VoiceState.LISTENING && callback != null) {
                    callback.onInputVolume(normalizedVolume);
                }
            }

            @Override
            public void onRecordError(String error) {
                if (callback != null) callback.onError(error);
            }
        });

        audioPlayer.setListener(new AudioTrackPlayer.PlaybackListener() {
            @Override
            public void onPlaybackVolume(float normalizedVolume) {
                if (currentState == VoiceState.SPEAKING && callback != null) {
                    callback.onOutputVolume(normalizedVolume);
                }
            }

            @Override
            public void onPlaybackFinished() {
                if (currentState == VoiceState.SPEAKING) {
                    setState(VoiceState.LISTENING);
                }
            }
        });

        liveClient.setListener(new GeminiLiveClient.LiveEventListener() {
            @Override
            public void onConnected() {
                setState(VoiceState.LISTENING);
            }

            @Override
            public void onDisconnected() {
                setState(VoiceState.DISCONNECTED);
                stopForeground(true);
            }

            @Override
            public void onAudioChunkReceived(byte[] pcmData) {
                setState(VoiceState.SPEAKING);
                audioPlayer.enqueueAudio(pcmData);
            }

            @Override
            public void onTranscriptReceived(String role, String text) {
                if (callback != null) {
                    callback.onTranscript(role, text);
                }
                // Check if response contains device action tags (e.g. [TORCH_ON], [OPEN_YOUTUBE])
                if ("model".equals(role)) {
                    actionHandler.parseAndExecuteTags(text);
                }
            }

            @Override
            public void onTurnComplete() {
                // Return to listening automatically
                if (currentState != VoiceState.SPEAKING) {
                    setState(VoiceState.LISTENING);
                }
            }

            @Override
            public void onInterrupted() {
                audioPlayer.interrupt();
                setState(VoiceState.LISTENING);
            }

            @Override
            public void onError(String message) {
                if (callback != null) callback.onError(message);
                setState(VoiceState.DISCONNECTED);
            }
        });
    }

    public void setCallback(ServiceCallback callback) {
        this.callback = callback;
    }

    public VoiceState getCurrentState() {
        return currentState;
    }

    public boolean isMuted() {
        return recordStreamer.isMuted();
    }

    public void setMuted(boolean muted) {
        recordStreamer.setMuted(muted);
    }

    public void interrupt() {
        audioPlayer.interrupt();
        if (currentState == VoiceState.SPEAKING) {
            setState(VoiceState.LISTENING);
        }
    }

    public void sendPrompt(String text) {
        if (liveClient.isConnected()) {
            liveClient.sendTextMessage(text);
        }
    }

    public synchronized void startSession(String voice, String serverUrl) {
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(10 * 60 * 1000L); // 10 minutes maximum safe hold
        }

        Notification notification = createNotification("Salony is active and listening…");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        setState(VoiceState.CONNECTING);
        audioPlayer.start();
        recordStreamer.start();

        liveClient.setVoice(voice);
        liveClient.connect(serverUrl);
    }

    public synchronized void stopSession() {
        recordStreamer.stop();
        audioPlayer.stop();
        liveClient.disconnect();

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        setState(VoiceState.DISCONNECTED);
        stopForeground(true);
        stopSelf();
    }

    private void setState(VoiceState state) {
        this.currentState = state;
        if (callback != null) {
            callback.onStateChanged(state);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Salony Voice Assistant",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background active voice session indicator");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification(String contentText) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SALONY AI Voice Assistant")
                .setContentText(contentText)
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        stopSession();
        super.onDestroy();
    }
}

package com.akstarcompany.salony.ai.voice;

import android.annotation.SuppressLint;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Base64;

import java.util.concurrent.atomic.AtomicBoolean;

public class AudioRecordStreamer {

    public interface AudioStreamListener {
        void onAudioChunk(byte[] pcmData, String base64Data);
        void onRmsVolume(float normalizedVolume);
        void onRecordError(String error);
    }

    public static final int SAMPLE_RATE = 16000;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private AudioRecord audioRecord;
    private final AtomicBoolean isRecording = new AtomicBoolean(false);
    private Thread recordingThread;
    private AudioStreamListener listener;
    private boolean isMuted = false;

    public void setListener(AudioStreamListener listener) {
        this.listener = listener;
    }

    public void setMuted(boolean muted) {
        this.isMuted = muted;
    }

    public boolean isMuted() {
        return isMuted;
    }

    public boolean isRecording() {
        return isRecording.get();
    }

    @SuppressLint("MissingPermission")
    public synchronized boolean start() {
        if (isRecording.get()) return true;

        int minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
        int bufferSize = Math.max(minBufferSize, 2048);

        try {
            audioRecord = new AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    SAMPLE_RATE,
                    CHANNEL_CONFIG,
                    AUDIO_FORMAT,
                    bufferSize
            );

            if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                if (listener != null) listener.onRecordError("AudioRecord initialization failed.");
                return false;
            }

            audioRecord.startRecording();
            isRecording.set(true);

            recordingThread = new Thread(this::recordLoop, "SalonyRecordThread");
            recordingThread.start();
            return true;
        } catch (Exception e) {
            if (listener != null) listener.onRecordError(e.getMessage());
            return false;
        }
    }

    private void recordLoop() {
        short[] shortBuffer = new short[1024];
        byte[] byteBuffer = new byte[2048];

        while (isRecording.get()) {
            int read = audioRecord.read(shortBuffer, 0, shortBuffer.length);
            if (read > 0) {
                // Calculate RMS volume
                double sum = 0;
                for (int i = 0; i < read; i++) {
                    short val = shortBuffer[i];
                    sum += val * val;
                    // convert to little-endian bytes
                    byteBuffer[i * 2] = (byte) (val & 0xFF);
                    byteBuffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
                }

                double rms = Math.sqrt(sum / read);
                float normalizedVol = Math.min(1.0f, (float) (rms / 6000.0));

                if (listener != null) {
                    if (isMuted) {
                        listener.onRmsVolume(0f);
                    } else {
                        listener.onRmsVolume(normalizedVol);
                        int byteLen = read * 2;
                        byte[] pcmChunk = new byte[byteLen];
                        System.arraycopy(byteBuffer, 0, pcmChunk, 0, byteLen);
                        String base64 = Base64.encodeToString(pcmChunk, Base64.NO_WRAP);
                        listener.onAudioChunk(pcmChunk, base64);
                    }
                }
            }
        }
    }

    public synchronized void stop() {
        isRecording.set(false);
        if (recordingThread != null) {
            recordingThread.interrupt();
            recordingThread = null;
        }
        if (audioRecord != null) {
            try {
                if (audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                    audioRecord.stop();
                }
                audioRecord.release();
            } catch (Exception ignored) {
            }
            audioRecord = null;
        }
    }
}

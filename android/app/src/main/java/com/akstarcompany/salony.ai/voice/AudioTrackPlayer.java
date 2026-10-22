package com.akstarcompany.salony.ai.voice;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

public class AudioTrackPlayer {

    public interface PlaybackListener {
        void onPlaybackVolume(float normalizedVolume);
        void onPlaybackFinished();
    }

    public static final int SAMPLE_RATE = 24000;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_OUT_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private AudioTrack audioTrack;
    private final BlockingQueue<byte[]> audioQueue = new LinkedBlockingQueue<>();
    private final AtomicBoolean isPlaying = new AtomicBoolean(false);
    private Thread playbackThread;
    private PlaybackListener listener;

    public void setListener(PlaybackListener listener) {
        this.listener = listener;
    }

    public synchronized void start() {
        if (isPlaying.get()) return;

        int minBufferSize = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
        int bufferSize = Math.max(minBufferSize, 4096);

        audioTrack = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build())
                .setAudioFormat(new AudioFormat.Builder()
                        .setEncoding(AUDIO_FORMAT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(CHANNEL_CONFIG)
                        .build())
                .setBufferSizeInBytes(bufferSize)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build();

        audioTrack.play();
        isPlaying.set(true);

        playbackThread = new Thread(this::playLoop, "SalonyPlayThread");
        playbackThread.start();
    }

    public void enqueueAudio(byte[] pcmData) {
        if (pcmData != null && isPlaying.get()) {
            audioQueue.offer(pcmData);
        }
    }

    private void playLoop() {
        while (isPlaying.get()) {
            try {
                byte[] chunk = audioQueue.poll(200, java.util.concurrent.TimeUnit.MILLISECONDS);
                if (chunk != null && audioTrack != null) {
                    audioTrack.write(chunk, 0, chunk.length);

                    // Compute RMS volume for visual orb animation
                    int numShorts = chunk.length / 2;
                    double sum = 0;
                    for (int i = 0; i < numShorts; i++) {
                        int low = chunk[i * 2] & 0xFF;
                        int high = chunk[i * 2 + 1];
                        short val = (short) ((high << 8) | low);
                        sum += val * val;
                    }
                    double rms = Math.sqrt(sum / (numShorts > 0 ? numShorts : 1));
                    float vol = Math.min(1.0f, (float) (rms / 8000.0));
                    if (listener != null) {
                        listener.onPlaybackVolume(vol);
                    }
                } else if (audioQueue.isEmpty() && isPlaying.get()) {
                    if (listener != null) {
                        listener.onPlaybackVolume(0f);
                    }
                }
            } catch (InterruptedException e) {
                break;
            }
        }
    }

    // Stop playback immediately upon interruption
    public synchronized void interrupt() {
        audioQueue.clear();
        if (audioTrack != null) {
            try {
                audioTrack.pause();
                audioTrack.flush();
                audioTrack.play();
            } catch (Exception ignored) {
            }
        }
        if (listener != null) {
            listener.onPlaybackVolume(0f);
        }
    }

    public synchronized void stop() {
        isPlaying.set(false);
        audioQueue.clear();
        if (playbackThread != null) {
            playbackThread.interrupt();
            playbackThread = null;
        }
        if (audioTrack != null) {
            try {
                audioTrack.stop();
                audioTrack.release();
            } catch (Exception ignored) {
            }
            audioTrack = null;
        }
        if (listener != null) {
            listener.onPlaybackVolume(0f);
            listener.onPlaybackFinished();
        }
    }
}

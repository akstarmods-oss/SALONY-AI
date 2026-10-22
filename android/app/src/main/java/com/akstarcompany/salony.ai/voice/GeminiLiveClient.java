package com.akstarcompany.salony.ai.voice;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class GeminiLiveClient {

    private static final String TAG = "GeminiLiveClient";

    public interface LiveEventListener {
        void onConnected();
        void onDisconnected();
        void onAudioChunkReceived(byte[] pcmData);
        void onTranscriptReceived(String role, String text);
        void onTurnComplete();
        void onInterrupted();
        void onError(String message);
    }

    private final OkHttpClient httpClient;
    private WebSocket webSocket;
    private LiveEventListener listener;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isConnected = false;
    private String currentVoice = "Kore";

    public GeminiLiveClient() {
        this.httpClient = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .pingInterval(20, TimeUnit.SECONDS)
                .build();
    }

    public void setListener(LiveEventListener listener) {
        this.listener = listener;
    }

    public void setVoice(String voice) {
        this.currentVoice = voice;
    }

    public boolean isConnected() {
        return isConnected;
    }

    public synchronized void connect(String serverUrl) {
        if (webSocket != null) {
            disconnect();
        }

        String targetUrl = serverUrl;
        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            // Default to local proxy / standard development route
            targetUrl = "ws://10.0.2.2:3000/live";
        }

        Request request = new Request.Builder()
                .url(targetUrl)
                .build();

        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                isConnected = true;
                Log.d(TAG, "Connected to Gemini Live");
                sendInitialSetup();
                mainHandler.post(() -> {
                    if (listener != null) listener.onConnected();
                });
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                handleIncomingMessage(text);
            }

            @Override
            public void onClosing(WebSocket ws, int code, String reason) {
                ws.close(1000, null);
                isConnected = false;
                mainHandler.post(() -> {
                    if (listener != null) listener.onDisconnected();
                });
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                isConnected = false;
                Log.e(TAG, "WebSocket failure: " + t.getMessage());
                mainHandler.post(() -> {
                    if (listener != null) {
                        listener.onError("Connection error: " + (t.getMessage() != null ? t.getMessage() : "Failed to connect to voice server"));
                        listener.onDisconnected();
                    }
                });
            }
        });
    }

    // Send setup configuration
    private void sendInitialSetup() {
        try {
            JsonObject setup = new JsonObject();
            JsonObject setupObj = new JsonObject();
            setupObj.addProperty("model", "models/gemini-2.0-flash-exp");

            JsonObject genConfig = new JsonObject();
            JsonObject speechConfig = new JsonObject();
            JsonObject voiceConfig = new JsonObject();
            JsonObject prebuiltVoice = new JsonObject();
            prebuiltVoice.addProperty("voiceName", currentVoice != null ? currentVoice : "Kore");
            voiceConfig.add("prebuiltVoiceConfig", prebuiltVoice);
            speechConfig.add("voiceConfig", voiceConfig);
            genConfig.add("speechConfig", speechConfig);

            setupObj.add("generationConfig", genConfig);
            setup.add("setup", setupObj);

            if (webSocket != null) {
                webSocket.send(setup.toString());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending setup: " + e.getMessage());
        }
    }

    // Stream 16kHz PCM audio chunk to Gemini
    public void sendAudioChunk(String base64Data) {
        if (!isConnected || webSocket == null) return;

        try {
            JsonObject mediaChunk = new JsonObject();
            mediaChunk.addProperty("mimeType", "audio/pcm;rate=16000");
            mediaChunk.addProperty("data", base64Data);

            JsonArray chunks = new JsonArray();
            chunks.add(mediaChunk);

            JsonObject realtimeInput = new JsonObject();
            realtimeInput.add("mediaChunks", chunks);

            JsonObject root = new JsonObject();
            root.add("realtimeInput", realtimeInput);

            webSocket.send(root.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error sending audio: " + e.getMessage());
        }
    }

    // Send text prompt into the live session
    public void sendTextMessage(String text) {
        if (!isConnected || webSocket == null) return;

        try {
            JsonObject part = new JsonObject();
            part.addProperty("text", text);

            JsonArray parts = new JsonArray();
            parts.add(part);

            JsonObject content = new JsonObject();
            content.add("parts", parts);

            JsonObject clientContent = new JsonObject();
            JsonArray turns = new JsonArray();
            turns.add(content);
            clientContent.add("turns", turns);
            clientContent.addProperty("turnComplete", true);

            JsonObject root = new JsonObject();
            root.add("clientContent", clientContent);

            webSocket.send(root.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error sending text: " + e.getMessage());
        }
    }

    private void handleIncomingMessage(String text) {
        try {
            JsonObject root = JsonParser.parseString(text).getAsJsonObject();

            // Check serverContent
            if (root.has("serverContent")) {
                JsonObject serverContent = root.getAsJsonObject("serverContent");

                // Check modelTurn parts
                if (serverContent.has("modelTurn")) {
                    JsonObject modelTurn = serverContent.getAsJsonObject("modelTurn");
                    if (modelTurn.has("parts")) {
                        JsonArray parts = modelTurn.getAsJsonArray("parts");
                        for (JsonElement el : parts) {
                            JsonObject part = el.getAsJsonObject();

                            // Audio part
                            if (part.has("inlineData")) {
                                JsonObject inlineData = part.getAsJsonObject("inlineData");
                                String mimeType = inlineData.get("mimeType").getAsString();
                                if (mimeType.contains("audio/pcm")) {
                                    String b64 = inlineData.get("data").getAsString();
                                    byte[] pcm = Base64.decode(b64, Base64.NO_WRAP);
                                    mainHandler.post(() -> {
                                        if (listener != null) listener.onAudioChunkReceived(pcm);
                                    });
                                }
                            }

                            // Text transcript part
                            if (part.has("text")) {
                                String transcript = part.get("text").getAsString();
                                mainHandler.post(() -> {
                                    if (listener != null) listener.onTranscriptReceived("model", transcript);
                                });
                            }
                        }
                    }
                }

                // Check turnComplete
                if (serverContent.has("turnComplete") && serverContent.get("turnComplete").getAsBoolean()) {
                    mainHandler.post(() -> {
                        if (listener != null) listener.onTurnComplete();
                    });
                }

                // Check interrupted
                if (serverContent.has("interrupted") && serverContent.get("interrupted").getAsBoolean()) {
                    mainHandler.post(() -> {
                        if (listener != null) listener.onInterrupted();
                    });
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing message: " + e.getMessage());
        }
    }

    public synchronized void disconnect() {
        if (webSocket != null) {
            try {
                webSocket.close(1000, "User closed session");
            } catch (Exception ignored) {
            }
            webSocket = null;
        }
        isConnected = false;
        mainHandler.post(() -> {
            if (listener != null) listener.onDisconnected();
        });
    }
}

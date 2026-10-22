package com.akstarcompany.salony.ai.ui;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.LinearInterpolator;

import androidx.annotation.Nullable;

import com.akstarcompany.salony.ai.model.VoiceState;

public class AiOrbView extends View {

    private final Paint orbPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint arcPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private VoiceState currentState = VoiceState.DISCONNECTED;
    private float audioVolume = 0f;
    private float targetVolume = 0f;
    private float rotationAngle = 0f;
    private float pulsePhase = 0f;

    private ValueAnimator rotationAnimator;
    private ValueAnimator pulseAnimator;

    // Color definitions
    private int primaryColor = Color.parseColor("#475569"); // Disconnected slate
    private int secondaryColor = Color.parseColor("#1e293b");
    private int glowColor = Color.parseColor("#33475569");

    public AiOrbView(Context context) {
        super(context);
        init();
    }

    public AiOrbView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public AiOrbView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        ringPaint.setStyle(Paint.Style.STROKE);
        ringPaint.setStrokeWidth(3f);

        arcPaint.setStyle(Paint.Style.STROKE);
        arcPaint.setStrokeWidth(4f);
        arcPaint.setStrokeCap(Paint.Cap.ROUND);

        // Continuous rotation animator
        rotationAnimator = ValueAnimator.ofFloat(0f, 360f);
        rotationAnimator.setDuration(8000);
        rotationAnimator.setRepeatCount(ValueAnimator.INFINITE);
        rotationAnimator.setInterpolator(new LinearInterpolator());
        rotationAnimator.addUpdateListener(anim -> {
            rotationAngle = (float) anim.getAnimatedValue();
            invalidate();
        });

        // Breathing / pulse animator
        pulseAnimator = ValueAnimator.ofFloat(0f, (float) (Math.PI * 2));
        pulseAnimator.setDuration(2400);
        pulseAnimator.setRepeatCount(ValueAnimator.INFINITE);
        pulseAnimator.setInterpolator(new LinearInterpolator());
        pulseAnimator.addUpdateListener(anim -> {
            pulsePhase = (float) anim.getAnimatedValue();
            // Smooth volume damping
            audioVolume += (targetVolume - audioVolume) * 0.25f;
            invalidate();
        });

        rotationAnimator.start();
        pulseAnimator.start();
    }

    public void setVoiceState(VoiceState state) {
        this.currentState = state;
        updateColorsForState();
        invalidate();
    }

    public void setAudioVolume(float volume) {
        this.targetVolume = Math.max(0f, Math.min(1f, volume));
    }

    private void updateColorsForState() {
        switch (currentState) {
            case CONNECTING:
                primaryColor = Color.parseColor("#f59e0b");
                secondaryColor = Color.parseColor("#d97706");
                glowColor = Color.parseColor("#44f59e0b");
                break;
            case LISTENING:
                primaryColor = Color.parseColor("#06b6d4");
                secondaryColor = Color.parseColor("#0284c7");
                glowColor = Color.parseColor("#5506b6d4");
                break;
            case THINKING:
                primaryColor = Color.parseColor("#a855f7");
                secondaryColor = Color.parseColor("#6366f1");
                glowColor = Color.parseColor("#66a855f7");
                break;
            case SPEAKING:
                primaryColor = Color.parseColor("#ec4899");
                secondaryColor = Color.parseColor("#a855f7");
                glowColor = Color.parseColor("#77ec4899");
                break;
            case DISCONNECTED:
            default:
                primaryColor = Color.parseColor("#64748b");
                secondaryColor = Color.parseColor("#334155");
                glowColor = Color.parseColor("#2264748b");
                break;
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float baseRadius = Math.min(cx, cy) * 0.45f;

        // Dynamic expansion factoring in breathing and live speech amplitude
        float breath = (float) Math.sin(pulsePhase) * 6f;
        float audioBoost = audioVolume * (baseRadius * 0.35f);
        float currentRadius = baseRadius + breath + audioBoost;

        // 1. Draw outer ambient halo
        glowPaint.setColor(glowColor);
        canvas.drawCircle(cx, cy, currentRadius * 1.5f, glowPaint);

        // 2. Draw dynamic pulsing audio wave rings
        if (currentState == VoiceState.LISTENING || currentState == VoiceState.SPEAKING) {
            ringPaint.setColor(primaryColor);
            ringPaint.setAlpha((int) (80 + audioVolume * 150));
            canvas.drawCircle(cx, cy, currentRadius * (1.15f + audioVolume * 0.2f), ringPaint);

            ringPaint.setColor(secondaryColor);
            ringPaint.setAlpha((int) (50 + audioVolume * 120));
            canvas.drawCircle(cx, cy, currentRadius * (1.3f + audioVolume * 0.35f), ringPaint);
        }

        // 3. Draw rotating orbital arcs
        canvas.save();
        canvas.rotate(rotationAngle, cx, cy);
        arcPaint.setColor(primaryColor);
        arcPaint.setAlpha(180);
        float arcRadius = currentRadius * 1.08f;
        canvas.drawArc(cx - arcRadius, cy - arcRadius, cx + arcRadius, cy + arcRadius, 0, 70, false, arcPaint);
        canvas.drawArc(cx - arcRadius, cy - arcRadius, cx + arcRadius, cy + arcRadius, 180, 70, false, arcPaint);
        canvas.restore();

        // 4. Draw central 3D radial gradient sphere
        RadialGradient gradient = new RadialGradient(
                cx - currentRadius * 0.3f,
                cy - currentRadius * 0.35f,
                currentRadius * 1.3f,
                new int[]{Color.WHITE, primaryColor, secondaryColor, Color.BLACK},
                new float[]{0.0f, 0.35f, 0.75f, 1.0f},
                Shader.TileMode.CLAMP
        );
        orbPaint.setShader(gradient);
        canvas.drawCircle(cx, cy, currentRadius, orbPaint);
    }

    @Override
    protected void onDetachedFromWindow() {
        if (rotationAnimator != null) rotationAnimator.cancel();
        if (pulseAnimator != null) pulseAnimator.cancel();
        super.onDetachedFromWindow();
    }
}

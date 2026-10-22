package com.akstarcompany.salony.ai.actions;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.Settings;
import android.widget.Toast;

import java.util.List;

public class DeviceActionHandler {

    private final Context context;
    private static boolean isTorchOn = false;

    public DeviceActionHandler(Context context) {
        this.context = context.getApplicationContext();
    }

    public boolean isTorchOn() {
        return isTorchOn;
    }

    /**
     * Parse assistant response text for actionable tags like [TORCH_ON], [TORCH_OFF],
     * [OPEN_YOUTUBE], [OPEN_WHATSAPP]
     */
    public boolean parseAndExecuteTags(String text) {
        if (text == null) return false;
        boolean handled = false;

        if (text.contains("[TORCH_ON]")) {
            setTorch(true);
            handled = true;
        } else if (text.contains("[TORCH_OFF]")) {
            setTorch(false);
            handled = true;
        }

        if (text.contains("[OPEN_YOUTUBE]")) {
            openYouTube();
            handled = true;
        }

        if (text.contains("[OPEN_WHATSAPP]")) {
            openWhatsApp();
            handled = true;
        }

        return handled;
    }

    // Toggle camera flashlight
    public boolean setTorch(boolean enable) {
        CameraManager cameraManager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
        if (cameraManager == null) return false;

        try {
            String[] cameraIds = cameraManager.getCameraIdList();
            for (String id : cameraIds) {
                CameraCharacteristics chars = cameraManager.getCameraCharacteristics(id);
                Boolean hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);

                if (hasFlash != null && hasFlash && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    cameraManager.setTorchMode(id, enable);
                    isTorchOn = enable;
                    showToast(enable ? "Flashlight turned ON" : "Flashlight turned OFF");
                    return true;
                }
            }
        } catch (CameraAccessException | IllegalArgumentException | SecurityException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Open YouTube app or browser fallback
    public void openYouTube() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube:"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (intent.resolveActivity(context.getPackageManager()) != null) {
            context.startActivity(intent);
        } else {
            openWebsite("https://www.youtube.com");
        }
    }

    // Open WhatsApp app or browser fallback
    public void openWhatsApp() {
        PackageManager pm = context.getPackageManager();
        Intent intent = pm.getLaunchIntentForPackage("com.whatsapp");
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } else {
            openWebsite("https://web.whatsapp.com");
        }
    }

    // Open any installed app by name
    public boolean openAppByName(String appName) {
        if (appName == null || appName.trim().isEmpty()) return false;
        String query = appName.trim().toLowerCase();

        PackageManager pm = context.getPackageManager();
        Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
        mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> apps = pm.queryIntentActivities(mainIntent, 0);
        for (ResolveInfo ri : apps) {
            String label = ri.loadLabel(pm).toString().toLowerCase();
            String packageName = ri.activityInfo.packageName.toLowerCase();

            if (label.contains(query) || packageName.contains(query)) {
                Intent launchIntent = pm.getLaunchIntentForPackage(ri.activityInfo.packageName);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(launchIntent);
                    showToast("Opening " + ri.loadLabel(pm));
                    return true;
                }
            }
        }
        showToast("App not found: " + appName);
        return false;
    }

    // Open Website URL
    public boolean openWebsite(String url) {
        if (url == null || url.trim().isEmpty()) return false;
        String cleanUrl = url.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            showToast("Cannot open website");
            return false;
        }
    }

    // Open System Settings screen
    public void openSettings(String type) {
        String action;
        if (type == null) type = "main";
        switch (type.toLowerCase()) {
            case "wifi":
                action = Settings.ACTION_WIFI_SETTINGS;
                break;
            case "bluetooth":
                action = Settings.ACTION_BLUETOOTH_SETTINGS;
                break;
            case "sound":
                action = Settings.ACTION_SOUND_SETTINGS;
                break;
            case "display":
                action = Settings.ACTION_DISPLAY_SETTINGS;
                break;
            case "app":
                action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS;
                break;
            default:
                action = Settings.ACTION_SETTINGS;
                break;
        }

        Intent intent;
        if (Settings.ACTION_APPLICATION_DETAILS_SETTINGS.equals(action)) {
            intent = new Intent(action, Uri.parse("package:" + context.getPackageName()));
        } else {
            intent = new Intent(action);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
        } catch (Exception e) {
            showToast("Cannot open settings");
        }
    }

    // Set an Alarm
    public boolean setAlarm(int hour, int minutes, String message) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
            intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
            intent.putExtra(AlarmClock.EXTRA_MINUTES, minutes);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, message != null ? message : "Salony Alarm");
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            showToast("Alarm scheduled for " + hour + ":" + (minutes < 10 ? "0" : "") + minutes);
            return true;
        } catch (Exception e) {
            showToast("Cannot schedule alarm");
            return false;
        }
    }

    // Open dialer with phone number
    public void dialPhone(String phoneNumber) {
        try {
            Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phoneNumber.trim()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            showToast("Cannot open phone dialer");
        }
    }

    // Prepare SMS
    public void prepareSms(String phoneNumber, String message) {
        try {
            Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + (phoneNumber != null ? phoneNumber : "")));
            if (message != null) {
                intent.putExtra("sms_body", message);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            showToast("Cannot prepare SMS");
        }
    }

    private void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
}

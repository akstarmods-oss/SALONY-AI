# Proguard rules for Salony AI
-keep class com.akstarcompany.salony.ai.model.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

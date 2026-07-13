# =============================================================
# ProGuard / R8 Rules
# Optimized for minimum binary size
# =============================================================

# Discard debugging information
-keepattributes SourceFile,LineNumberTable

# Keep attributes required for reflection/annotations
-keepattributes *Annotation*,Signature,Exceptions,InnerClasses,EnclosingMethod

# Keep native methods (JNI bindings)
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep BuildConfig
-keep class **.BuildConfig { *; }

# ─── React Native Core ───────────────────────────────────────
# Keep react annotation methods (for ViewManager props mapping)
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}
-keep class * extends com.facebook.react.uimanager.ViewManager
-keep class * extends com.facebook.react.ReactPackage
-keep class com.facebook.react.bridge.Systrace { *; }
-keep class com.facebook.react.devsupport.JSCHeapCapture { *; }

# ─── Hermes JS Engine ────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-dontwarn com.facebook.hermes.unicode.**

# ─── Suppress harmless warnings from third-party libraries ───
-dontwarn com.facebook.react.**
-dontwarn expo.**
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
-dontwarn io.socket.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe

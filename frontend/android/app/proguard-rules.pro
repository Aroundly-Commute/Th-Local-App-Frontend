# =============================================================
# ProGuard / R8 Rules
# React Native + Expo + Firebase + Google Sign-In + Maps
# =============================================================

# ─── React Native Core ───────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ─── React Native New Architecture (TurboModules / Fabric) ───
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# ─── Reanimated ──────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# ─── Expo ────────────────────────────────────────────────────
-keep class expo.** { *; }
-keep class versioned.host.exp.exponent.** { *; }
-dontwarn expo.**

# ─── Firebase App ────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ─── Firebase Crashlytics ────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.crashlytics.**

# ─── Firebase Analytics ──────────────────────────────────────
-keep class com.google.android.gms.measurement.** { *; }

# ─── Google Sign-In ──────────────────────────────────────────
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# ─── React Native Maps / Google Maps ─────────────────────────
-keep class com.google.android.gms.maps.** { *; }
-keep class com.airbnb.android.react.maps.** { *; }

# ─── AsyncStorage ────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── React Native Gesture Handler ────────────────────────────
-keep class com.swmansion.gesturehandler.** { *; }

# ─── React Native Safe Area Context ─────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ─── React Native Screens ────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ─── React Native SVG ────────────────────────────────────────
-keep class com.horcrux.svg.** { *; }

# ─── React Native WebView ────────────────────────────────────
-keep class com.reactnativecommunity.webview.** { *; }

# ─── Socket.IO ───────────────────────────────────────────────
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# ─── OkHttp / Networking ─────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ─── General: Reflection & Serialization ─────────────────────
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep native methods
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

# Suppress common harmless warnings
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe


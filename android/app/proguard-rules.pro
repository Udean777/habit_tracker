# Flutter Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# GSON rules - https://github.com/google/gson/blob/master/examples/android-proguard-example/proguard.cfg
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.** { *; }
-keep class com.google.gson.examples.android.model.** { *; }

# WorkManager
-keep class androidx.work.** { *; }
-keepclassmembers class androidx.work.** { *; }
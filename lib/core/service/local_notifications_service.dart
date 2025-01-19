import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

/// Kelas layanan untuk menangani notifikasi lokal untuk pengingat kebiasaan.
class LocalNotificationService {
  /// Instance tunggal dari [LocalNotificationService].
  static final LocalNotificationService _instance =
      LocalNotificationService._();

  /// Konstruktor pabrik untuk mengembalikan instance tunggal.
  factory LocalNotificationService() => _instance;

  /// Konstruktor bernama privat untuk pola singleton.
  LocalNotificationService._();

  /// Instance dari [FlutterLocalNotificationsPlugin] untuk mengelola notifikasi.
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  /// Menginisialisasi layanan notifikasi dengan pengaturan yang diperlukan.
  ///
  /// Metode ini mengatur pengaturan notifikasi untuk Android dan iOS.
  Future<void> initialize() async {
    tz.initializeTimeZones();

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(initSettings);
  }

  /// Menjadwalkan pengingat notifikasi untuk kebiasaan.
  ///
  /// [habitId] digunakan untuk mengidentifikasi notifikasi secara unik.
  /// [title] dan [description] adalah konten notifikasi.
  /// [reminderTime] adalah waktu dalam format HH:mm untuk memicu notifikasi.
  Future<void> scheduleHabitReminder({
    required int habitId,
    required String title,
    required String description,
    required String reminderTime,
  }) async {
    // Memisahkan waktu pengingat menjadi jam dan menit.
    final timeParts = reminderTime.split(':');
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);

    // Membuat objek DateTime untuk waktu notifikasi yang dijadwalkan hari ini.
    final now = DateTime.now();
    var scheduledDate = DateTime(
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );

    // Jika waktu yang dijadwalkan sudah lewat hari ini, jadwalkan untuk besok.
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    // Detail notifikasi untuk Android.
    final androidDetails = AndroidNotificationDetails(
      'The Habits',
      'Your Habit:',
      channelDescription: 'Pengingat harian untuk kebiasaan Anda',
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(description),
      playSound: true,
      enableVibration: true,
    );

    // Detail notifikasi untuk iOS.
    final iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Menjadwalkan notifikasi untuk dipicu pada waktu yang ditentukan.
    await _notifications.zonedSchedule(
      habitId,
      title,
      description,
      tz.TZDateTime.from(scheduledDate, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time, // Ulangi setiap hari
    );
  }

  /// Membatalkan notifikasi yang dijadwalkan untuk kebiasaan tertentu.
  ///
  /// [habitId] digunakan untuk mengidentifikasi notifikasi yang akan dibatalkan.
  Future<void> cancelHabitReminder(int habitId) async {
    await _notifications.cancel(habitId);
  }
}

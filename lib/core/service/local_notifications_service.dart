import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'dart:developer' as developer;

class LocalNotificationService {
  static final LocalNotificationService _instance =
      LocalNotificationService._();

  factory LocalNotificationService() => _instance;

  LocalNotificationService._();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  Future<void> initialize() async {
    try {
      tz.initializeTimeZones();

      // Default to UTC timezone
      final String timeZoneName = 'UTC';
      tz.setLocalLocation(tz.getLocation(timeZoneName));

      const AndroidInitializationSettings androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const DarwinInitializationSettings iosSettings =
          DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      final initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _notifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTap,
        onDidReceiveBackgroundNotificationResponse:
            _onBackgroundNotificationTap,
      );

      // Create Android notification channel
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'the_habits_channel',
        'Habit Reminders',
        description: 'Channel for habit reminder notifications',
        importance: Importance.high,
        playSound: true,
      );

      await _notifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);

      _isInitialized = true;
    } catch (e, stack) {
      developer.log('Notification Error: $e\n$stack');
      _isInitialized = false;
    }
  }

  void _onNotificationTap(NotificationResponse notificationResponse) {
    // developer.log('Notification tapped: ${notificationResponse.payload}',
    //     name: 'LocalNotificationService');
  }

  @pragma('vm:entry-point')
  static void _onBackgroundNotificationTap(
      NotificationResponse notificationResponse) {
    // developer.log(
    //     'Background notification tapped: ${notificationResponse.payload}',
    //     name: 'LocalNotificationService');
  }

  Future<void> cancelHabitReminder(int habitId) async {
    try {
      // developer.log('Attempting to cancel habit reminder for habitId: $habitId',
      //     name: 'LocalNotificationService');

      if (!_isInitialized) {
        // developer.log(
        //     'Notification service not initialized, attempting to initialize',
        //     name: 'LocalNotificationService');
        await initialize();
      }

      await _notifications.cancel(habitId);

      // developer.log('Habit reminder cancelled for habitId: $habitId',
      //     name: 'LocalNotificationService');
    } catch (e) {
      // developer.log('Error cancelling habit reminder',
      //     name: 'LocalNotificationService', error: e, stackTrace: stackTrace);
      rethrow;
    }
  }

  Future<void> scheduleHabitReminder({
    required int habitId,
    required String title,
    required String description,
    required String reminderTime,
  }) async {
    if (!_isInitialized) await initialize();

    final timeParts = reminderTime.split(':');
    final hour = int.parse(timeParts[0]);
    final minute = int.parse(timeParts[1]);

    // Create scheduled time in device's local time
    final now = DateTime.now();
    var scheduledDate = DateTime(now.year, now.month, now.day, hour, minute);

    // Adjust to next day if time has passed
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    // Convert to TZDateTime in UTC
    final utcTime = scheduledDate.toUtc();
    final tzScheduledDate = tz.TZDateTime.from(utcTime, tz.UTC);

    const androidDetails = AndroidNotificationDetails(
      'the_habits_channel',
      'Habit Reminders',
      channelDescription: 'Channel for habit reminder notifications',
      importance: Importance.high,
      priority: Priority.high,
      enableVibration: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    await _notifications.zonedSchedule(
      habitId,
      title,
      description,
      tzScheduledDate,
      const NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: 'habit-$habitId',
    );
  }
}

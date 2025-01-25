import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
// import 'dart:developer' as developer;

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
      // developer.log('Starting notification service initialization',
      //     name: 'LocalNotificationService');

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

      final result = await _notifications.initialize(initSettings,
          onDidReceiveNotificationResponse: _onNotificationTap,
          onDidReceiveBackgroundNotificationResponse:
              _onBackgroundNotificationTap);

      _isInitialized = result ?? false;

      // developer.log(
      //     'Notification service initialization result: $_isInitialized',
      //     name: 'LocalNotificationService');
    } catch (e) {
      // developer.log('Notification service initialization error',
      //     name: 'LocalNotificationService', error: e, stackTrace: stackTrace);
      _isInitialized = false;
      rethrow;
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
    try {
      // developer.log(
      //     'Scheduling habit reminder - habitId: $habitId, title: $title, time: $reminderTime',
      //     name: 'LocalNotificationService');

      if (!_isInitialized) {
        // developer.log(
        //     'Notification service not initialized, attempting to initialize',
        //     name: 'LocalNotificationService');
        await initialize();
      }

      final timeParts = reminderTime.split(':');
      final hour = int.parse(timeParts[0]);
      final minute = int.parse(timeParts[1]);

      final now = DateTime.now();
      var scheduledDate = DateTime(now.year, now.month, now.day, hour, minute);

      if (scheduledDate.isBefore(now)) {
        scheduledDate = scheduledDate.add(const Duration(days: 1));
      }

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

      final iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      final details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _notifications.zonedSchedule(
        habitId,
        title,
        description,
        tz.TZDateTime.from(scheduledDate, tz.local),
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );

      // developer.log('Scheduled habit reminder',
      //     name: 'LocalNotificationService');
    } catch (e) {
      // developer.log('Error scheduling habit reminder',
      //     name: 'LocalNotificationService', error: e, stackTrace: stackTrace);
      rethrow;
    }
  }
}

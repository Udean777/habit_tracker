import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/service/local_notifications_service.dart';
import 'package:the_habits/presentation/main_page.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final database = AppDatabase();
  await LocalNotificationService().initialize();
  await dotenv.load(fileName: ".env");

  // Placed here so users can allow it the first time they open the app
  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
  }

  // Same as above permission
  if (await Permission.scheduleExactAlarm.isDenied) {
    await Permission.scheduleExactAlarm.request();
  }

  runApp(
    ProviderScope(
      overrides: [
        databaseProvider.overrideWithValue(database),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'The Habits',
      debugShowCheckedModeBanner: false,
      darkTheme: FlexThemeData.dark(
        scheme: FlexScheme.blackWhite,
      ),
      themeMode: ThemeMode.dark,
      home: const MainPage(),
    );
  }
}

import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:habit_tracker/core/database/database.dart';
import 'package:habit_tracker/core/providers/database_provider.dart';
import 'package:habit_tracker/core/service/local_notifications_service.dart';
import 'package:habit_tracker/presentation/home/main_page.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final database = AppDatabase();
  await LocalNotificationService().initialize();

  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
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

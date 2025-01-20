import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:the_habits/core/database/chat_database.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/chat_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/service/local_notifications_service.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:the_habits/presentation/splash/splash_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi database dan layanan lainnya
  final database = AppDatabase();
  final chatDatabase = ChatDatabase();
  await LocalNotificationService().initialize();
  await dotenv.load(fileName: ".env");

  // Meminta izin notifikasi
  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
  }

  if (await Permission.scheduleExactAlarm.isDenied) {
    await Permission.scheduleExactAlarm.request();
  }

  runApp(
    ProviderScope(
      overrides: [
        databaseProvider.overrideWithValue(database),
        chatDatabaseProvider.overrideWithValue(chatDatabase),
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
      home: const SplashPage(),
    );
  }
}

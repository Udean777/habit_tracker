import 'dart:io';

import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:the_habits/core/database/chat_database.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/chat_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/providers/theme_provider.dart';
import 'package:the_habits/core/service/local_notifications_service.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:the_habits/presentation/splash/splash_page.dart';

Future<void> checkAndroidPermissions() async {
  if (Platform.isAndroid) {
    final status = await Permission.notification.status;
    if (!status.isGranted) {
      await Permission.notification.request();
    }
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi database dan layanan lainnya
  final database = AppDatabase();
  final chatDatabase = ChatDatabase();
  await LocalNotificationService().initialize();
  await dotenv.load(fileName: ".env");

  // Meminta izin notifikasi
  await checkAndroidPermissions();

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

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'The Habits',
      debugShowCheckedModeBanner: false,
      darkTheme: FlexThemeData.dark(
        scheme: FlexScheme.blue,
        textTheme: GoogleFonts.plusJakartaSansTextTheme(),
      ),
      theme: FlexThemeData.light(
        scheme: FlexScheme.bahamaBlue,
        textTheme: GoogleFonts.plusJakartaSansTextTheme(),
      ),
      themeMode: themeMode,
      home: const SplashPage(),
    );
  }
}

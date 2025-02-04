import 'dart:io';

import 'package:permission_handler/permission_handler.dart';

Future<void> checkPermissions() async {
  if (Platform.isAndroid) {
    final status = await Permission.notification.status;
    if (!status.isGranted) {
      await Permission.notification.request();
    }
  } else if (Platform.isIOS) {
    final status = await Permission.notification.status;
    if (!status.isGranted) {
      await Permission.notification.request();
    }
  }
}

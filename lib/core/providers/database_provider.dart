import 'package:the_habits/core/database/database.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Mendefinisikan provider untuk AppDatabase menggunakan Riverpod.
/// Provider ini akan melempar UnimplementedError karena AppDatabase belum diimplementasikan.
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('AppDatabase is not implemented yet');
});

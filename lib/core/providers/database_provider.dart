import 'package:habit_tracker/core/database/database.dart';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Mendefinisikan provider untuk AppDatabase menggunakan Riverpod.
/// Provider ini akan melempar UnimplementedError karena AppDatabase belum diimplementasikan.
final databaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('AppDatabase is not implemented yet');
});

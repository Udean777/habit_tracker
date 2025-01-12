import 'package:habit_tracker/core/providers/database_provider.dart';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Mendefinisikan `dailySummaryProvider` sebagai `StreamProvider`
/// yang menggunakan `family` untuk menerima parameter `DateTime`.
/// Provider ini mengembalikan stream dari tuple `(int completedTasks, int totalTasks)`.
final dailySummaryProvider =
    StreamProvider.family<(int completedTasks, int totalTasks), DateTime>(
        (ref, date) {
  /// Mengambil instance `databaseProvider` dari `ref` untuk mengakses database.
  final database = ref.watch(databaseProvider);

  /// Mengembalikan stream yang mengawasi ringkasan harian berdasarkan tanggal yang diberikan.
  return database.watchDailySummary(date);
});

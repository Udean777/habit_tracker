import 'package:habit_tracker/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final dailySummaryProvider =
    StreamProvider.family<(int completedTasks, int totalTasks), DateTime>(
        (ref, date) {
  final database = ref.watch(databaseProvider);

  return database.watchDailySummary(date);
});

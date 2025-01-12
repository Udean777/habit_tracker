import 'package:habit_tracker/core/database/database.dart';
import 'package:habit_tracker/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final habitsForDateProvider =
    StreamProvider.family<List<HabitWithCompletion>, DateTime>((ref, date) {
  final databse = ref.watch(databaseProvider);
  return databse.watchHabitsWithDate(date);
});

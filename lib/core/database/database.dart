import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:habit_tracker/core/database/tables.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:rxdart/rxdart.dart';

part 'database.g.dart';

// Mendefinisikan kelas database dengan Drift
@DriftDatabase(tables: [Habits, HabitCompletions])
class AppDatabase extends _$AppDatabase {
  // Konstruktor untuk membuka koneksi database
  AppDatabase() : super(_openConnection());

  // Mendefinisikan versi skema database
  @override
  int get schemaVersion => 1;

  // Mendapatkan daftar semua kebiasaan
  Future<List<Habit>> getHabits() => select(habits).get();

  // Mengamati perubahan pada daftar kebiasaan
  Stream<List<Habit>> watchHabits() => select(habits).watch();

  // Membuat kebiasaan baru
  Future<int> createHabit(HabitsCompanion habit) => into(habits).insert(habit);

  // Menyelesaikan kebiasaan pada tanggal tertentu
  Future<void> completeHabit(int habitId, DateTime selectedDate) async {
    await transaction(() async {
      // Mendefinisikan awal dan akhir hari
      final startOfDay =
          DateTime(selectedDate.year, selectedDate.month, selectedDate.day);
      final endOfDay = DateTime(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
        23,
        59,
        59,
        999,
      );

      // Memeriksa apakah kebiasaan sudah diselesaikan pada hari tersebut
      final existingCompletion = await (select(habitCompletions)
            ..where((t) =>
                t.habitId.equals(habitId) &
                t.completedAt
                    .isBetween(Variable(startOfDay), Variable(endOfDay))))
          .get();

      // Jika belum diselesaikan, tambahkan penyelesaian baru
      if (existingCompletion.isEmpty) {
        await into(habitCompletions).insert(HabitCompletionsCompanion(
          habitId: Value(habitId),
          completedAt: Value(selectedDate),
        ));

        // Perbarui streak dan total penyelesaian kebiasaan
        final habit = await (select(habits)..where((t) => t.id.equals(habitId)))
            .getSingle();
        await update(habits).replace(habit
            .copyWith(
              streak: habit.streak + 1,
              totalCompletions: habit.totalCompletions + 1,
            )
            .toCompanion(true));
      }
    });
  }

  // Mengamati ringkasan harian untuk tanggal tertentu
  Stream<(int, int)> watchDailySummary(DateTime date) {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = DateTime(
      date.year,
      date.month,
      date.day,
      23,
      59,
      59,
      999,
    );

    // Mengamati penyelesaian kebiasaan pada hari tersebut
    final completionsStream = (select(habitCompletions)
          ..where((t) => t.completedAt
              .isBetween(Variable(startOfDay), Variable(endOfDay))))
        .watch();

    // Mengamati kebiasaan dengan tanggal tertentu
    final habitsStream = watchHabitsWithDate(date);

    // Menggabungkan dua stream untuk mendapatkan ringkasan harian
    return Rx.combineLatest2(completionsStream, habitsStream,
        (completions, habits) => (completions.length, habits.length));
  }

  // Mengamati kebiasaan dengan tanggal tertentu
  Stream<List<HabitWithCompletion>> watchHabitsWithDate(DateTime date) {
    final startOfDay = DateTime(date.year, date.month, date.day);
    final endOfDay = DateTime(
      date.year,
      date.month,
      date.day,
      23,
      59,
      59,
      999,
    );

    // Membuat query untuk menggabungkan kebiasaan dan penyelesaian kebiasaan
    final query = select(habits).join([
      leftOuterJoin(
        habitCompletions,
        habitCompletions.habitId.equalsExp(habits.id) &
            habitCompletions.completedAt.isBetweenValues(startOfDay, endOfDay),
      ),
    ]);

    // Mengamati hasil query dan memetakan ke objek HabitWithCompletion
    return query.watch().map((rows) {
      return rows.map((row) {
        final habit = row.readTable(habits);
        final completion = row.readTableOrNull(habitCompletions);

        return HabitWithCompletion(
            habit: habit, isCompleted: completion != null);
      }).toList();
    });
  }
}

// Kelas untuk menggabungkan kebiasaan dengan status penyelesaian
class HabitWithCompletion {
  final Habit habit;
  final bool isCompleted;

  HabitWithCompletion({required this.habit, required this.isCompleted});
}

// Fungsi untuk membuka koneksi database secara lazy
LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'habits.db'));
    return NativeDatabase.createInBackground(file);
  });
}

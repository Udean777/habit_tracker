import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:habit_tracker/core/database/tables.dart';
import 'package:habit_tracker/core/service/local_notifications_service.dart';
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
  Future<int> createHabit(HabitsCompanion habit) async {
    try {
      final habitId = await into(habits).insert(habit);

      if (habit.reminderTime.present && habit.reminderTime.value != null) {
        await LocalNotificationService().scheduleHabitReminder(
          habitId: habitId,
          title: habit.title.value,
          description:
              habit.description.value ?? 'Time to complete your habit!',
          reminderTime: habit.reminderTime.value!,
        );
      }

      return habitId;
    } catch (e) {
      // Log error atau tampilkan pesan ke pengguna
      rethrow;
    }
  }

  // Method untuk mengupdate reminder
  Future<void> updateHabitReminder(int habitId, String? newReminderTime) async {
    // Batalkan reminder yang ada
    await LocalNotificationService().cancelHabitReminder(habitId);

    if (newReminderTime != null) {
      final habit = await (select(habits)..where((t) => t.id.equals(habitId)))
          .getSingle();

      // Jadwalkan reminder baru
      await LocalNotificationService().scheduleHabitReminder(
        habitId: habitId,
        title: habit.title,
        description: habit.description ?? 'Time to complete your habit!',
        reminderTime: newReminderTime,
      );
    }

    // Update data di database
    await (update(habits)..where((t) => t.id.equals(habitId)))
        .write(HabitsCompanion(reminderTime: Value(newReminderTime)));
  }

  // Method untuk menghapus habit
  Future<void> deleteHabit(int habitId) async {
    // Batalkan reminder terlebih dahulu
    await LocalNotificationService().cancelHabitReminder(habitId);

    // Hapus data dari database
    await (delete(habits)..where((t) => t.id.equals(habitId))).go();
  }

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

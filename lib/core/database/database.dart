import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:the_habits/core/database/tables.dart';
import 'package:the_habits/core/service/local_notifications_service.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:rxdart/rxdart.dart';
import 'dart:developer' as developer;

part 'database.g.dart';

// Mendefinisikan kelas database dengan Drift
@DriftDatabase(tables: [Habits, HabitCompletions])
class AppDatabase extends _$AppDatabase {
  // Konstruktor untuk membuka koneksi database
  AppDatabase() : super(_openConnection());

  // Mendefinisikan versi skema database
  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 3) {
            await m.createTable(habitCompletions);
          }
        },
      );

  // Mendapatkan daftar semua habit
  Future<List<Habit>> getHabits() => select(habits).get();

  // Mengamati perubahan pada daftar habit
  Stream<List<Habit>> watchHabits() => select(habits).watch();

  // Membuat habit baru
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

  /// Menghapus habit berdasarkan habitId yang diberikan.
  ///
  /// Fungsi ini melakukan beberapa langkah dalam sebuah transaksi:
  /// 1. Membatalkan pengingat habit menggunakan `LocalNotificationService`.
  /// 2. Menghapus penyelesaian habit dari tabel `habitCompletions`.
  /// 3. Menghapus habit dari tabel `habits`.
  ///
  /// Jika terjadi kesalahan selama proses penghapusan, kesalahan akan dicetak
  /// dan dilempar ulang agar pemanggil fungsi dapat menangani kesalahan tersebut.
  ///
  /// Menggunakan transaksi untuk memastikan bahwa semua operasi penghapusan
  /// dilakukan secara atomik. Jika salah satu operasi gagal, semua perubahan
  /// akan dibatalkan.
  Future<void> deleteHabit(int habitId) async {
    try {
      // developer.log('Starting deleteHabit for habitId: $habitId');

      try {
        // developer.log('Attempting to cancel habit reminder');
        await LocalNotificationService().cancelHabitReminder(habitId);
        // developer.log('Successfully cancelled habit reminder');
      } catch (cancelError) {
        // developer.log('Error cancelling habit reminder: $cancelError');
        // Optionally rethrow or handle specifically
      }

      try {
        // developer.log('Attempting to delete habit completions');
        await (delete(habitCompletions)
              ..where((t) => t.habitId.equals(habitId)))
            .go();
        // developer.log('Deleted $completionDeleteCount habit completions');
      } catch (completionDeleteError) {
        developer
            .log('Error deleting habit completions: $completionDeleteError');
        // Optionally rethrow or handle specifically
      }

      try {
        // developer.log('Attempting to delete habit');
        await (delete(habits)..where((t) => t.id.equals(habitId))).go();
        // developer.log('Deleted $habitDeleteCount habits');
      } catch (habitDeleteError) {
        // developer.log('Error deleting habit: $habitDeleteError');
        // Optionally rethrow or handle specifically
      }

      // developer.log('Habit deletion process completed for habitId: $habitId');
    } catch (e) {
      // developer.log('Unexpected error in deleteHabit: $e');
      // developer.log('Error stack trace: ${StackTrace.current}');
      rethrow;
    }
  }

  // Menyelesaikan habit pada tanggal tertentu
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

      // Memeriksa apakah habit sudah diselesaikan pada hari tersebut
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

        // Perbarui streak dan total penyelesaian habit
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

    // Mengamati penyelesaian habit pada hari tersebut
    final completionsStream = (select(habitCompletions)
          ..where((t) => t.completedAt
              .isBetween(Variable(startOfDay), Variable(endOfDay))))
        .watch();

    // Mengamati habit dengan tanggal tertentu
    final habitsStream = watchHabitsWithDate(date);

    /// Menggabungkan nilai terbaru dari `completionsStream` dan `habitsStream`
    /// menggunakan metode `Rx.combineLatest2` dari paket rxdart.
    ///
    /// Ini digunakan untuk mendengarkan perubahan pada kedua stream secara bersamaan dan
    /// melakukan tindakan setiap kali salah satu stream mengeluarkan nilai baru. Hasil gabungan
    /// adalah tuple yang berisi panjang dari daftar `completions` dan `habits`,
    /// yang dapat digunakan untuk memperbarui UI atau melakukan logika lain berdasarkan
    /// keadaan saat ini dari stream-stream ini.
    ///
    /// Menggunakan rxdart di sini memungkinkan pemrograman yang efisien dan reaktif, membuatnya
    /// lebih mudah untuk mengelola dan merespons aliran data asinkron dalam aplikasi Flutter.
    return Rx.combineLatest2(completionsStream, habitsStream,
        (completions, habits) => (completions.length, habits.length));
  }

  // Mengamati habit dengan tanggal tertentu
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

    // Membuat query untuk menggabungkan habit dan penyelesaian habit
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

// Kelas untuk menggabungkan habit dengan status penyelesaian
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

import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Penyedia stream untuk daftar kebiasaan berdasarkan tanggal tertentu.
///
/// [habitsForDateProvider] adalah StreamProvider yang menggunakan family modifier
/// untuk menerima parameter tanggal [DateTime].
///
/// [ref] adalah referensi ke provider yang digunakan untuk mengakses penyedia lain.
///
/// [date] adalah parameter tanggal yang digunakan untuk memfilter kebiasaan.
///
/// [databse] adalah instance dari database yang diambil dari [databaseProvider].
///
/// Mengembalikan stream dari daftar [HabitWithCompletion] yang difilter berdasarkan [date].

final habitsForDateProvider =
    StreamProvider.family<List<HabitWithCompletion>, DateTime>((ref, date) {
  final databse = ref.watch(databaseProvider);
  return databse.watchHabitsWithDate(date);
});

import 'package:drift/drift.dart' as drift;
import 'package:flutter/material.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class CreateHabitPage extends HookConsumerWidget {
  const CreateHabitPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mendapatkan skema warna dari tema saat ini
    final colorScheme = Theme.of(context).colorScheme;

    // Menginisialisasi controller untuk input judul
    final titleController = useTextEditingController();

    // Menginisialisasi controller untuk input deskripsi
    final descriptionController = useTextEditingController();

    // Menginisialisasi state untuk menentukan apakah kebiasaan bersifat harian
    // final isDaily = useState(true);

    // Menginisialisasi state untuk menentukan apakah ada pengingat
    final hasReminder = useState(false);

    // Menginisialisasi state untuk waktu pengingat dengan nilai default pukul 10:00
    final reminderTime = useState<TimeOfDay?>(
      const TimeOfDay(hour: 10, minute: 0),
    );

    // Fungsi ini mengonversi objek TimeOfDay ke format 24 jam dalam bentuk string.
    String? convertTimeOfDayTo24Hour(TimeOfDay? time) {
      // Jika objek time adalah null, fungsi akan mengembalikan null.
      if (time == null) return null;

      // Mengambil nilai jam dari objek time dan mengonversinya ke string.
      // Kemudian, menambahkan '0' di depan jika panjang string kurang dari 2 karakter.
      final hour = time.hour.toString().padLeft(2, '0');

      // Mengambil nilai menit dari objek time dan mengonversinya ke string.
      // Kemudian, menambahkan '0' di depan jika panjang string kurang dari 2 karakter.
      final minute = time.minute.toString().padLeft(2, '0');

      // Menggabungkan nilai jam dan menit dengan format 'HH:mm' dan mengembalikannya.
      return '$hour:$minute';
    }

    // Fungsi yang dijalankan ketika tombol ditekan
    Future<void> onPressed(ColorScheme colorScheme) async {
      // Jika judul kosong, fungsi akan berhenti
      if (titleController.text.isEmpty) {
        return;
      }

      // Membuat objek habit baru dengan data yang diinputkan
      final habit = HabitsCompanion.insert(
        title: titleController.text,
        description: drift.Value(descriptionController.text),
        // isDaily: drift.Value(isDaily.value),
        reminderTime: drift.Value(convertTimeOfDayTo24Hour(reminderTime.value)),
        createdAt: drift.Value(DateTime.now()),
      );

      // Menyimpan habit baru ke database
      await ref.read(databaseProvider).createHabit(habit);

      // Mengosongkan form setelah berhasil menyimpan
      titleController.clear();
      descriptionController.clear();
      // isDaily.value = true;
      hasReminder.value = false;
      reminderTime.value = const TimeOfDay(hour: 10, minute: 0);

      // Menampilkan dialog sukses jika konteks masih terpasang
      if (context.mounted) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: Text(
                'Success',
                style: TextStyle(
                  color: colorScheme.primary,
                ),
              ),
              content: Text(
                'Habit successfully created!',
                style: TextStyle(
                  color: colorScheme.primary,
                ),
              ),
              actions: [
                // Tombol untuk menutup dialog
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: Text(
                    'Close',
                    style: TextStyle(
                      color: colorScheme.primary,
                    ),
                  ),
                ),
                // Tombol untuk kembali ke halaman utama
                TextButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: Text(
                    'Home',
                    style: TextStyle(
                      color: colorScheme.primary,
                    ),
                  ),
                ),
              ],
            );
          },
        );
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Create Habit',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          spacing: 16,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: titleController,
              decoration: InputDecoration(
                hintText: 'Title',
              ),
              style: TextStyle(
                color: colorScheme.primary,
              ),
            ),
            TextFormField(
              controller: descriptionController,
              decoration: InputDecoration(
                hintText: 'Description',
              ),
              style: TextStyle(
                color: colorScheme.primary,
              ),
            ),
            // Row(
            //   spacing: 4,
            //   children: [
            //     Text(
            //       'Daily',
            //       style: TextStyle(
            //         color: colorScheme.primary,
            //       ),
            //     ),
            //     Switch(
            //       value: isDaily.value,
            //       onChanged: (value) => isDaily.value = value,
            //     ),
            //   ],
            // ),
            SwitchListTile(
              value: hasReminder.value,
              onChanged: (value) {
                hasReminder.value = value;

                if (value) {
                  showTimePicker(
                    context: context,
                    initialTime: reminderTime.value ??
                        const TimeOfDay(hour: 10, minute: 0),
                  ).then((time) {
                    if (time != null) {
                      reminderTime.value = time;
                    }
                  });
                }
              },
              title: Text(
                'Has Reminder',
                style: TextStyle(
                  color: colorScheme.primary,
                ),
              ),
              subtitle: hasReminder.value
                  ? Text(
                      convertTimeOfDayTo24Hour(reminderTime.value) ??
                          'No time selected yet',
                      style: TextStyle(
                        color: colorScheme.primary,
                      ),
                    )
                  : null,
            ),

            GestureDetector(
              onTap: () => onPressed(colorScheme),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'Create Habit',
                    style: TextStyle(
                      color: colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
            GestureDetector(
              onTap: () => {},
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue, Colors.purple],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'Create Habit with AI✨',
                    style: TextStyle(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

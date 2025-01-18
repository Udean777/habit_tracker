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
    final colorScheme = Theme.of(context).colorScheme;
    final titleController = useTextEditingController();
    final descriptionController = useTextEditingController();
    final isDaily = useState(true);
    final hasReminder = useState(false);
    final reminderTime = useState<TimeOfDay?>(
      const TimeOfDay(hour: 10, minute: 0),
    );

    String? convertTimeOfDayTo24Hour(TimeOfDay? time) {
      if (time == null) return null;
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    }

    Future<void> onPressed() async {
      if (titleController.text.isEmpty) {
        return;
      }

      final habit = HabitsCompanion.insert(
        title: titleController.text,
        description: drift.Value(descriptionController.text),
        isDaily: drift.Value(isDaily.value),
        reminderTime: drift.Value(convertTimeOfDayTo24Hour(reminderTime.value)),
        createdAt: drift.Value(DateTime.now()),
      );

      await ref.read(databaseProvider).createHabit(habit);

      // Clear the form
      titleController.clear();
      descriptionController.clear();
      isDaily.value = true;
      hasReminder.value = false;
      reminderTime.value = const TimeOfDay(hour: 10, minute: 0);

      if (context.mounted) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text('Success'),
              content: const Text('Habit successfully created!'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: const Text('Close'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: const Text('Home'),
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
            ),
            TextFormField(
              controller: descriptionController,
              decoration: InputDecoration(
                hintText: 'Description',
              ),
            ),
            Text('Goal'),
            Row(
              spacing: 4,
              children: [
                Text('Daily'),
                Switch(
                  value: isDaily.value,
                  onChanged: (value) => isDaily.value = value,
                ),
              ],
            ),
            Text('Reminder'),
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
              title: Text('Has Reminder'),
              subtitle: hasReminder.value
                  ? Text(
                      reminderTime.value?.toString() ?? 'No time selected yet',
                    )
                  : null,
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: colorScheme.onPrimary,
                ),
                onPressed: onPressed,
                child: Text('Create Habit'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

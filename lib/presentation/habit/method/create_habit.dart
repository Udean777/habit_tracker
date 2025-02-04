import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/utils/convert_timeofday_to_24hour.dart';
import 'package:the_habits/presentation/habit/create_habit_page.dart';
import 'package:drift/drift.dart' as drift;

Future<void> createHabit(
  BuildContext context,
  WidgetRef ref,
  TextEditingController titleController,
  TextEditingController descriptionController,
  TimeOfDay? reminderTime,
  ScaffoldMessengerState scaffoldMessenger,
  ColorScheme colorScheme,
) async {
  if (titleController.text.isEmpty) {
    scaffoldMessenger.showSnackBar(
      SnackBar(content: Text('Title cannot be empty!')),
    );
    return;
  }

  ref.read(isLoadingProvider.notifier).state = true;

  final habit = HabitsCompanion.insert(
    title: titleController.text,
    description: drift.Value(descriptionController.text),
    reminderTime: drift.Value(convertTimeOfDayTo24Hour(reminderTime)),
    createdAt: drift.Value(DateTime.now()),
  );

  await ref.read(databaseProvider).createHabit(habit);

  titleController.clear();
  descriptionController.clear();
  ref.read(hasReminderProvider.notifier).state = false;
  ref.read(reminderTimeProvider.notifier).state =
      const TimeOfDay(hour: 10, minute: 0);

  ref.read(isLoadingProvider.notifier).state = false;

  if (context.mounted) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Success', style: TextStyle(color: colorScheme.primary)),
          content: Text('Habit successfully created!',
              style: TextStyle(color: colorScheme.primary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child:
                  Text('Close', style: TextStyle(color: colorScheme.primary)),
            ),
            TextButton(
              onPressed: () =>
                  Navigator.of(context).popUntil((route) => route.isFirst),
              child: Text('Home', style: TextStyle(color: colorScheme.primary)),
            ),
          ],
        );
      },
    );
  }
}

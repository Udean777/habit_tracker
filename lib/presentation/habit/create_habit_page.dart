import 'package:drift/drift.dart' as drift;
import 'package:flutter/material.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/ai_habit_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_approve_dialog.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_prompt_dialog.dart';

class CreateHabitPage extends HookConsumerWidget {
  const CreateHabitPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final titleController = useTextEditingController();
    final descriptionController = useTextEditingController();
    final hasReminder = useState(false);
    final reminderTime =
        useState<TimeOfDay?>(const TimeOfDay(hour: 10, minute: 0));
    final isLoading = useState(false);

    String? convertTimeOfDayTo24Hour(TimeOfDay? time) {
      if (time == null) return null;
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    }

    Future<void> onPressed(ColorScheme colorScheme) async {
      if (titleController.text.isEmpty) {
        return;
      }

      isLoading.value = true;

      final habit = HabitsCompanion.insert(
        title: titleController.text,
        description: drift.Value(descriptionController.text),
        reminderTime: drift.Value(convertTimeOfDayTo24Hour(reminderTime.value)),
        createdAt: drift.Value(DateTime.now()),
      );

      await ref.read(databaseProvider).createHabit(habit);

      titleController.clear();
      descriptionController.clear();
      hasReminder.value = false;
      reminderTime.value = const TimeOfDay(hour: 10, minute: 0);

      isLoading.value = false;

      if (context.mounted) {
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title:
                  Text('Success', style: TextStyle(color: colorScheme.primary)),
              content: Text('Habit successfully created!',
                  style: TextStyle(color: colorScheme.primary)),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: Text('Close',
                      style: TextStyle(color: colorScheme.primary)),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: Text('Home',
                      style: TextStyle(color: colorScheme.primary)),
                ),
              ],
            );
          },
        );
      }
    }

    Future<void> createHabitWithAI() async {
      final prompt = await showDialog(
        context: context,
        builder: (context) => AIHabitPromptDialog(),
      );

      if (prompt != null && prompt.isNotEmpty) {
        isLoading.value = true;

        final aiService = ref.read(aiHabitCreationProvider);
        final habitDetails = await aiService.generateHabitFromPrompt(prompt);

        if (habitDetails != null && context.mounted) {
          final approved = await showDialog<bool>(
            context: context,
            builder: (context) =>
                AIHabitApprovalDialog(habitDetails: habitDetails),
          );
          if (approved == true) {
            final success =
                await aiService.createHabitFromDetails(habitDetails);

            if (success && context.mounted) {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text('Success'),
                  content: Text('Habit created successfully using AI!'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text('Close'),
                    ),
                  ],
                ),
              );
            }
          }
        }

        isLoading.value = false;
      }
    }

    String getTimeZoneName() {
      final now = DateTime.now();
      final timeZoneOffset = now.timeZoneOffset.inHours;

      if (timeZoneOffset == 7) {
        return 'WIB';
      } else if (timeZoneOffset == 8) {
        return 'WITA';
      } else if (timeZoneOffset == 9) {
        return 'WIT';
      } else {
        return 'Unknown Time Zone';
      }
    }

    return Scaffold(
      appBar: AppBar(
        title:
            Text('Create Habit', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              spacing: 16,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: titleController,
                  decoration: InputDecoration(hintText: 'Title'),
                  style: TextStyle(color: colorScheme.primary),
                ),
                TextFormField(
                  controller: descriptionController,
                  decoration: InputDecoration(hintText: 'Description'),
                  style: TextStyle(color: colorScheme.primary),
                ),
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
                  title: Text('Has Reminder',
                      style: TextStyle(color: colorScheme.primary)),
                  subtitle: hasReminder.value
                      ? Text(
                          '${convertTimeOfDayTo24Hour(reminderTime.value)} ${getTimeZoneName()}',
                          style: TextStyle(color: colorScheme.primary),
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
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: createHabitWithAI,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      gradient:
                          LinearGradient(colors: [Colors.blue, Colors.purple]),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        'Create Habit with AI✨',
                        style: TextStyle(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (isLoading.value)
            Container(
              color: Colors.black54,
              child: Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}

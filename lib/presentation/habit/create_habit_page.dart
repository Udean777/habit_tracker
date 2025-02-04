import 'package:drift/drift.dart' as drift;
import 'package:flutter/material.dart';
import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/exception/ai_service_exception.dart';
import 'package:the_habits/core/providers/ai_habit_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_approve_dialog.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_prompt_dialog.dart';

final hasReminderProvider = StateProvider<bool>((ref) => false);
final reminderTimeProvider =
    StateProvider<TimeOfDay?>((ref) => const TimeOfDay(hour: 10, minute: 0));
final isLoadingProvider = StateProvider<bool>((ref) => false);

class CreateHabitPage extends ConsumerWidget {
  const CreateHabitPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final hasReminder = ref.watch(hasReminderProvider);
    final reminderTime = ref.watch(reminderTimeProvider);
    final isLoading = ref.watch(isLoadingProvider);

    String? convertTimeOfDayTo24Hour(TimeOfDay? time) {
      if (time == null) return null;
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    }

    Future<void> onPressed() async {
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
              title:
                  Text('Success', style: TextStyle(color: colorScheme.primary)),
              content: Text('Habit successfully created!',
                  style: TextStyle(color: colorScheme.primary)),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Close',
                      style: TextStyle(color: colorScheme.primary)),
                ),
                TextButton(
                  onPressed: () =>
                      Navigator.of(context).popUntil((route) => route.isFirst),
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
        builder: (context) => const AIHabitPromptDialog(),
      );

      if (prompt != null && prompt.isNotEmpty) {
        ref.read(isLoadingProvider.notifier).state = true;

        try {
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
                scaffoldMessenger.showSnackBar(
                  SnackBar(
                      content: Text('Habit created successfully using AI!')),
                );
              }
            }
          }
        } on AIServiceException catch (e) {
          scaffoldMessenger
              .showSnackBar(SnackBar(content: Text('Error: ${e.message}')));
        } catch (e) {
          scaffoldMessenger.showSnackBar(SnackBar(
              content:
                  Text('An error occurred while creating the habit from AI')));
        } finally {
          ref.read(isLoadingProvider.notifier).state = false;
        }
      }
    }

    String getTimeZoneName() {
      final timeZoneOffset = DateTime.now().timeZoneOffset.inHours;
      switch (timeZoneOffset) {
        case 7:
          return 'WIB';
        case 8:
          return 'WITA';
        case 9:
          return 'WIT';
        default:
          return 'Unknown Time Zone';
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Habit',
            style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: titleController,
                  decoration: InputDecoration(
                    hintText: 'Title',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  style: TextStyle(color: colorScheme.primary),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: descriptionController,
                  decoration: InputDecoration(
                    hintText: 'Description',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  style: TextStyle(color: colorScheme.primary),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  value: hasReminder,
                  onChanged: (value) {
                    ref.read(hasReminderProvider.notifier).state = value;
                    if (value) {
                      showTimePicker(
                        context: context,
                        initialTime: reminderTime ??
                            const TimeOfDay(hour: 10, minute: 0),
                      ).then((time) {
                        if (time != null) {
                          ref.read(reminderTimeProvider.notifier).state = time;
                        }
                      });
                    }
                  },
                  title: Text('Has Reminder',
                      style: TextStyle(color: colorScheme.primary)),
                  subtitle: hasReminder
                      ? Text(
                          '${convertTimeOfDayTo24Hour(reminderTime)} ${getTimeZoneName()}',
                          style: TextStyle(color: colorScheme.primary),
                        )
                      : null,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onPressed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: colorScheme.onPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Create Habit'),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: createHabitWithAI,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Create Habit with AI ✨'),
                  ),
                ),
              ],
            ),
          ),
          if (isLoading)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/core/widgets/custom_button.dart';
import 'package:the_habits/core/widgets/custom_textinput.dart';
import 'package:the_habits/presentation/habit/method/create_habit.dart';
import 'package:the_habits/presentation/habit/method/create_habit_withai.dart';
import 'package:the_habits/presentation/habit/widgets/reminder_switch.dart';

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
                CustomTextInput(
                  controller: titleController,
                  hintText: 'Title',
                ),
                const SizedBox(height: 16),
                CustomTextInput(
                  controller: descriptionController,
                  hintText: 'Description',
                ),
                const SizedBox(height: 16),
                ReminderSwitch(
                  hasReminder: hasReminder,
                  reminderTime: reminderTime,
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
                ),
                const SizedBox(height: 16),
                CustomButton(
                  text: 'Create Habit',
                  onPressed: () => createHabit(
                    context,
                    ref,
                    titleController,
                    descriptionController,
                    reminderTime,
                    scaffoldMessenger,
                    colorScheme,
                  ),
                ),
                const SizedBox(height: 16),
                CustomButton(
                  text: 'Create Habit with AI ✨',
                  onPressed: () => createHabitWithAI(
                    context,
                    ref,
                    scaffoldMessenger,
                  ),
                  backgroundColor: Colors.blue,
                  textColor: Colors.white,
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

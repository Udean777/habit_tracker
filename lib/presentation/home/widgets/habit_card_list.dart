import 'package:flutter/material.dart';
import 'package:the_habits/core/providers/habits_for_date_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/presentation/home/widgets/habit_card.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class HabitCardList extends HookConsumerWidget {
  final DateTime selectedDate;

  const HabitCardList({super.key, required this.selectedDate});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final database = ref.read(databaseProvider);
    final habitsAsyncValue = ref.watch(habitsForDateProvider(selectedDate));
    final colorScheme = Theme.of(context).colorScheme;

    return habitsAsyncValue.when(
      data: (data) {
        if (data.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  'assets/icons8-bullet-list-100.png',
                  width: 100,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 16),
                const Text(
                  "You don't have a habit yet, make one now!",
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return Expanded(
          child: ListView.separated(
            itemCount: data.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final habitData = data[index];

              TimeOfDay parseTimeOfDay(String time) {
                final parts = time.split(':');

                return TimeOfDay(
                  hour: int.parse(parts[0]),
                  minute: int.parse(
                    parts[1],
                  ),
                );
              }

              return Dismissible(
                key: ValueKey(habitData.habit.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.red,
                  ),
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Icon(
                    Icons.delete,
                    color: colorScheme.primary,
                    size: 30,
                  ),
                ),
                confirmDismiss: (direction) async {
                  final result = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text(
                        'Delete Habit',
                        style: TextStyle(color: colorScheme.primary),
                      ),
                      content: Text(
                        'Are you sure you want to delete this habit?',
                        style: TextStyle(color: colorScheme.primary),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: Text(
                            'Cancel',
                            style: TextStyle(color: colorScheme.primary),
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          child: Text(
                            'Delete',
                            style: TextStyle(color: colorScheme.primary),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (result == true) {
                    // Delete the habit from database first
                    await database.deleteHabit(habitData.habit.id);

                    // Then invalidate the provider to refresh the UI
                    ref.invalidate(habitsForDateProvider(selectedDate));

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${habitData.habit.title} deleted'),
                        ),
                      );
                    }
                  }

                  return result;
                },
                child: HabitCard(
                  title: habitData.habit.title,
                  streak: habitData.habit.streak,
                  progress: habitData.isCompleted ? 1 : 0,
                  habitId: habitData.habit.id,
                  isCompleted: habitData.isCompleted,
                  date: selectedDate,
                  description: habitData.habit.description!,
                  reminderTime: parseTimeOfDay(habitData.habit.reminderTime!),
                ),
              );
            },
          ),
        );
      },
      error: (error, st) => Center(
        child: Text(
          error.toString(),
        ),
      ),
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

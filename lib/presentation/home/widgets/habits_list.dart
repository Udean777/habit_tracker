import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/utils/get_background_color.dart';
import 'package:the_habits/core/utils/is_sameday.dart';
import 'package:the_habits/core/utils/parse_timeofday.dart';
import 'package:the_habits/presentation/home/widgets/habit_card.dart';

class HabitsList extends StatelessWidget {
  final AsyncValue habitsAsyncValue;
  final ValueNotifier<DateTime> selectedDate;
  final WidgetRef ref;

  const HabitsList({
    required this.habitsAsyncValue,
    required this.selectedDate,
    required this.ref,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return habitsAsyncValue.when(
      data: (habits) {
        if (habits.isEmpty) {
          return Center(
            child: Text(
              'No habits for today',
              style: TextStyle(color: Colors.white70),
            ),
          );
        }

        return ListView.builder(
          padding: EdgeInsets.symmetric(horizontal: 16),
          itemCount: 24,
          itemBuilder: (context, hour) {
            final habitsAtHour = habits
                .where((h) =>
                    h.habit.reminderTime != null &&
                    parseTimeOfDay(h.habit.reminderTime!).hour == hour)
                .toList();

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 40,
                  child: Text(
                    '$hour:00',
                    style: TextStyle(color: Colors.white70),
                  ),
                ),
                if (habitsAtHour.isNotEmpty)
                  Expanded(
                    child: Column(
                      children: habitsAtHour
                          .map<Widget>(
                            (habit) => HabitCard(
                              title: habit.habit.title,
                              description: habit.habit.description!,
                              reminderTime: habit.habit.reminderTime!,
                              isCompleted: habit.isCompleted,
                              backgroundColor:
                                  getBackgroundColor(habit.habit.title),
                              onComplete: () async {
                                if (isSameDay(
                                    selectedDate.value, DateTime.now())) {
                                  await ref
                                      .read(databaseProvider)
                                      .completeHabit(
                                          habit.habit.id, selectedDate.value);
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'You can only complete today\'s tasks!',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              },
                              onDelete: () async {
                                await ref
                                    .read(databaseProvider)
                                    .deleteHabit(habit.habit.id);
                              },
                              onEdit: () {},
                            ),
                          )
                          .toList(),
                    ),
                  ),
              ],
            );
          },
        );
      },
      error: (error, st) => Center(
        child: Text(
          error.toString(),
          style: TextStyle(color: Colors.white),
        ),
      ),
      loading: () => SizedBox.shrink(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/utils/get_background_color.dart';
import 'package:the_habits/core/utils/is_sameday.dart';
import 'package:the_habits/core/utils/parse_timeofday.dart';
import 'package:the_habits/presentation/home/widgets/habit_card.dart';

class HabitsList extends StatelessWidget {
  final AsyncValue habitsAsyncValue;
  final ValueNotifier<DateTime> selectedDate;
  final WidgetRef ref;
  final ColorScheme colorScheme;

  const HabitsList({
    required this.habitsAsyncValue,
    required this.selectedDate,
    required this.ref,
    super.key,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return habitsAsyncValue.when(
      data: (habits) {
        if (habits.isEmpty) {
          return Center(
            child: Text(
              'No habits for today',
              style: TextStyle(color: colorScheme.onSurface),
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
                  width: 50,
                  child: Text(
                    '$hour:00',
                    style: TextStyle(color: colorScheme.onSurface),
                    maxLines: 1,
                    overflow: TextOverflow.fade,
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
                              backgroundColor: getBackgroundColor(
                                context,
                                habit.habit.title,
                              ),
                              onComplete: () async {
                                if (isSameDay(
                                  selectedDate.value,
                                  DateTime.now(),
                                )) {
                                  await ref
                                      .read(databaseProvider)
                                      .completeHabit(
                                        habit.habit.id,
                                        selectedDate.value,
                                      );
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
                              colorScheme: colorScheme,
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
      error: (error, st) {
        print(error);
        return Center(
          child: Text(
            'Error in habits list: ${error.toString()}',
            style: TextStyle(color: colorScheme.onSurface),
          ),
        );
      },
      loading: () => SizedBox.shrink(),
    );
  }
}

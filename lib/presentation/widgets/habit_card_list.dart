import 'package:flutter/material.dart';
import 'package:habit_tracker/core/providers/habits_for_date_provider.dart';
import 'package:habit_tracker/presentation/widgets/habit_card.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class HabitCardList extends HookConsumerWidget {
  final DateTime selectedDate;

  const HabitCardList({super.key, required this.selectedDate});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habitsAsyncValue = ref.watch(habitsForDateProvider(selectedDate));

    return habitsAsyncValue.when(
      data: (data) => Expanded(
        child: ListView.separated(
          itemCount: data.length,
          separatorBuilder: (context, index) => const SizedBox(
            height: 16,
          ),
          itemBuilder: (context, index) {
            final habits = data[index];
            return HabitCard(
              title: habits.habit.title,
              streak: habits.habit.streak,
              progress: habits.isCompleted ? 1 : 0,
              habitId: habits.habit.id,
              isCompleted: habits.isCompleted,
              date: selectedDate,
              description: habits.habit.description!,
            );
          },
        ),
      ),
      error: (error, st) => Center(
        child: Text(
          error.toString(),
        ),
      ),
      loading: () => Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

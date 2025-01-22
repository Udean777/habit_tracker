import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:the_habits/core/providers/daily_summary_provider.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:the_habits/core/providers/habits_for_date_provider.dart';
import 'package:the_habits/core/utils/parse_timeofday.dart';
import 'package:the_habits/core/widgets/timeline_view.dart';
import 'package:the_habits/presentation/home/widgets/habit_card.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = useState(DateTime.now());

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(Icons.notifications, color: Colors.white),
            onPressed: () {},
          ),
        ],
        title: Row(
          children: [
            Image.asset(
              'assets/logo.png',
              height: 50,
            ),
            const SizedBox(width: 8),
            Text(
              'The Habits',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              DateFormat('MMMM yyyy').format(selectedDate.value),
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.start,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          CustomTimelineView(
            selectedDate: selectedDate.value,
            onSelectedDateChange: (date) => selectedDate.value = date,
          ),
          ref.watch(dailySummaryProvider(selectedDate.value)).when(
                data: (data) => Container(
                  margin: EdgeInsets.all(16),
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Daily Summary',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 8),
                      Text(
                        '${data.$1} Completed • ${data.$2} Total',
                        style: TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                error: (error, st) => Text(error.toString()),
                loading: () => const CircularProgressIndicator(),
              ),
          Expanded(
            child: Consumer(
              builder: (context, ref, child) {
                final habitsAsyncValue =
                    ref.watch(habitsForDateProvider(selectedDate.value));

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
                                parseTimeOfDay(h.habit.reminderTime!).hour ==
                                hour)
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
                                      .map((habit) => HabitCard(
                                            title: habit.habit.title,
                                            description:
                                                habit.habit.description!,
                                            reminderTime: parseTimeOfDay(
                                                habit.habit.reminderTime!),
                                            isCompleted: habit.isCompleted,
                                            backgroundColor:
                                                _getBackgroundColor(
                                                    habit.habit.title),
                                            onComplete: () async {
                                              await ref
                                                  .read(databaseProvider)
                                                  .completeHabit(
                                                    habit.habit.id,
                                                    selectedDate.value,
                                                  );
                                            },
                                            onDelete: () async {
                                              await ref
                                                  .read(databaseProvider)
                                                  .deleteHabit(
                                                    habit.habit.id,
                                                  );
                                            },
                                            onEdit: () {},
                                          ))
                                      .toList(),
                                ),
                              ),
                          ],
                        );
                      },
                    );
                  },
                  error: (error, st) => Center(
                    child: Text(error.toString(),
                        style: TextStyle(color: Colors.white)),
                  ),
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _getBackgroundColor(String title) {
    final colors = [
      Colors.purple.withValues(alpha: 0.3),
      Colors.blue.withValues(alpha: 0.3),
      Colors.green.withValues(alpha: 0.3),
      Colors.orange.withValues(alpha: 0.3),
    ];

    return colors[title.hashCode % colors.length];
  }
}

import 'package:flutter/material.dart';
import 'package:the_habits/core/providers/daily_summary_provider.dart';
import 'package:the_habits/core/providers/habits_for_date_provider.dart';
import 'package:the_habits/core/widgets/timeline_view.dart';
import 'package:the_habits/presentation/home/widgets/daily_summary.dart';
import 'package:the_habits/presentation/home/widgets/date_header.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/presentation/home/widgets/habits_list.dart';
import 'package:the_habits/presentation/home/widgets/home_appbar.dart';

final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedDateProvider);
    final dailySummaryAsyncValue =
        ref.watch(dailySummaryProvider(selectedDate));
    final habitsAsyncValue = ref.watch(habitsForDateProvider(selectedDate));
    final isLoading =
        dailySummaryAsyncValue.isLoading || habitsAsyncValue.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: HomeAppbar(
        colorScheme: colorScheme,
      ),
      body: isLoading
          ? Center(
              child: CircularProgressIndicator(),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 8,
                ),
                DateHeader(
                  selectedDate: selectedDate,
                  colorScheme: colorScheme,
                ),
                SizedBox(height: 8),
                CustomTimelineView(
                  selectedDate: selectedDate,
                  onSelectedDateChange: (date) =>
                      ref.read(selectedDateProvider.notifier).state = date,
                  colorScheme: colorScheme,
                ),
                DailySummary(
                  dailySummaryAsyncValue: dailySummaryAsyncValue,
                  colorScheme: colorScheme,
                ),
                Expanded(
                  child: HabitsList(
                    habitsAsyncValue: habitsAsyncValue,
                    selectedDate: ValueNotifier(selectedDate),
                    ref: ref,
                    colorScheme: colorScheme,
                  ),
                ),
              ],
            ),
    );
  }
}

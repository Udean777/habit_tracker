import 'package:flutter/material.dart';
import 'package:the_habits/core/providers/daily_summary_provider.dart';
import 'package:the_habits/core/providers/habits_for_date_provider.dart';
import 'package:the_habits/core/widgets/timeline_view.dart';
import 'package:the_habits/presentation/home/widgets/daily_summary.dart';
import 'package:the_habits/presentation/home/widgets/date_header.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/presentation/home/widgets/habits_list.dart';
import 'package:the_habits/presentation/home/widgets/home_appbar.dart';

final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedDateProvider.notifier);
    final dailySummaryAsyncValue =
        ref.watch(dailySummaryProvider(selectedDate.state));
    final habitsAsyncValue =
        ref.watch(habitsForDateProvider(selectedDate.state));
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
                  height: 20,
                ),
                DateHeader(
                  selectedDate: selectedDate.state,
                  colorScheme: colorScheme,
                ),
                SizedBox(height: 8),
                CustomTimelineView(
                  selectedDate: selectedDate.state,
                  onSelectedDateChange: (date) => selectedDate.state = date,
                  colorScheme: colorScheme,
                ),
                DailySummary(
                  dailySummaryAsyncValue: dailySummaryAsyncValue,
                  colorScheme: colorScheme,
                ),
                Expanded(
                  child: HabitsList(
                    habitsAsyncValue: habitsAsyncValue,
                    selectedDate: ValueNotifier(selectedDate.state),
                    ref: ref,
                    colorScheme: colorScheme,
                  ),
                ),
              ],
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:the_habits/core/providers/daily_summary_provider.dart';
import 'package:the_habits/core/providers/habits_for_date_provider.dart';
import 'package:the_habits/core/widgets/timeline_view.dart';
import 'package:the_habits/presentation/home/widgets/daily_summary.dart';
import 'package:the_habits/presentation/home/widgets/date_header.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/presentation/home/widgets/habits_list.dart';
import 'package:the_habits/presentation/home/widgets/home_appbar.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = useState(DateTime.now());
    final dailySummaryAsyncValue =
        ref.watch(dailySummaryProvider(selectedDate.value));
    final habitsAsyncValue =
        ref.watch(habitsForDateProvider(selectedDate.value));
    final isLoading =
        dailySummaryAsyncValue.isLoading || habitsAsyncValue.isLoading;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: HomeAppbar(),
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
                DateHeader(selectedDate: selectedDate.value),
                SizedBox(height: 8),
                CustomTimelineView(
                  selectedDate: selectedDate.value,
                  onSelectedDateChange: (date) => selectedDate.value = date,
                ),
                DailySummary(dailySummaryAsyncValue: dailySummaryAsyncValue),
                Expanded(
                  child: HabitsList(
                    habitsAsyncValue: habitsAsyncValue,
                    selectedDate: selectedDate,
                    ref: ref,
                  ),
                ),
              ],
            ),
    );
  }
}

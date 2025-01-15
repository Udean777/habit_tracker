import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:habit_tracker/core/providers/daily_summary_provider.dart';
import 'package:habit_tracker/presentation/widgets/daily_summary_card.dart';
import 'package:habit_tracker/presentation/widgets/habit_card_list.dart';
import 'package:habit_tracker/presentation/widgets/timeline_view.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = useState(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'The Habits',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TimelineView(
                selectedDate: selectedDate.value,
                onSelectedDateChange: (date) => selectedDate.value = date,
              ),
              ref.watch(dailySummaryProvider(selectedDate.value)).when(
                    data: (data) => DailySummaryCard(
                      completedTasks: data.$1,
                      totalTasks: data.$2,
                      date: DateFormat('EEE d').format(selectedDate.value),
                    ),
                    error: (error, st) => Text(error.toString()),
                    loading: () => const SizedBox.shrink(),
                  ),
              const SizedBox(
                height: 16,
              ),
              Text(
                'Habits',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              HabitCardList(selectedDate: selectedDate.value),
            ],
          ),
        ),
      ),
    );
  }
}

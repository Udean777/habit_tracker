import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:habit_tracker/core/providers/daily_summary_provider.dart';
import 'package:habit_tracker/presentation/habit/create_habit_page.dart';
import 'package:habit_tracker/presentation/widgets/daily_summary_card.dart';
import 'package:habit_tracker/presentation/widgets/habit_card_list.dart';
import 'package:habit_tracker/presentation/widgets/timeline_view.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';

class MainPage extends HookConsumerWidget {
  const MainPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = useState(DateTime.now());
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('The Habits'),
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
              ),
              const SizedBox(
                height: 16,
              ),
              HabitCardList(selectedDate: selectedDate.value),
            ],
          ),
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: colorScheme.primary,
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.2),
              blurRadius: 16,
              spreadRadius: 4,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => CreateHabitPage(),
              ),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Icon(
                Icons.add,
                size: 30,
                color: colorScheme.onPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

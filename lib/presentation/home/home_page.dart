// import 'package:drift_db_viewer/drift_db_viewer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
// import 'package:the_habits/core/database/database.dart';
import 'package:the_habits/core/providers/daily_summary_provider.dart';
import 'package:the_habits/presentation/home/widgets/daily_summary_card.dart';
import 'package:the_habits/presentation/home/widgets/habit_card_list.dart';
import 'package:the_habits/presentation/home/widgets/timeline_view.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';

class HomePage extends HookConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = useState(DateTime.now());
    final colorScheme = Theme.of(context).colorScheme;
    // final db = AppDatabase();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'The Habits',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        // leading: GestureDetector(
        //   onTap: () {
        //     Navigator.of(context).push(
        //         MaterialPageRoute(builder: (context) => DriftDbViewer(db)));
        //   },
        //   child: Icon(Icons.data_array),
        // ),
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
                  color: colorScheme.primary,
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

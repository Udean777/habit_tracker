import 'package:flutter/material.dart';

class DailySummaryCard extends StatelessWidget {
  final int completedTasks;
  final int totalTasks;
  final String date;

  const DailySummaryCard({
    super.key,
    required this.completedTasks,
    required this.totalTasks,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final progress = totalTasks > 0 ? completedTasks / totalTasks : 0.0;

    return Card(
      elevation: 2,
      shadowColor: colorScheme.shadow.withValues(alpha: 0.2),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: colorScheme.primary,
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Daily Summary',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: colorScheme.onPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      date,
                      style: TextStyle(
                        color: colorScheme.onPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(
                height: 16,
              ),
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 5,
                      color: colorScheme.onPrimary,
                      backgroundColor:
                          colorScheme.surface.withValues(alpha: 0.2),
                      valueColor: AlwaysStoppedAnimation(
                        colorScheme.onPrimary,
                      ),
                    ),
                  )
                ],
              ),
              const SizedBox(
                height: 16,
              ),
              Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    color: colorScheme.onPrimary,
                  ),
                  const SizedBox(
                    width: 8,
                  ),
                  Text(
                    '$completedTasks / $totalTasks',
                    style: TextStyle(
                      color: colorScheme.onPrimary,
                    ),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}

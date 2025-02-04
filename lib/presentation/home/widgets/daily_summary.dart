import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DailySummary extends StatelessWidget {
  final AsyncValue dailySummaryAsyncValue;
  final ColorScheme colorScheme;

  const DailySummary({
    required this.dailySummaryAsyncValue,
    super.key,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return dailySummaryAsyncValue.when(
      data: (data) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colorScheme.primary,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.check_circle, color: colorScheme.onPrimary),
                const SizedBox(width: 8),
                Text(
                  'Daily Summary',
                  style: TextStyle(
                    color: colorScheme.onPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${data.$1} Completed • ${data.$2} Total',
              style: TextStyle(color: colorScheme.onPrimary.withValues(alpha: 0.7)),
            ),
          ],
        ),
      ),
      error: (error, st) =>
          Text(error.toString(), style: TextStyle(color: colorScheme.error)),
      loading: () => const SizedBox.shrink(),
    );
  }
}

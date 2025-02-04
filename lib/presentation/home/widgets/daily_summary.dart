import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DailySummary extends StatelessWidget {
  final AsyncValue dailySummaryAsyncValue;

  const DailySummary({required this.dailySummaryAsyncValue, super.key});

  @override
  Widget build(BuildContext context) {
    return dailySummaryAsyncValue.when(
      data: (data) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green.withAlpha((0.2 * 255).toInt()),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
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
            const SizedBox(height: 8),
            Text(
              '${data.$1} Completed • ${data.$2} Total',
              style: const TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
      error: (error, st) => Text(error.toString()),
      loading: () => const SizedBox.shrink(),
    );
  }
}

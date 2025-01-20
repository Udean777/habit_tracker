import 'package:flutter/material.dart';
import 'package:the_habits/core/providers/database_provider.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class HabitCard extends HookConsumerWidget {
  final String title;
  final int streak;
  final double progress;
  final int habitId;
  final bool isCompleted;
  final DateTime date;
  final String description;
  final TimeOfDay reminderTime;

  const HabitCard({
    super.key,
    required this.title,
    required this.streak,
    required this.progress,
    required this.habitId,
    required this.isCompleted,
    required this.date,
    required this.description,
    required this.reminderTime,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    // Checking is today is really today
    bool isToday(DateTime date) {
      final now = DateTime.now();
      return date.year == now.year &&
          date.month == now.month &&
          date.day == now.day;
    }

    Future<void> onComplete() async {
      // Checking if it's today, if it's today, then you may pass
      if (isToday(date)) {
        await ref.read(databaseProvider).completeHabit(habitId, date);

        // Adding if statement, so there's different snackbar when
        // onComplete() called
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Congratulations, you successfully completed your habit!',
              ),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'You can only complete today\'s habit!',
              ),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }

    String formatReminderTime(TimeOfDay time) {
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');

      return '$hour:$minute';
    }

    String getTimeZoneName() {
      final now = DateTime.now();
      final timeZoneOffset = now.timeZoneOffset.inHours;

      if (timeZoneOffset == 7) {
        return 'WIB';
      } else if (timeZoneOffset == 8) {
        return 'WITA';
      } else if (timeZoneOffset == 9) {
        return 'WIT';
      } else {
        return 'Unknown Time Zone';
      }
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outlineVariant,
        ),
        color: isCompleted
            ? colorScheme.primaryContainer.withValues(alpha: 0.8)
            : colorScheme.surface.withValues(alpha: 0.1),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow,
            blurRadius: 16,
          ),
        ],
      ),
      child: Card(
        elevation: 0,
        color: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.primary,
                      ),
                    ),
                    const SizedBox(
                      height: 8,
                    ),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: colorScheme.primary,
                      ),
                    ),
                    const SizedBox(
                      height: 8,
                    ),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          color: colorScheme.primary,
                        ),
                        const SizedBox(
                          width: 4,
                        ),
                        Text(
                          'Reminder: ${formatReminderTime(reminderTime)} ${getTimeZoneName()}',
                          style: TextStyle(
                            fontSize: 14,
                            color: colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 8,
                    ),
                    if (streak > 0) ...[
                      Row(
                        children: [
                          Icon(
                            Icons.local_fire_department,
                            color: Color(0xFFFF4A00),
                          ),
                          const SizedBox(
                            width: 4,
                          ),
                          Text(
                            '$streak DAYS STREAK!',
                            style: TextStyle(
                              color: Color(0xFFFF4A00),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      )
                    ]
                  ],
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: isCompleted ? colorScheme.primary : null,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onComplete,
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Icon(
                        isCompleted
                            ? Icons.check_circle
                            : Icons.circle_outlined,
                        color: isCompleted
                            ? colorScheme.onPrimary
                            : colorScheme.onSurfaceVariant,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

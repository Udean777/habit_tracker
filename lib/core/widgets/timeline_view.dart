import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class CustomTimelineView extends StatelessWidget {
  final DateTime selectedDate;
  final void Function(DateTime) onSelectedDateChange;

  const CustomTimelineView({
    super.key,
    required this.selectedDate,
    required this.onSelectedDateChange,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weekDates = List.generate(7, (index) {
      return now
          .subtract(Duration(days: now.weekday - 1))
          .add(Duration(days: index));
    });

    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 12),
        itemCount: weekDates.length,
        itemBuilder: (context, index) {
          final date = weekDates[index];
          final isSelected = date.day == selectedDate.day &&
              date.month == selectedDate.month &&
              date.year == selectedDate.year;
          final isToday = date.day == now.day &&
              date.month == now.month &&
              date.year == now.year;

          return GestureDetector(
            onTap: () => onSelectedDateChange(date),
            child: Container(
              width: 50,
              margin: EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white
                    : isToday
                        ? Colors.grey
                        : Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    date.day.toString(),
                    style: TextStyle(
                      color: isSelected ? Colors.black : Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('E').format(date).toLowerCase(),
                    style: TextStyle(
                      color: isSelected ? Colors.black : Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

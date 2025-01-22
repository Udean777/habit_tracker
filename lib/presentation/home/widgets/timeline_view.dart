// ignore_for_file: public_member_api_docs, sort_constructors_first, deprecated_member_use
import 'package:easy_date_timeline/easy_date_timeline.dart';
import 'package:flutter/material.dart';

class TimelineView extends StatelessWidget {
  final DateTime selectedDate;
  final void Function(DateTime) onSelectedDateChange;

  const TimelineView({
    super.key,
    required this.selectedDate,
    required this.onSelectedDateChange,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: EasyDateTimeLine(
        initialDate: selectedDate,
        onDateChange: onSelectedDateChange,
        headerProps: EasyHeaderProps(
          monthPickerType: MonthPickerType.dropDown,
          showHeader: false,
          showSelectedDate: true,
        ),
        dayProps: EasyDayProps(
          dayStructure: DayStructure.dayNumDayStr,
          activeDayStyle: DayStyle(
            decoration: BoxDecoration(
              color: colorScheme.primary,
              borderRadius: BorderRadius.circular(12),
            ),
            dayStrStyle: TextStyle(
              color: colorScheme.onPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
            dayNumStyle: TextStyle(
              color: colorScheme.onPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          inactiveDayStyle: DayStyle(
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: colorScheme.outlineVariant,
                width: 1,
              ),
            ),
            dayStrStyle: TextStyle(
              color: colorScheme.onSurface,
              fontSize: 16,
            ),
            dayNumStyle: TextStyle(
              color: colorScheme.onSurface,
              fontSize: 16,
            ),
          ),
          todayHighlightStyle: TodayHighlightStyle.withBackground,
          todayHighlightColor: colorScheme.primaryContainer,
          todayStrStyle: TextStyle(
            color: colorScheme.onSurface,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          todayNumStyle: TextStyle(
            color: colorScheme.onSurface,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        timeLineProps: EasyTimeLineProps(separatorPadding: 16),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:the_habits/core/utils/get_timezone_name.dart';
import 'package:the_habits/core/utils/convert_timeofday_to_24hour.dart';

class ReminderSwitch extends StatelessWidget {
  final bool hasReminder;
  final TimeOfDay? reminderTime;
  final ValueChanged<bool> onChanged;

  const ReminderSwitch({
    required this.hasReminder,
    required this.reminderTime,
    required this.onChanged,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SwitchListTile(
      value: hasReminder,
      onChanged: onChanged,
      title: Text('Has Reminder', style: TextStyle(color: colorScheme.primary)),
      subtitle: hasReminder
          ? Text(
              '${convertTimeOfDayTo24Hour(reminderTime)} ${getTimeZoneName()}',
              style: TextStyle(color: colorScheme.primary),
            )
          : null,
    );
  }
}

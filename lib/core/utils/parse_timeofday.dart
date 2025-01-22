import 'package:flutter/material.dart';

TimeOfDay parseTimeOfDay(String time) {
  final parts = time.split(':');

  return TimeOfDay(
    hour: int.parse(parts[0]),
    minute: int.parse(
      parts[1],
    ),
  );
}

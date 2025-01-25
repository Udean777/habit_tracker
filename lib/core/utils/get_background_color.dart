import 'package:flutter/material.dart';

Color getBackgroundColor(String title) {
  final colors = [
    Colors.purple.withValues(alpha: 0.3),
    Colors.blue.withValues(alpha: 0.3),
    Colors.green.withValues(alpha: 0.3),
    Colors.orange.withValues(alpha: 0.3),
  ];

  return colors[title.hashCode % colors.length];
}

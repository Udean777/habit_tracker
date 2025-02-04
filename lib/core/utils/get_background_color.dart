import 'package:flutter/material.dart';

Color getBackgroundColor(String title) {
  final colors = [
    Colors.purple.withAlpha(76),
    Colors.blue.withAlpha(76),
    Colors.green.withAlpha(76),
    Colors.orange.withAlpha(76),
    Colors.red.withAlpha(76),
    Colors.yellow.withAlpha(76),
  ];

  return colors[title.hashCode % colors.length];
}

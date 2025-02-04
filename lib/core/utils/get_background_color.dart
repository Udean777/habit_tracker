import 'package:flutter/material.dart';

Color getBackgroundColor(BuildContext context, String title) {
  final lightColors = [
    Colors.purple.withAlpha(150),
    Colors.blue.withAlpha(150),
    Colors.green.withAlpha(150),
    Colors.orange.withAlpha(150),
    Colors.red.withAlpha(150),
    Colors.yellow.withAlpha(150),
  ];

  final darkColors = [
    Colors.purple.withAlpha(76),
    Colors.blue.withAlpha(76),
    Colors.green.withAlpha(76),
    Colors.orange.withAlpha(76),
    Colors.red.withAlpha(76),
    Colors.yellow.withAlpha(76),
  ];

  final colors = Theme.of(context).brightness == Brightness.dark
      ? darkColors
      : lightColors;

  return colors[title.hashCode % colors.length];
}

import 'package:flutter/material.dart';

List<TextSpan> parseFormattedText(
    String text, TextStyle baseStyle, bool isUser, ColorScheme colorScheme) {
  List<TextSpan> spans = [];
  RegExp exp = RegExp(r'(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)');
  int lastIndex = 0;

  Color textColor = isUser ? colorScheme.onPrimary : colorScheme.primary;

  for (Match match in exp.allMatches(text)) {
    if (match.start > lastIndex) {
      spans.add(TextSpan(
        text: text.substring(lastIndex, match.start),
        style: baseStyle.copyWith(color: textColor),
      ));
    }

    String matchText = match.group(0)!;
    if (matchText.startsWith('**') || matchText.startsWith('__')) {
      spans.add(TextSpan(
        text: matchText.substring(2, matchText.length - 2),
        style: baseStyle.copyWith(
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ));
    } else if (matchText.startsWith('*') || matchText.startsWith('_')) {
      spans.add(TextSpan(
        text: matchText.substring(1, matchText.length - 1),
        style: baseStyle.copyWith(
          fontStyle: FontStyle.italic,
          color: textColor,
        ),
      ));
    }

    lastIndex = match.end;
  }

  if (lastIndex < text.length) {
    spans.add(TextSpan(
      text: text.substring(lastIndex),
      style: baseStyle.copyWith(color: textColor),
    ));
  }

  return spans;
}

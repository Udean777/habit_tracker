import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:the_habits/core/database/chat_database.dart';
import 'package:the_habits/core/widgets/shimmer_loading.dart';

class MainContent extends StatelessWidget {
  final bool isLoading;
  final List<ChatMessage> messages;

  const MainContent({
    super.key,
    required this.isLoading,
    required this.messages,
  });

  // Helper function to parse formatted text into TextSpans
  List<TextSpan> parseFormattedText(String text, TextStyle baseStyle) {
    List<TextSpan> spans = [];

    // Split text into segments
    RegExp exp = RegExp(r'(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)');
    int lastIndex = 0;

    for (Match match in exp.allMatches(text)) {
      // Add text before the match
      if (match.start > lastIndex) {
        spans.add(TextSpan(
          text: text.substring(lastIndex, match.start),
          style: baseStyle,
        ));
      }

      String matchText = match.group(0)!;
      // Handle different formatting cases
      if (matchText.startsWith('**') || matchText.startsWith('__')) {
        // Bold text
        spans.add(TextSpan(
          text: matchText.substring(2, matchText.length - 2),
          style: baseStyle.copyWith(fontWeight: FontWeight.bold),
        ));
      } else if (matchText.startsWith('*') || matchText.startsWith('_')) {
        // Italic text
        spans.add(TextSpan(
          text: matchText.substring(1, matchText.length - 1),
          style: baseStyle.copyWith(fontStyle: FontStyle.italic),
        ));
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastIndex),
        style: baseStyle,
      ));
    }

    return spans;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    // Sort messages in chronological order (oldest to newest)
    final sortedMessages = List<ChatMessage>.from(messages)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    return Column(
      children: [
        Expanded(
          child: messages.isEmpty
              ? Center(
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: 'Hello, i\'m Gemini\n',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            foreground: Paint()
                              ..shader = LinearGradient(
                                colors: [Colors.blue, Colors.purple],
                              ).createShader(
                                Rect.fromLTWH(0, 0, 200, 70),
                              ),
                          ),
                        ),
                        TextSpan(
                          text: 'What you wanna ask?',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            foreground: Paint()
                              ..shader = LinearGradient(
                                colors: [Colors.blue, Colors.purple],
                              ).createShader(
                                Rect.fromLTWH(0, 0, 200, 70),
                              ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: sortedMessages.length + (isLoading ? 1 : 0),
                  reverse: true,
                  itemBuilder: (context, index) {
                    if (isLoading && index == 0) {
                      return const ShimmerLoading();
                    }

                    final messageIndex = isLoading ? index - 1 : index;
                    if (messageIndex < 0) return null;

                    final actualIndex =
                        sortedMessages.length - 1 - messageIndex;
                    final message = sortedMessages[actualIndex];

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildMessageCard(
                          message.message,
                          'You',
                          Colors.blue.withValues(alpha: 0.8),
                          colorScheme,
                          message.timestamp,
                        ),
                        const SizedBox(height: 8),
                        _buildMessageCard(
                          message.response,
                          'Gemini',
                          Colors.grey[900]!,
                          colorScheme,
                          message.timestamp,
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMessageCard(
    String text,
    String sender,
    Color backgroundColor,
    ColorScheme colorScheme,
    DateTime timestamp,
  ) {
    bool isUser = sender == 'You';
    String formattedTime = DateFormat('hh:mm a').format(timestamp);

    TextStyle baseStyle = TextStyle(
      color: colorScheme.primary,
      fontSize: 16,
    );

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.all(16),
        constraints: const BoxConstraints(
          maxWidth: 350,
        ),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              sender,
              style: TextStyle(
                color: colorScheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                children: parseFormattedText(text, baseStyle),
              ),
            ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.bottomRight,
              child: Text(
                formattedTime,
                style: TextStyle(
                  color: colorScheme.secondary,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

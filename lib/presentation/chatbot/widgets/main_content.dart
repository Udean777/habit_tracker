import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:the_habits/core/database/chat_database.dart';
import 'package:the_habits/core/utils/parse_formatted_text.dart';
import 'package:the_habits/core/widgets/shimmer_loading.dart';

class MainContent extends StatelessWidget {
  final bool isLoading;
  final List<ChatMessage> messages;

  const MainContent({
    super.key,
    required this.isLoading,
    required this.messages,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final sortedMessages = List<ChatMessage>.from(messages)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    return Column(
      children: [
        Expanded(
          child: messages.isEmpty
              ? _buildEmptyState(context)
              : ListView.builder(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                          colorScheme.primary,
                          colorScheme.onPrimary,
                          message.timestamp,
                          colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _buildMessageCard(
                          message.response,
                          'Gemini',
                          colorScheme.surface,
                          colorScheme.onSurface,
                          message.timestamp,
                          colorScheme,
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

  Widget _buildEmptyState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 80,
            color: colorScheme.primary.withValues(alpha: 0.6),
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start chatting with Gemini!',
            style: TextStyle(
              fontSize: 16,
              color: colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageCard(
    String text,
    String sender,
    Color backgroundColor,
    Color textColor,
    DateTime timestamp,
    ColorScheme colorScheme,
  ) {
    bool isUser = sender == 'You';
    String formattedTime = DateFormat('hh:mm a').format(timestamp);

    TextStyle baseStyle = TextStyle(
      color: textColor,
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
          borderRadius: BorderRadius.circular(16),
          border:
              isUser ? null : Border.all(color: Colors.grey.shade300, width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              sender,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                children: parseFormattedText(
                  text,
                  baseStyle,
                  isUser,
                  colorScheme,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.bottomRight,
              child: Text(
                formattedTime,
                style: TextStyle(
                  color: textColor.withValues(alpha: 0.7),
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

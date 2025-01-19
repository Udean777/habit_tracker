// main_content.dart
import 'package:flutter/material.dart';
import 'package:the_habits/core/widgets/shimmer_loading.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';

class MainContent extends StatelessWidget {
  final bool isLoading;
  final ChatHistory? selectedChat;

  const MainContent({
    super.key,
    required this.isLoading,
    this.selectedChat,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      color: Colors.black,
      child: Column(
        children: [
          Expanded(
            child: selectedChat == null || selectedChat!.messages.isEmpty
                ? Expanded(
                    child: Center(
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
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount:
                        selectedChat!.messages.length + (isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (isLoading && index == selectedChat!.messages.length) {
                        return const ShimmerLoading();
                      }

                      final message = selectedChat!.messages[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: message.isUserMessage
                              ? Colors.blue.withValues(alpha: 0.8)
                              : Colors.grey[900],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message.isUserMessage ? 'You' : 'Gemini',
                              style: TextStyle(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              message.content,
                              style: TextStyle(color: colorScheme.primary),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

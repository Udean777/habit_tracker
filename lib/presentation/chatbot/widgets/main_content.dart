import 'package:flutter/material.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';

class MainContent extends StatelessWidget {
  final ChatHistory? selectedChat;
  final bool isLoading;

  const MainContent({
    super.key,
    required this.selectedChat,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (selectedChat == null || selectedChat!.messages.isEmpty)
          Expanded(
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
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: selectedChat!.messages.length,
              itemBuilder: (context, index) {
                final message = selectedChat!.messages[index];
                return Align(
                  alignment: message.isUserMessage
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.7,
                    ),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: message.isUserMessage
                          ? Colors.blue
                          : Colors.grey[900],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: message.isUserMessage
                          ? CrossAxisAlignment.end
                          : CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.content,
                          style: const TextStyle(
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          message.timestamp.toString().substring(11, 16),
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        if (isLoading)
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: CircularProgressIndicator(),
          ),
      ],
    );
  }
}

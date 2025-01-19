import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';

class Sidebar extends StatelessWidget {
  final List<ChatHistory> chatHistories;
  final ChatHistory? selectedChat;
  final Function(ChatHistory) onSelectChat;
  final Function onCreateNewChat;

  const Sidebar({
    super.key,
    required this.chatHistories,
    required this.selectedChat,
    required this.onSelectChat,
    required this.onCreateNewChat,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      color: Colors.grey[900],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: () {
                onCreateNewChat();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(45),
              ),
              child: const Text('New Chat'),
            ),
          ),
          Expanded(
            child: ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: chatHistories.length,
              itemBuilder: (context, index) {
                final chat = chatHistories[index];
                return ListTile(
                  title: Text(
                    chat.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: chat.id == selectedChat?.id
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    DateFormat('EEE, M/d/y').format(chat.createdAt),
                    style: TextStyle(color: Colors.grey[400]),
                  ),
                  selected: chat.id == selectedChat?.id,
                  selectedTileColor: Colors.white,
                  onTap: () => onSelectChat(chat),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

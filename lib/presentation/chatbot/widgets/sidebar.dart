import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';

class Sidebar extends StatelessWidget {
  final List<ChatHistory> chatHistories;
  final ChatHistory? selectedChat;
  final Function(ChatHistory) onSelectChat;
  final Function onCreateNewChat;
  final Function(String) onDeleteChat;

  const Sidebar({
    super.key,
    required this.chatHistories,
    required this.selectedChat,
    required this.onSelectChat,
    required this.onCreateNewChat,
    required this.onDeleteChat,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    void showDeleteConfirmationDialog(BuildContext context, ChatHistory chat) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(
            'Delete Chat',
            style: TextStyle(color: colorScheme.primary),
          ),
          content: Text(
            'Are you sure you want to delete this chat?',
            style: TextStyle(color: colorScheme.primary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Cancel',
                style: TextStyle(color: colorScheme.primary),
              ),
            ),
            TextButton(
              onPressed: () {
                onDeleteChat(chat.id);
                Navigator.of(context).pop();
              },
              child: Text(
                'Delete',
                style: TextStyle(color: Colors.red),
              ),
            )
          ],
        ),
      );
    }

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
                backgroundColor: colorScheme.primary,
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
                      color: colorScheme.primary,
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
                  selectedTileColor: colorScheme.primary,
                  onTap: () => onSelectChat(chat),
                  trailing: PopupMenuButton(
                    onSelected: (value) {
                      if (value == 'delete') {
                        showDeleteConfirmationDialog(context, chat);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'delete',
                        child: ListTile(
                          leading: Icon(Icons.delete, color: Colors.red),
                          title: Text('Delete Chat'),
                        ),
                      ),
                    ],
                    icon: Icon(
                      Icons.more_horiz,
                      color: colorScheme.primary,
                    ),
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

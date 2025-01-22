import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:the_habits/core/database/chat_database.dart';
import 'dart:developer' as developer;

class Sidebar extends StatelessWidget {
  final List<SessionWithMessagesCount> chatSessions;
  final VoidCallback onNewChat;
  final Function(int) onSelectSession;
  final Function(int) onDeleteSession;
  final int? currentSessionId;

  const Sidebar({
    super.key,
    required this.chatSessions,
    required this.onNewChat,
    required this.onSelectSession,
    required this.onDeleteSession,
    this.currentSessionId,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      width: 300,
      color: Colors.grey[900],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: onNewChat,
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(45),
              ),
              child: Text(
                'New Chat',
                style: TextStyle(
                  color: colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: chatSessions.length,
              itemBuilder: (context, index) {
                final session = chatSessions[index];
                final isSelected = session.session.id == currentSessionId;

                developer.log(DateTime.now().toString());

                // print(session.session);

                return ListTile(
                  selected: isSelected,
                  selectedTileColor: Colors.grey[800],
                  title: Text(
                    session.session.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isSelected ? colorScheme.primary : Colors.grey,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    // ignore: unnecessary_type_check
                    DateFormat('hh:mm a').format(session.session.timestamp),
                    style: TextStyle(color: Colors.grey[400]),
                  ),
                  onTap: () => onSelectSession(session.session.id),
                  trailing: PopupMenuButton<String>(
                    icon: Icon(
                      Icons.more_horiz,
                      color: Colors.grey[400],
                    ),
                    itemBuilder: (BuildContext context) => [
                      PopupMenuItem<String>(
                        value: 'delete',
                        child: Row(
                          children: const [
                            Icon(
                              Icons.delete,
                              size: 20,
                              color: Colors.red,
                            ),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (String value) {
                      if (value == 'delete') {
                        showDialog(
                          context: context,
                          builder: (BuildContext context) {
                            return AlertDialog(
                              title: const Text('Delete Chat'),
                              content: const Text(
                                  'Are you sure you want to delete this chat?'),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                    onDeleteSession(session.session.id);
                                  },
                                  child: const Text(
                                    'Delete',
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            );
                          },
                        );
                      }
                    },
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

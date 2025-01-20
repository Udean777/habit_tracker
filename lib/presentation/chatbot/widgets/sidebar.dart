import 'package:flutter/material.dart';
import 'package:the_habits/core/database/chat_database.dart';

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

                return Dismissible(
                  key: Key('chat_session_${session.session.id}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: Colors.red,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 16.0),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) => onDeleteSession(session.session.id),
                  child: ListTile(
                    selected: isSelected,
                    selectedTileColor: Colors.grey[800],
                    title: Text(
                      session.session.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isSelected
                            ? colorScheme.primary
                            : colorScheme.onSurface,
                      ),
                    ),
                    subtitle: Text(
                      // ignore: unnecessary_null_comparison
                      '${session.session.createdAt}',
                      style: TextStyle(color: Colors.grey[400]),
                    ),
                    onTap: () => onSelectSession(session.session.id),
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

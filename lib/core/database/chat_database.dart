import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'chat_database.g.dart';

class ChatSessions extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text().withDefault(const Constant('New Chat'))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get timestamp => dateTime()();
}

class ChatMessages extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get sessionId => integer().references(ChatSessions, #id)();
  TextColumn get message => text()();
  TextColumn get response => text()();
  DateTimeColumn get timestamp => dateTime()();
}

@DriftDatabase(tables: [ChatSessions, ChatMessages])
class ChatDatabase extends _$ChatDatabase {
  ChatDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 3) {
            await customStatement(
                'UPDATE chat_sessions SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL');
            await customStatement(
                'UPDATE chat_sessions SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL');
            await customStatement(
                'UPDATE chat_messages SET timestamp = CURRENT_TIMESTAMP WHERE timestamp IS NULL');
          }
        },
      );

  Future<int> createChatSession() async {
    final now = DateTime.now();
    return into(chatSessions).insert(
      ChatSessionsCompanion.insert(
        createdAt: now,
        updatedAt: now,
        timestamp: now,
      ),
    );
  }

  Stream<List<SessionWithMessagesCount>> watchSessionsWithMessageCount() {
    return customSelect(
      '''
      SELECT 
        s.id as id,
        s.title as title,
        s.created_at as created_at,
        s.updated_at as updated_at,
        s.timestamp as timestamp,
        COUNT(m.id) as message_count 
      FROM chat_sessions s 
      LEFT JOIN chat_messages m ON s.id = m.session_id 
      GROUP BY s.id 
      ORDER BY s.updated_at ASC
      ''',
      readsFrom: {chatSessions, chatMessages},
    ).watch().map((rows) {
      return rows.map((row) {
        return SessionWithMessagesCount(
          ChatSession(
            id: row.read<int>('id'),
            title: row.read<String>('title'),
            createdAt: DateTime.parse(row.read<String>('created_at')),
            updatedAt: DateTime.parse(row.read<String>('updated_at')),
            timestamp: DateTime.parse(row.read<String>('timestamp')),
          ),
          row.read<int>('message_count'),
        );
      }).toList();
    });
  }

  Future<List<ChatMessage>> getMessagesForSession(int sessionId) {
    return (select(chatMessages)
          ..where((t) => t.sessionId.equals(sessionId))
          ..orderBy([(t) => OrderingTerm(expression: t.timestamp)]))
        .get();
  }

  Future<void> updateSessionTitle(int sessionId, String title) async {
    await (update(chatSessions)..where((t) => t.id.equals(sessionId))).write(
      ChatSessionsCompanion(
        title: Value(title),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> addMessage(
      int sessionId, String message, String response) async {
    final now = DateTime.now();
    await transaction(() async {
      // Get the session to check if it's the first message
      final session = await (select(chatSessions)
            ..where((t) => t.id.equals(sessionId)))
          .getSingle();

      // If the title is still 'New Chat', update it with the first message
      if (session.title == 'New Chat') {
        // Truncate the message if it's too long (e.g., first 50 characters)
        final truncatedTitle =
            message.length > 50 ? '${message.substring(0, 47)}...' : message;

        await updateSessionTitle(sessionId, truncatedTitle);
      }

      await into(chatMessages).insert(
        ChatMessagesCompanion.insert(
          sessionId: sessionId,
          message: message,
          response: response,
          timestamp: now,
        ),
      );

      await (update(chatSessions)..where((t) => t.id.equals(sessionId))).write(
        ChatSessionsCompanion(
          updatedAt: Value(now),
        ),
      );
    });
  }

  Future<void> deleteSession(int sessionId) async {
    await transaction(() async {
      await (delete(chatMessages)..where((t) => t.sessionId.equals(sessionId)))
          .go();
      await (delete(chatSessions)..where((t) => t.id.equals(sessionId))).go();
    });
  }

  Future<void> deleteAllSessions() async {
    await transaction(() async {
      await delete(chatMessages).go();
      await delete(chatSessions).go();
    });
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'chat.db'));
    return NativeDatabase.createInBackground(file);
  });
}

class SessionWithMessagesCount {
  final ChatSession session;
  final int messageCount;

  SessionWithMessagesCount(this.session, this.messageCount);
}

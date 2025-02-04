import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'chat_tables.dart';

/// Bagian file yang dihasilkan oleh Drift
part 'chat_database.g.dart';

/// Kelas database Drift untuk mengelola sesi obrolan dan pesan
@DriftDatabase(tables: [ChatSessions, ChatMessages])
class ChatDatabase extends _$ChatDatabase {
  /// Konstruktor untuk membuka koneksi database
  ChatDatabase() : super(_openConnection());

  /// Versi skema dari database
  @override
  int get schemaVersion => 4;

  /// Strategi migrasi untuk menangani perubahan skema database
  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          /// Membuat semua tabel saat database pertama kali dibuat
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          /// Menangani peningkatan database
          if (from < 4) {}
        },
      );

  // Update method createChatSession dengan tipe data yang benar
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

  /// Stream untuk memantau sesi obrolan dengan jumlah pesan di setiap sesi
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
            createdAt: row.read<DateTime>('created_at'),
            updatedAt: row.read<DateTime>('updated_at'),
            timestamp: row.read<DateTime>('timestamp'),
          ),
          row.read<int>('message_count'),
        );
      }).toList();
    });
  }

  /// Mendapatkan semua pesan untuk sesi obrolan tertentu
  Future<List<ChatMessage>> getMessagesForSession(int sessionId) {
    return (select(chatMessages)
          ..where((t) => t.sessionId.equals(sessionId))
          ..orderBy([(t) => OrderingTerm(expression: t.timestamp)]))
        .get();
  }

  /// Memperbarui judul sesi obrolan
  Future<void> updateSessionTitle(int sessionId, String title) async {
    await (update(chatSessions)..where((t) => t.id.equals(sessionId))).write(
      ChatSessionsCompanion(
        title: Value(title),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Menambahkan pesan ke sesi obrolan dan memperbarui judul sesi jika itu adalah pesan pertama
  Future<void> addMessage(
      int sessionId, String message, String response) async {
    final now = DateTime.now();
    await transaction(() async {
      final session = await (select(chatSessions)
            ..where((t) => t.id.equals(sessionId)))
          .getSingle();

      if (session.title == 'New Chat') {
        final truncatedTitle =
            message.length > 50 ? '${message.substring(0, 47)}...' : message;
        await updateSessionTitle(sessionId, truncatedTitle);
      }

      await into(chatMessages).insert(
        ChatMessagesCompanion.insert(
          sessionId: sessionId,
          message: message,
          response: response,
          timestamp: now, // Langsung menggunakan DateTime
        ),
      );

      await (update(chatSessions)..where((t) => t.id.equals(sessionId))).write(
        ChatSessionsCompanion(
          updatedAt: Value(now), // Langsung menggunakan DateTime
        ),
      );
    });
  }

  /// Menghapus sesi obrolan dan semua pesannya
  Future<void> deleteSession(int sessionId) async {
    await transaction(() async {
      await (delete(chatMessages)..where((t) => t.sessionId.equals(sessionId)))
          .go();
      await (delete(chatSessions)..where((t) => t.id.equals(sessionId))).go();
    });
  }

  /// Menghapus semua sesi obrolan dan pesan-pesannya
  Future<void> deleteAllSessions() async {
    await transaction(() async {
      await delete(chatMessages).go();
      await delete(chatSessions).go();
    });
  }
}

/// Membuka koneksi ke database
LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'chat.db'));
    return NativeDatabase.createInBackground(file);
  });
}

/// Kelas untuk menyimpan sesi obrolan dan jumlah pesan dalam sesi tersebut
class SessionWithMessagesCount {
  final ChatSession session;
  final int messageCount;

  SessionWithMessagesCount(this.session, this.messageCount);
}

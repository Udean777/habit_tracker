import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/core/database/chat_database.dart';

final chatDatabaseProvider = Provider<ChatDatabase>((ref) {
  return ChatDatabase();
});

final currentSessionIdProvider = StateProvider<int?>((ref) => null);

final chatSessionsProvider =
    StreamProvider<List<SessionWithMessagesCount>>((ref) {
  final database = ref.watch(chatDatabaseProvider);
  return database.watchSessionsWithMessageCount();
});

final currentSessionMessagesProvider = StreamProvider<List<ChatMessage>>((ref) {
  final database = ref.watch(chatDatabaseProvider);
  final sessionId = ref.watch(currentSessionIdProvider);

  if (sessionId == null) {
    return Stream.value([]);
  }

  return (database.select(database.chatMessages)
        ..where((tbl) => tbl.sessionId.equals(sessionId))
        ..orderBy([(t) => OrderingTerm(expression: t.timestamp)]))
      .watch();
});

final chatControllerProvider =
    StateNotifierProvider<ChatController, AsyncValue<void>>((ref) {
  return ChatController(ref);
});

class ChatController extends StateNotifier<AsyncValue<void>> {
  final Ref _ref;

  ChatController(this._ref) : super(const AsyncValue.data(null));

  Future<void> createNewSession() async {
    state = const AsyncValue.loading();
    try {
      final database = _ref.read(chatDatabaseProvider);
      final sessionId = await database.createChatSession();
      _ref.read(currentSessionIdProvider.notifier).state = sessionId;
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addMessage(String message, String response) async {
    state = const AsyncValue.loading();
    try {
      final database = _ref.read(chatDatabaseProvider);
      var sessionId = _ref.read(currentSessionIdProvider);

      if (sessionId == null) {
        sessionId = await database.createChatSession();
        _ref.read(currentSessionIdProvider.notifier).state = sessionId;
      }

      await database.addMessage(sessionId, message, response);
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteSession(int sessionId) async {
    state = const AsyncValue.loading();
    try {
      final database = _ref.read(chatDatabaseProvider);
      await database.deleteSession(sessionId);

      if (_ref.read(currentSessionIdProvider) == sessionId) {
        _ref.read(currentSessionIdProvider.notifier).state = null;
      }

      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteAllSessions() async {
    state = const AsyncValue.loading();
    try {
      await _ref.read(chatDatabaseProvider).deleteAllSessions();
      _ref.read(currentSessionIdProvider.notifier).state = null;
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

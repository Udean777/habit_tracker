import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/presentation/chatbot/repositories/chat_repository.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  throw Exception('ChatRepository is not initialized.');
});

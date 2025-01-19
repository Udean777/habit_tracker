import 'package:the_habits/presentation/chatbot/models/chat_models.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ChatRepository {
  static const String chatBoxName = 'chats';
  Box<ChatHistoryHive>? _chatBox;

  Future<void> init() async {
    await Hive.initFlutter();

    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(ChatMessageHiveAdapter());
    }

    if (!Hive.isAdapterRegistered(1)) {
      Hive.registerAdapter(ChatHistoryHiveAdapter());
    }

    _chatBox = await Hive.openBox<ChatHistoryHive>(chatBoxName);
  }

  Future<List<ChatHistoryHive>> getAllChats() async {
    if (_chatBox == null) {
      throw Exception('ChatRepository is not initialized. Call init() first.');
    }
    return _chatBox!.values.toList();
  }

  Future<void> saveChat(ChatHistoryHive chat) async {
    if (_chatBox == null) {
      throw Exception('ChatRepository is not initialized. Call init() first.');
    }
    await _chatBox!.put(chat.id, chat);
  }

  Future<void> deleteChat(String chatId) async {
    if (_chatBox == null) {
      throw Exception('ChatRepository is not initialized. Call init() first.');
    }
    await _chatBox!.delete(chatId);
  }

  Future<void> updateChatTitle(String chatId, String newTitle) async {
    if (_chatBox == null) {
      throw Exception('ChatRepository is not initialized. Call init() first.');
    }
    final chat = _chatBox!.get(chatId);
    if (chat != null) {
      chat.title = newTitle;
      await _chatBox!.put(chatId, chat);
    }
  }

  Future<void> addMessageToChat(String chatId, ChatMessageHive message) async {
    if (_chatBox == null) {
      throw Exception('ChatRepository is not initialized. Call init() first.');
    }
    final chat = _chatBox!.get(chatId);
    if (chat != null) {
      chat.messages.add(message);
      await _chatBox!.put(chatId, chat);
    }
  }
}

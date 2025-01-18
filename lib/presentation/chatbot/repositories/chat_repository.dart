import 'package:the_habits/presentation/chatbot/models/chat_models.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// The `ChatRepository` class provides methods to interact with the Hive database
/// for storing and retrieving chat history and messages.
///
/// This class uses the Hive package to manage a local database of chat histories.
/// It includes methods to initialize the database, retrieve all chats, save a chat,
/// delete a chat, update a chat's title, and add messages to a chat.

class ChatRepository {
  static const String chatBoxName =
      'chats'; // Mendefinisikan nama box Hive untuk menyimpan chat
  late Box<ChatHistoryHive>
      _chatBox; // Mendeklarasikan variabel untuk box Hive yang akan digunakan

  Future<void> init() async {
    await Hive.initFlutter(); // Inisialisasi Hive dengan Hive Flutter

    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(
          ChatMessageHiveAdapter()); // Mendaftarkan adapter untuk ChatMessageHive jika belum terdaftar
    }

    if (!Hive.isAdapterRegistered(1)) {
      Hive.registerAdapter(
          ChatHistoryHiveAdapter()); // Mendaftarkan adapter untuk ChatHistoryHive jika belum terdaftar
    }

    _chatBox = await Hive.openBox<ChatHistoryHive>(
        chatBoxName); // Membuka box Hive dengan nama 'chats' dan menyimpannya di variabel _chatBox
  }

  Future<List<ChatHistoryHive>> getAllChats() async {
    return _chatBox.values
        .toList(); // Mengambil semua chat dari box Hive dan mengembalikannya sebagai list
  }

  Future<void> saveChat(ChatHistoryHive chat) async {
    return _chatBox.put(chat.id,
        chat); // Menyimpan chat ke dalam box Hive dengan key berupa id chat
  }

  Future<void> deleteChat(String chatId) async {
    await _chatBox
        .delete(chatId); // Menghapus chat dari box Hive berdasarkan id chat
  }

  Future<void> updateChatTitle(String chatId, String newTitle) async {
    final chat = _chatBox
        .get(chatId); // Mengambil chat dari box Hive berdasarkan id chat

    if (chat != null) {
      chat.title = newTitle; // Mengubah judul chat
      await _chatBox.put(chatId,
          chat); // Menyimpan kembali chat yang telah diperbarui ke dalam box Hive
    }
  }

  Future<void> addMessageToChat(String chatId, ChatMessageHive message) async {
    final chat = _chatBox
        .get(chatId); // Mengambil chat dari box Hive berdasarkan id chat

    if (chat != null) {
      chat.messages
          .add(message); // Menambahkan pesan baru ke dalam list pesan di chat
      await _chatBox.put(chatId,
          chat); // Menyimpan kembali chat yang telah diperbarui ke dalam box Hive
    }
  }
}

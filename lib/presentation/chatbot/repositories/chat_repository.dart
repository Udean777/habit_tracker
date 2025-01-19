import 'package:the_habits/presentation/chatbot/models/chat_models.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Kelas `ChatRepository` menyediakan metode untuk berinteraksi dengan database Hive
/// untuk menyimpan dan mengambil riwayat chat dan pesan.
///
/// Kelas ini menggunakan paket Hive untuk mengelola database lokal riwayat chat.
/// Ini termasuk metode untuk menginisialisasi database, mengambil semua chat, menyimpan chat,
/// menghapus chat, memperbarui judul chat, dan menambahkan pesan ke chat.

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

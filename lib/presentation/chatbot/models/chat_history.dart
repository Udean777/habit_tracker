import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:habit_tracker/presentation/chatbot/models/chat_message.dart';

class ChatHistory {
  final String id;
  String title;
  final DateTime createdAt;
  final List<ChatMessage> messages;
  late final ChatSession chat;

  // Konstruktor untuk menginisialisasi objek ChatHistory
  ChatHistory({
    // Parameter yang wajib diisi saat membuat objek ChatHistory
    required this.id,
    required this.title,
    required this.createdAt,
    required this.messages,
    required GenerativeModel model, // Parameter tambahan untuk model generatif
  }) {
    // Inisialisasi variabel chat dengan memulai sesi chat menggunakan model generatif
    chat = model.startChat();
  }
}

import 'package:hive/hive.dart';

// Bagian ini menghubungkan file ini dengan file yang dihasilkan oleh Hive
part 'chat_models.g.dart';

// Mendefinisikan tipe Hive dengan typeId 0
@HiveType(typeId: 0)
class ChatMessageHive {
  // Mendefinisikan field Hive dengan index 0
  @HiveField(0)
  final String content; // Konten pesan

  // Mendefinisikan field Hive dengan index 1
  @HiveField(1)
  final bool isUserMessage; // Menandakan apakah pesan dari pengguna

  // Mendefinisikan field Hive dengan index 2
  @HiveField(2)
  final DateTime timestamp; // Waktu pesan dibuat

  // Konstruktor untuk inisialisasi ChatMessageHive
  ChatMessageHive({
    required this.content, // Konten pesan harus diisi
    required this.isUserMessage, // Status pesan harus diisi
    required this.timestamp, // Waktu pesan harus diisi
  });
}

// Mendefinisikan tipe Hive dengan typeId 1
@HiveType(typeId: 1)
class ChatHistoryHive {
  // Mendefinisikan field Hive dengan index 0
  @HiveField(0)
  final String id; // ID riwayat chat

  // Mendefinisikan field Hive dengan index 1
  @HiveField(1)
  String title; // Judul riwayat chat

  // Mendefinisikan field Hive dengan index 2
  @HiveField(2)
  final DateTime createdAt; // Waktu riwayat chat dibuat

  // Mendefinisikan field Hive dengan index 3
  @HiveField(3)
  final List<ChatMessageHive> messages; // Daftar pesan dalam riwayat chat

  // Konstruktor untuk inisialisasi ChatHistoryHive
  ChatHistoryHive({
    required this.id, // ID riwayat chat harus diisi
    required this.title, // Judul riwayat chat harus diisi
    required this.createdAt, // Waktu riwayat chat harus diisi
    required this.messages, // Daftar pesan harus diisi
  });
}

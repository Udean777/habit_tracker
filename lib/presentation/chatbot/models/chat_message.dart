class ChatMessage {
  final String content;
  final bool isUserMessage;
  final DateTime timestamp;

  /// Konstruktor untuk membuat instance ChatMessage.
  ChatMessage({
    required this.content,
    required this.isUserMessage,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  /// Parameter [timestamp] bersifat opsional dan secara default diatur ke tanggal dan waktu saat ini jika tidak disediakan.
}

class ChatMessage {
  final String content;
  final bool isUserMessage;
  final DateTime timestamp;

  /// Constructor for creating a ChatMessage instance.
  ChatMessage({
    required this.content,
    required this.isUserMessage,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  /// The [timestamp] parameter is optional and defaults to the current date and time if not provided.
}

import 'package:hive/hive.dart';

part 'chat_models.g.dart';

@HiveType(typeId: 0)
class ChatMessageHive {
  @HiveField(0)
  final String content;

  @HiveField(1)
  final bool isUserMessage;

  @HiveField(2)
  final DateTime timestamp;

  ChatMessageHive({
    required this.content,
    required this.isUserMessage,
    required this.timestamp,
  });
}

@HiveType(typeId: 1)
class ChatHistoryHive {
  @HiveField(0)
  final String id;

  @HiveField(1)
  String title;

  @HiveField(2)
  final DateTime createdAt;

  @HiveField(3)
  final List<ChatMessageHive> messages;

  ChatHistoryHive({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.messages,
  });
}

import 'package:drift/drift.dart';

class ChatSessions extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text().withDefault(const Constant('New Chat'))();
  DateTimeColumn get createdAt => dateTime()(); // Menggunakan DateTimeColumn
  DateTimeColumn get updatedAt => dateTime()(); // Menggunakan DateTimeColumn
  DateTimeColumn get timestamp => dateTime()(); // Menggunakan DateTimeColumn
}

class ChatMessages extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get sessionId => integer()();
  TextColumn get message => text()();
  TextColumn get response => text()();
  DateTimeColumn get timestamp => dateTime()(); // Menggunakan DateTimeColumn
}

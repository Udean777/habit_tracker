import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'dart:developer' as developer;
import 'package:http/http.dart' as http;
import 'package:the_habits/core/database/database.dart';
import 'package:drift/drift.dart' as drift;
import 'package:the_habits/core/exception/ai_service_exception.dart';
import 'package:the_habits/core/providers/database_provider.dart';

final aiHabitCreationProvider = Provider<AIHabitCreationService>((ref) {
  return AIHabitCreationService(ref);
});

class AIHabitCreationService {
  final Ref ref;

  AIHabitCreationService(this.ref);

  Future<Map<String, dynamic>?> generateHabitFromPrompt(String prompt) async {
    try {
      return await _callGeminiApi(prompt);
    } catch (e) {
      developer.log('Error generating AI habit: $e');
      if (e is AIServiceException) {
        rethrow;
      }
      throw AIServiceException(
          'Terjadi kesalahan saat memproses permintaan AI');
    }
  }

  Future<bool> createHabitFromDetails(Map<String, dynamic> habitDetails) async {
    try {
      final habit = HabitsCompanion.insert(
        title: habitDetails['title'],
        description: drift.Value(habitDetails['description'] ?? ''),
        reminderTime: drift.Value(habitDetails['reminderTime'] ?? ''),
        createdAt: drift.Value(DateTime.now()),
      );

      await ref.read(databaseProvider).createHabit(habit);
      return true;
    } catch (e, stackTrace) {
      developer.log('Error creating AI habit: $e', stackTrace: stackTrace);
      return false;
    }
  }

  Future<Map<String, dynamic>?> _callGeminiApi(String prompt) async {
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    if (apiKey == null || apiKey.isEmpty) {
      developer.log('GEMINI_API_KEY tidak ditemukan di .env.');
      return null;
    }

    final url = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey');

    try {
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'contents': [
            {
              'parts': [
                {
                  'text': '''
                    Ekstrak detail berikut dari input pengguna:
                    1. Judul Habit
                    2. Deskripsi Habit
                    3. Waktu Pengingat (format HH:mm)

                    Berikan output dalam format JSON ketat seperti ini:
                    {
                      "title": "Judul yang diekstrak",
                      "description": "Deskripsi yang diekstrak",
                      "reminderTime": "HH:mm"
                    }

                    Input pengguna:
                    "$prompt"
                  '''
                }
              ]
            }
          ],
          'generationConfig': {
            'temperature': 0.3,
            'topK': 1,
            'topP': 1.0,
            'maxOutputTokens': 200,
            'stopSequences': []
          }
        }),
      );

      if (res.statusCode != 200) {
        developer.log('Gemini API Error: ${res.statusCode} - ${res.body}');
        return null;
      } else if (res.statusCode == 500) {
        throw AIServiceException(
            'Server Gemini sedang mengalami gangguan. Silakan coba lagi nanti.');
      }

      final jsonRes = json.decode(res.body);

      if (jsonRes == null ||
          jsonRes['candidates'] == null ||
          jsonRes['candidates'].isEmpty) {
        developer.log('Gemini API memberikan respons kosong atau tidak valid.');
        return null;
      }

      final content = jsonRes['candidates'][0]['content']['parts'][0]['text'];

      try {
        final parsedContent = json.decode(content);
        if (parsedContent is Map<String, dynamic> &&
            parsedContent.containsKey('title') &&
            parsedContent.containsKey('description') &&
            parsedContent.containsKey('reminderTime')) {
          return parsedContent;
        } else {
          developer.log('Format JSON dari Gemini tidak sesuai: $parsedContent');
        }
      } on AIServiceException catch (e) {
        developer.log('Gemini API Error: ${e.toString()}');
        rethrow; // Re-throw exception untuk ditangkap di UI
      }
    } catch (e) {
      developer.log('Network Error: $e');
      throw AIServiceException(
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }
    return null;
  }
}

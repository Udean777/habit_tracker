import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'dart:developer' as developer;
import 'package:http/http.dart' as http;
import 'package:the_habits/core/database/database.dart';
import 'package:drift/drift.dart' as drift;
import 'package:the_habits/core/providers/database_provider.dart';

final aiHabitCreationProvider = Provider<AIHabitCreationService>((ref) {
  return AIHabitCreationService(ref);
});

class AIHabitCreationService {
  final Ref ref;

  AIHabitCreationService(this.ref);

  Future<Map<String, dynamic>?> generateHabitFromPrompt(String prompt) async {
    try {
      // Make API call to Gemini or another AI service
      final response = await _callGeminiApi(prompt);
      return response;
    } catch (e) {
      print('Error generating AI habit: $e');
      return null;
    }
  }

  Future<bool> createHabitFromDetails(Map<String, dynamic> habitDetails) async {
    try {
      // Create habit using the database method
      final habit = HabitsCompanion.insert(
        title: habitDetails['title'],
        description: drift.Value(habitDetails['description']),
        reminderTime: drift.Value(habitDetails['reminderTime']),
        createdAt: drift.Value(DateTime.now()),
      );

      // Save habit to database
      await ref.read(databaseProvider).createHabit(habit);
      return true;
    } catch (e) {
      print('Error creating AI habit: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> _callGeminiApi(String prompt) async {
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    final url = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$apiKey');

    try {
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: json.encode(
          {
            'contents': [
              {
                'parts': [
                  {
                    'text': '''
                      Extract the following details from the user prompt, using all language users input:
                      1. Habit Title
                      2. Habit Description
                      3. Reminder Time (in HH:mm format)

                      Respond in strict JSON format:
                      {
                        "title": "Extracted Title",
                        "description": "Extracted Description",
                        "reminderTime": "HH:mm format time"
                      }

                      Prompt: $prompt
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
          },
        ),
      );

      if (res.statusCode == 200) {
        final jsonRes = json.decode(res.body);
        final content = jsonRes['candidates'][0]['content']['parts'][0]['text'];

        final parsedContent = json.decode(content);

        return parsedContent;
      }
    } catch (e) {
      developer.log('Gemini API Error: $e');
    }
    return null;
  }
}

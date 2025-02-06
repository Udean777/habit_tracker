import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/core/exception/ai_service_exception.dart';
import 'package:the_habits/core/providers/ai_habit_provider.dart';
import 'package:the_habits/presentation/habit/create_habit_page.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_approve_dialog.dart';
import 'package:the_habits/presentation/habit/widgets/ai_habit_prompt_dialog.dart';

Future<void> createHabitWithAI(
  BuildContext context,
  WidgetRef ref,
  ScaffoldMessengerState scaffoldMessenger,
) async {
  final prompt = await showDialog(
    context: context,
    builder: (context) => const AIHabitPromptDialog(),
  );

  if (prompt != null && prompt.isNotEmpty) {
    ref.read(isLoadingProvider.notifier).state = true;

    try {
      final aiService = ref.read(aiHabitCreationProvider);
      final habitDetails = await aiService.generateHabitFromPrompt(prompt);

      if (habitDetails != null && context.mounted) {
        final approved = await showDialog<bool>(
          context: context,
          builder: (context) =>
              AIHabitApprovalDialog(habitDetails: habitDetails),
        );

        if (approved == true) {
          final success = await aiService.createHabitFromDetails(habitDetails);

          if (success && context.mounted) {
            scaffoldMessenger.showSnackBar(
              SnackBar(
                content: Text('Habit created successfully using AI!'),
              ),
            );
          }
        }
      }
    } on AIServiceException catch (e) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Error: ${e.message}'),
        ),
      );
    } catch (e) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('An error occurred while creating the habit from AI'),
        ),
      );
    } finally {
      ref.read(isLoadingProvider.notifier).state = false;
    }
  }
}

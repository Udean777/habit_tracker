import 'package:flutter/material.dart';

class AIHabitPromptDialog extends StatefulWidget {
  const AIHabitPromptDialog({super.key});

  @override
  State<AIHabitPromptDialog> createState() => _AIHabitPromptDialogState();
}

class _AIHabitPromptDialogState extends State<AIHabitPromptDialog> {
  final _promptController = TextEditingController();

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Create Habit with AI'),
      content: TextField(
        controller: _promptController,
        decoration: InputDecoration(
          hintText: "What kind of habit would you like to create?",
        ),
        maxLines: 3,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop(_promptController.text);
          },
          child: Text('Create'),
        ),
      ],
    );
  }
}

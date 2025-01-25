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
      title: Text(
        'Create Habit with AI',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
      ),
      content: TextField(
        controller: _promptController,
        decoration: InputDecoration(
          hintText: 'Enter habit creation prompt',
          helperText: 'Example: Create a morning exercise habit at 6 AM',
          border: OutlineInputBorder(),
        ),
        maxLines: 3,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            'Cancel',
            style: TextStyle(
              color: Colors.red,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop(_promptController.text);
          },
          child: Text('Generate'),
        ),
      ],
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
    );
  }
}

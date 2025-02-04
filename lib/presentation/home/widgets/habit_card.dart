import 'package:flutter/material.dart';
import 'package:the_habits/core/utils/parse_timeofday.dart';

class HabitCard extends StatelessWidget {
  final String title;
  final String description;
  final String reminderTime;
  final bool isCompleted;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  final VoidCallback onComplete;
  final Color backgroundColor;
  final ColorScheme colorScheme;

  const HabitCard({
    required this.title,
    required this.description,
    required this.reminderTime,
    required this.isCompleted,
    required this.onDelete,
    required this.onEdit,
    required this.onComplete,
    required this.backgroundColor,
    super.key,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.library_books_outlined,
            color: colorScheme.onSurface,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.onSurface,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurface,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                Text(
                  parseTimeOfDay(reminderTime).format(context),
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurface,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
              color: colorScheme.onSurface,
            ),
            onPressed: onComplete,
          ),
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert, color: colorScheme.onSurface),
            onSelected: (String value) {
              switch (value) {
                case 'Delete':
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: Text('Confirm Delete'),
                        content:
                            Text('Are you sure you want to delete this habit?'),
                        actions: [
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              onDelete();
                            },
                            child: Text(
                              'Delete',
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      );
                    },
                  );
                  break;
              }
            },
            itemBuilder: (BuildContext context) {
              return [
                PopupMenuItem<String>(
                  value: 'Delete',
                  child: Row(
                    children: [
                      Icon(
                        Icons.delete,
                        color: Color(0xFFE57373),
                      ),
                      SizedBox(width: 8),
                      Text('Delete'),
                    ],
                  ),
                ),
              ];
            },
          ),
        ],
      ),
    );
  }
}

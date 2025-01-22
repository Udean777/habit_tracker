import 'package:flutter/material.dart';

class HabitCard extends StatelessWidget {
  final String title;
  final String description;
  final TimeOfDay reminderTime;
  final bool isCompleted;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  final VoidCallback onComplete;
  final Color backgroundColor;

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
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.library_books_outlined, color: Colors.white70),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
              color: Colors.white70,
            ),
            onPressed: onComplete,
          ),
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert, color: Colors.white70),
            onSelected: (String value) {
              switch (value) {
                // Gonna implement edit later
                // case 'Edit':
                //   onEdit();
                //   break;
                case 'Delete':
                  onDelete();
                  break;
              }
            },
            itemBuilder: (BuildContext context) {
              return [
                // Gonna implement edit later
                // PopupMenuItem<String>(
                //   value: 'Edit',
                //   child: Row(
                //     children: [
                //       Icon(Icons.edit, color: Colors.black),
                //       const SizedBox(width: 8),
                //       Text('Edit'),
                //     ],
                //   ),
                // ),
                PopupMenuItem<String>(
                  value: 'Delete',
                  child: Row(
                    children: [
                      Icon(
                        Icons.delete,
                        color: Color(0xFFE57373),
                      ),
                      const SizedBox(width: 8),
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

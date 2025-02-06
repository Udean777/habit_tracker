import 'package:flutter/material.dart';

class BottomBar extends StatelessWidget {
  final TextEditingController textController;
  final bool isLoading;
  final Function onSendMessage;

  const BottomBar({
    super.key,
    required this.textController,
    required this.isLoading,
    required this.onSendMessage,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: textController,
              decoration: InputDecoration(
                filled: true,
                fillColor: colorScheme.surface,
                hintText: 'Ask Gemini✨',
                hintStyle: TextStyle(
                  color: colorScheme.onSurface.withValues(alpha: 0.5),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              style: TextStyle(
                color: colorScheme.onSurface,
              ),
              keyboardType: TextInputType.multiline,
              maxLines: null,
              onSubmitted: (_) => onSendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: isLoading ? null : onSendMessage as GestureTapCallback,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colorScheme.primary,
              ),
              child: Icon(
                Icons.send,
                color: isLoading
                    ? colorScheme.onSurface.withValues(alpha: 0.5)
                    : colorScheme.onPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

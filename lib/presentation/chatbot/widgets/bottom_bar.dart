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
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: textController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.grey[900],
                hintText: 'Ask Gemini',
                hintStyle: TextStyle(
                  color: Colors.grey[500],
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              style: const TextStyle(
                color: Colors.white,
              ),
              onSubmitted: (_) => onSendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: isLoading ? null : onSendMessage as GestureTapCallback,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: Icon(
                Icons.send,
                color: isLoading ? Colors.grey : Colors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

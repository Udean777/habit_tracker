import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:the_habits/core/providers/theme_provider.dart';
import 'package:the_habits/core/utils/get_greeting_message.dart';

class HomeAppbar extends ConsumerWidget implements PreferredSizeWidget {
  final ColorScheme colorScheme;

  const HomeAppbar({
    super.key,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void switchThemeMode() {
      ref.read(themeModeProvider.notifier).toggleTheme();
    }

    return AppBar(
      backgroundColor: colorScheme.surface,
      elevation: 4,
      shadowColor: colorScheme.onSurface.withValues(alpha: 0.2),
      centerTitle: false,
      actions: [
        IconButton(
          icon: Icon(
            ref.watch(themeModeProvider) == ThemeMode.dark
                ? Icons.brightness_6
                : Icons.dark_mode_rounded,
            color: colorScheme.onSurface,
          ),
          onPressed: () => switchThemeMode(),
        ),
      ],
      title: Row(
        children: [
          SizedBox(width: 8),
          Flexible(
            child: Text(
              getGreetingMessage(DateTime.now()),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: colorScheme.onSurface,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}

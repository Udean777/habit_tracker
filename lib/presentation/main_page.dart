import 'package:flutter/material.dart';
import 'package:the_habits/presentation/chatbot/chat_page.dart';
import 'package:the_habits/presentation/habit/create_habit_page.dart';
import 'package:the_habits/presentation/home/home_page.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

// Define a provider for managing the selected index
final selectedIndexProvider = StateProvider<int>((ref) => 0);

class MainPage extends HookConsumerWidget {
  const MainPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    // Watch the selected index state
    final selectedIndex = ref.watch(selectedIndexProvider);

    final List<Widget> pages = [
      HomePage(),
      CreateHabitPage(),
      ChatPage(),
    ];

    return Scaffold(
      body: pages[selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedIndex,
        onTap: (index) {
          if (index == 1) {
            // Navigate to CreateHabitPage
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const CreateHabitPage(),
              ),
            );
          } else if (index == 2) {
            // Navigate to ChatPage
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ChatPage(),
              ),
            );
          } else {
            // Update the selected index state
            ref.read(selectedIndexProvider.notifier).state = index;
          }
        },
        showSelectedLabels: false,
        showUnselectedLabels: false,
        items: [
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-home-96.png',
              width: 30,
              height: 30,
              color: colorScheme.primary,
            ),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-add-100.png',
              width: 30,
              height: 30,
              color: colorScheme.primary,
            ),
            label: "Create",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-chat-96.png',
              width: 30,
              height: 30,
              color: colorScheme.primary,
            ),
            label: "Chat Bot",
          ),
        ],
        backgroundColor: const Color(0xFF000000),
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: Colors.grey,
      ),
    );
  }
}

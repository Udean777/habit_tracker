import 'package:flutter/material.dart';
import 'package:the_habits/presentation/chatbot/chat_page.dart';
import 'package:the_habits/presentation/habit/create_habit_page.dart';
import 'package:the_habits/presentation/home/home_page.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final selectedIndexProvider = StateProvider<int>((ref) => 0);

class MainPage extends ConsumerWidget {
  const MainPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
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
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const CreateHabitPage(),
              ),
            );
          } else if (index == 2) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ChatPage(),
              ),
            );
          } else {
            ref.read(selectedIndexProvider.notifier).state = index;
          }
        },
        showSelectedLabels: true,
        showUnselectedLabels: true,
        items: [
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-home-96.png',
              width: 30,
              height: 30,
              color: selectedIndex == 0 ? colorScheme.primary : Colors.grey,
            ),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-add-100.png',
              width: 30,
              height: 30,
              color: selectedIndex == 1 ? colorScheme.primary : Colors.grey,
            ),
            label: "Create",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-chat-96.png',
              width: 30,
              height: 30,
              color: selectedIndex == 2 ? colorScheme.primary : Colors.grey,
            ),
            label: "Chat Bot",
          ),
        ],
        backgroundColor: colorScheme.onPrimary,
        selectedItemColor: colorScheme.primary,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        elevation: 10,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:habit_tracker/presentation/chatbot/chat_page.dart';
import 'package:habit_tracker/presentation/habit/create_habit_page.dart';
import 'package:habit_tracker/presentation/home/home_page.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class MainPage extends HookConsumerWidget {
  const MainPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    int selectedIndex = 0;

    final List<Widget> pages = [
      HomePage(),
      CreateHabitPage(),
      ChatPage(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'The Habits',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: pages[selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedIndex,
        onTap: (index) {
          selectedIndex = index;
        },
        showSelectedLabels: false,
        showUnselectedLabels: false,
        items: [
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-home-96.png',
              width: 30,
              height: 30,
              color: Colors.white,
            ),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-add-100.png',
              width: 30,
              height: 30,
              color: Colors.white,
            ),
            label: "Create",
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              'assets/icons8-chat-96.png',
              width: 30,
              height: 30,
              color: Colors.white,
            ),
            label: "Chat Bot",
          ),
        ],
        backgroundColor: const Color(0xFF000000),
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.grey,
      ),
    );
  }
}

import 'package:flutter/material.dart';

/// Shared bottom navigation bar used across all main screens.
///
/// Pass the current [selectedIndex] (0-4) to highlight the active tab.
/// The navigation targets are:
///   0 → /home
///   1 → /rewards
///   2 → /food-hub
///   3 → /family-map
///   4 → /settings
class AppBottomNav extends StatelessWidget {
  final int selectedIndex;
  const AppBottomNav({super.key, this.selectedIndex = 0});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: selectedIndex,
      selectedItemColor: const Color(0xFF388E3C),
      unselectedItemColor: Colors.grey,
      showUnselectedLabels: true,
      onTap: (index) => _onTap(context, index),
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
        BottomNavigationBarItem(
            icon: Icon(Icons.emoji_events_outlined), label: 'Rewards'),
        BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_outlined), label: 'Food Hub'),
        BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined), label: 'Map'),
        BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined), label: 'Settings'),
      ],
    );
  }

  void _onTap(BuildContext context, int index) {
    if (index == selectedIndex) return;
    switch (index) {
      case 0:
        Navigator.pushReplacementNamed(context, '/home');
        break;
      case 1:
        Navigator.pushReplacementNamed(context, '/rewards');
        break;
      case 2:
        Navigator.pushReplacementNamed(context, '/food-hub');
        break;
      case 3:
        Navigator.pushReplacementNamed(context, '/family-map');
        break;
      case 4:
        Navigator.pushReplacementNamed(context, '/settings');
        break;
    }
  }
}

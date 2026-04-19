import 'package:flutter/material.dart';
import '../localization/app_i18n.dart';

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
    final isAr = AppI18n.isArabic(context);

    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: selectedIndex,
      selectedItemColor: const Color(0xFF388E3C),
      unselectedItemColor: Colors.grey,
      showUnselectedLabels: true,
      onTap: (index) => _onTap(context, index),
        items: [
        BottomNavigationBarItem(icon: const Icon(Icons.home_outlined), label: isAr ? 'الرئيسية' : 'Home'),
        BottomNavigationBarItem(
          icon: const Icon(Icons.emoji_events_outlined), label: isAr ? 'المكافآت' : 'Rewards'),
        BottomNavigationBarItem(
          icon: const Icon(Icons.restaurant_outlined), label: isAr ? 'الطعام' : 'Food Hub'),
        BottomNavigationBarItem(
          icon: const Icon(Icons.map_outlined), label: isAr ? 'الخريطة' : 'Map'),
        BottomNavigationBarItem(
          icon: const Icon(Icons.settings_outlined), label: isAr ? 'الإعدادات' : 'Settings'),
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

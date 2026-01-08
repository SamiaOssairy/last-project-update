import 'package:flutter/material.dart';
import 'pages/signup_login.dart';
import 'pages/home.dart';
import 'pages/setting.dart';
import 'pages/splash_screen.dart';
import 'pages/onboarding_screen.dart';
import 'pages/dashboard_screen.dart';
import 'pages/tasks_screen.dart';
import 'pages/status_screen.dart';
import 'pages/rewards_screen.dart';
import 'pages/redeem_screen.dart';
import 'pages/task_management_screen.dart';
import 'pages/family_points_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Family Hub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/login': (context) => const LoginPage(),
        '/home': (context) => const HomePage(),
        '/settings': (context) => const SettingPage(),
        '/dashboard': (context) => const DashboardScreen(),
        '/tasks': (context) => const TasksScreen(),
        '/status': (context) => const StatusScreen(),
        '/rewards': (context) => const RewardsScreen(),
        '/redeem': (context) => const RedeemScreen(),
        '/task-management': (context) => const TaskManagementScreen(),
        '/family-points': (context) => const FamilyPointsScreen(),
      },
    );
  }
}

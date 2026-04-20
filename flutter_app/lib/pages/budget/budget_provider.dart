// lib/pages/budget/budget_provider.dart
// Matches existing project pattern: Provider + ChangeNotifier, ApiService calls,
// SharedPreferences for memberType / familyId checks.

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FamilyBudgetProvider extends ChangeNotifier {
  static const String _baseUrl = 'http://localhost:8000/api';

  // ── State ──────────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> budgets = [];
  List<Map<String, dynamic>> expenses = [];
  List<Map<String, dynamic>> futureEvents = [];
  Map<String, dynamic>? selectedBudget;
  Map<String, dynamic>? analyticsData;

  bool isLoading = false;
  bool isParentUser = false;
  String? errorMessage;

  // ── Init ───────────────────────────────────────────────────────────────────
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    isParentUser = (prefs.getString('memberType') ?? '') == 'Parent';
    await loadBudgets();
    await loadFutureEvents();
  }

  // ── Auth header helper ─────────────────────────────────────────────────────
  Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  void _setLoading(bool v) {
    isLoading = v;
    notifyListeners();
  }

  void _setError(String? msg) {
    errorMessage = msg;
    notifyListeners();
  }

  // ── Budgets ────────────────────────────────────────────────────────────────
  Future<void> loadBudgets() async {
    _setLoading(true);
    _setError(null);
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/budgets'),
        headers: await _headers(),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        budgets = List<Map<String, dynamic>>.from(data['data']['budgets'] ?? []);
      } else {
        _setError(data['message'] ?? 'Failed to load budgets');
      }
    } catch (e) {
      _setError('Network error: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> createBudget(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await loadBudgets();
      return data['data']['budget'];
    }
    throw Exception(data['message'] ?? 'Failed to create budget');
  }

  Future<void> updateBudget(String budgetId, Map<String, dynamic> payload) async {
    final res = await http.put(
      Uri.parse('$_baseUrl/budgets/$budgetId'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await loadBudgets();
    } else {
      throw Exception(data['message'] ?? 'Failed to update budget');
    }
  }

  Future<void> deleteBudget(String budgetId) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/budgets/$budgetId'),
      headers: await _headers(),
    );
    if (res.statusCode == 204) {
      budgets.removeWhere((b) => b['_id'] == budgetId);
      notifyListeners();
    } else {
      final data = jsonDecode(res.body);
      throw Exception(data['message'] ?? 'Failed to delete budget');
    }
  }

  Future<void> selectBudget(String budgetId) async {
    _setLoading(true);
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/budgets/$budgetId'),
        headers: await _headers(),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        selectedBudget = data['data']['budget'];
        await loadExpenses(budgetId: budgetId);
        await loadAnalytics(budgetId);
      }
    } finally {
      _setLoading(false);
    }
  }

  // ── Expenses ───────────────────────────────────────────────────────────────
  Future<void> loadExpenses({String? budgetId}) async {
    _setLoading(true);
    try {
      String url = '$_baseUrl/budgets/expenses/all';
      if (budgetId != null) url += '?budget_id=$budgetId';
      final res = await http.get(Uri.parse(url), headers: await _headers());
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        expenses = List<Map<String, dynamic>>.from(data['data']['expenses'] ?? []);
      }
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/expenses/new'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      if (selectedBudget != null) {
        await selectBudget(selectedBudget!['_id']);
      }
      return data['data']['expense'];
    }
    throw Exception(data['message'] ?? 'Failed to create expense');
  }

  Future<void> deleteExpense(String expenseId) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/budgets/expenses/$expenseId'),
      headers: await _headers(),
    );
    if (res.statusCode == 204) {
      expenses.removeWhere((e) => e['_id'] == expenseId);
      notifyListeners();
    } else {
      final data = jsonDecode(res.body);
      throw Exception(data['message'] ?? 'Failed to delete expense');
    }
  }

  Future<void> uploadReceiptPhoto(String expenseId, String photoUrl) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/expenses/$expenseId/photo'),
      headers: await _headers(),
      body: jsonEncode({'receipt_photo_url': photoUrl}),
    );
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body);
      throw Exception(data['message'] ?? 'Failed to upload photo');
    }
    // Refresh expenses
    if (selectedBudget != null) await loadExpenses(budgetId: selectedBudget!['_id']);
  }

  Future<void> useEmergencyFund(
      String budgetId, String categoryId, double amount, String description) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/$budgetId/emergency'),
      headers: await _headers(),
      body: jsonEncode({
        'budget_category_id': categoryId,
        'amount': amount,
        'description': description,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await selectBudget(budgetId);
    } else {
      throw Exception(data['message'] ?? 'Failed to use emergency fund');
    }
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  Future<void> loadAnalytics(String budgetId) async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/budgets/$budgetId/analytics'),
        headers: await _headers(),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        analyticsData = data['data'];
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<Map<String, dynamic>> getBudgetAlerts(String budgetId) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/budgets/$budgetId/alerts'),
      headers: await _headers(),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data['data'];
    throw Exception(data['message'] ?? 'Failed to load alerts');
  }

  // ── Future Events ──────────────────────────────────────────────────────────
  Future<void> loadFutureEvents() async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/budgets/future-events/all'),
        headers: await _headers(),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        futureEvents = List<Map<String, dynamic>>.from(data['data']['events'] ?? []);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> createFutureEvent(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/future-events/new'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await loadFutureEvents();
    } else {
      throw Exception(data['message'] ?? 'Failed to create event');
    }
  }

  Future<void> updateFutureEvent(String eventId, Map<String, dynamic> payload) async {
    final res = await http.put(
      Uri.parse('$_baseUrl/budgets/future-events/$eventId'),
      headers: await _headers(),
      body: jsonEncode(payload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await loadFutureEvents();
    } else {
      throw Exception(data['message'] ?? 'Failed to update event');
    }
  }

  Future<void> deleteFutureEvent(String eventId) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/budgets/future-events/$eventId'),
      headers: await _headers(),
    );
    if (res.statusCode == 204) {
      futureEvents.removeWhere((e) => e['_id'] == eventId);
      notifyListeners();
    } else {
      final data = jsonDecode(res.body);
      throw Exception(data['message'] ?? 'Failed to delete event');
    }
  }

  // ── Cross-module links ─────────────────────────────────────────────────────
  Future<void> linkReceiptToExpense(
      String budgetId, String categoryId, String receiptId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/link/receipt'),
      headers: await _headers(),
      body: jsonEncode({
        'budget_id': budgetId,
        'budget_category_id': categoryId,
        'receipt_id': receiptId,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await selectBudget(budgetId);
    } else {
      throw Exception(data['message'] ?? 'Failed to link receipt');
    }
  }

  Future<void> linkRedeemToExpense(
      String budgetId, String categoryId, String redeemId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/budgets/link/redeem'),
      headers: await _headers(),
      body: jsonEncode({
        'budget_id': budgetId,
        'budget_category_id': categoryId,
        'redeem_id': redeemId,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await selectBudget(budgetId);
    } else {
      throw Exception(data['message'] ?? 'Failed to link redemption');
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> get activeReminders =>
      futureEvents.where((e) => e['should_remind'] == true).toList();

  double getTotalSpent(Map<String, dynamic> budget) =>
      (budget['total_spent'] ?? 0).toDouble();

  double getRemainingAmount(Map<String, dynamic> budget) =>
      (budget['remaining_amount'] ?? 0).toDouble();

  double getEmergencyRemaining(Map<String, dynamic> budget) =>
      (budget['emergency_fund_remaining'] ?? 0).toDouble();
}
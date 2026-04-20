import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:app_frontend/core/widgets/app_bottom_nav.dart';
import 'package:app_frontend/pages/budget/budget_provider.dart';
import 'package:app_frontend/pages/budget/add_expense_screen.dart';
import 'package:app_frontend/pages/budget/budget_analytics_screen.dart';
import 'package:app_frontend/pages/budget/future_events_screen.dart';
import 'package:app_frontend/pages/budget/widgets/budget_progress_indicator.dart' as bpi;
import 'package:app_frontend/pages/budget/widgets/emergency_fund_card.dart' as efc;
import 'package:app_frontend/pages/budget/widgets/category_spending_tile.dart' as cst;

class BudgetDashboardScreen extends StatefulWidget {
  const BudgetDashboardScreen({super.key});
  @override
  State<BudgetDashboardScreen> createState() => _BudgetDashboardScreenState();
}

class _BudgetDashboardScreenState extends State<BudgetDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyBudgetProvider>().loadBudgets();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FamilyBudgetProvider>(
      builder: (context, provider, _) {
        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F5),
          body: SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 700),
                child: Column(children: [
                  _buildHeader(context, provider),
                  Expanded(
                    child: provider.isLoading
                        ? const Center(child: CircularProgressIndicator(color: Color(0xFF388E3C)))
                        : provider.budgets.isEmpty
                            ? _buildEmptyState(context, provider)
                            : _buildBudgetList(context, provider),
                  ),
                ]),
              ),
            ),
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _showCreateBudgetSheet(context, provider),
            backgroundColor: const Color(0xFF388E3C),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('New Budget', style: TextStyle(color: Colors.white)),
          ),
          bottomNavigationBar: const AppBottomNav(selectedIndex: 3),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, FamilyBudgetProvider provider) {
    final reminders = provider.activeReminders;
    return Container(
      color: const Color(0xFF388E3C),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          const Expanded(
            child: Text('Budget', style: TextStyle(
              fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
          IconButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => FutureEventsScreen())),
            icon: Stack(children: [
              const Icon(Icons.event, color: Colors.white),
              if (reminders.isNotEmpty)
                Positioned(
                  right: 0, top: 0,
                  child: Container(
                    width: 10, height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.orange, shape: BoxShape.circle),
                  ),
                ),
            ]),
          ),
        ]),
        if (reminders.isNotEmpty)
          GestureDetector(
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => FutureEventsScreen())),
            child: Container(
              margin: const EdgeInsets.only(top: 8, left: 8, right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.orange.shade700,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(children: [
                const Icon(Icons.notifications_active, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(
                  '${reminders.length} upcoming event reminder${reminders.length > 1 ? 's' : ''}',
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                )),
                const Icon(Icons.chevron_right, color: Colors.white),
              ]),
            ),
          ),
      ]),
    );
  }

  Widget _buildEmptyState(BuildContext context, FamilyBudgetProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.account_balance_wallet_outlined,
              size: 80, color: Color(0xFFBDBDBD)),
          const SizedBox(height: 16),
          const Text('No budgets yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF424242))),
          const SizedBox(height: 8),
          const Text('Create a budget to start tracking your family spending.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF757575))),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showCreateBudgetSheet(context, provider),
            icon: const Icon(Icons.add),
            label: const Text('Create Budget'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF388E3C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildBudgetList(BuildContext context, FamilyBudgetProvider provider) {
    return RefreshIndicator(
      onRefresh: provider.loadBudgets,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: provider.budgets.length,
        itemBuilder: (context, i) => _buildBudgetCard(context, provider, provider.budgets[i]),
      ),
    );
  }

  Widget _buildBudgetCard(BuildContext context, FamilyBudgetProvider provider, Map<String, dynamic> budget) {
    final total = (budget['total_amount'] ?? 0).toDouble();
    final spent = (budget['total_spent'] ?? 0).toDouble();
    final remaining = (budget['remaining_amount'] ?? 0).toDouble();
    final emergencyTotal = (budget['emergency_fund_amount'] ?? 0).toDouble();
    final emergencySpent = (budget['emergency_fund_spent'] ?? 0).toDouble();
    final isOverBudget = budget['is_over_budget'] == true;
    final isHousehold = budget['budget_type'] == 'household';
    final categories = List<Map<String, dynamic>>.from(budget['categories'] ?? []);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () async {
          await provider.selectBudget(budget['_id']);
          if (context.mounted) {
            Navigator.push(context, MaterialPageRoute(
              builder: (_) => BudgetAnalyticsScreen(budgetId: budget['_id']),
            ));
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Title row
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isHousehold
                      ? const Color(0xFF388E3C).withOpacity(0.1)
                      : const Color(0xFF1976D2).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isHousehold ? 'Household' : 'Personal',
                  style: TextStyle(
                    fontSize: 11,
                    color: isHousehold ? const Color(0xFF388E3C) : const Color(0xFF1976D2),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(
                budget['title'] ?? 'Budget',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              )),
              if (isOverBudget)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade300),
                  ),
                  child: const Text('Over Budget',
                      style: TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
            ]),
            const SizedBox(height: 12),
            // Progress indicator (BR4)
            bpi.BudgetProgressIndicatorWidget(
              spent: spent,
              total: total - emergencyTotal,
              isOverBudget: isOverBudget,
            ),
            const SizedBox(height: 12),
            // Amounts row
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              _amountChip('Spent', spent, Colors.red.shade700),
              _amountChip('Remaining', remaining, const Color(0xFF388E3C)),
              _amountChip('Total', total, const Color(0xFF1976D2)),
            ]),
            const SizedBox(height: 12),
            // Emergency fund card
            efc.EmergencyFundCard(
              total: emergencyTotal,
              spent: emergencySpent,
              compact: true,
            ),
            // Categories
            if (categories.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              ...categories.take(3).map((cat) => cst.CategorySpendingTile(
                categoryName: cat['name'] ?? '',
                allocated: (cat['allocated_amount'] ?? 0).toDouble(),
                spent: (cat['spent_amount'] ?? 0).toDouble(),
                color: _parseColor(cat['color'] ?? '#4CAF50'),
                compact: true,
              )),
              if (categories.length > 3)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '+${categories.length - 3} more categories',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ),
            ],
            const SizedBox(height: 12),
            // Action buttons
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                onPressed: () {
                  provider.selectBudget(budget['_id']);
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => AddExpenseScreen(budget: budget),
                  ));
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Expense'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF388E3C),
                  side: const BorderSide(color: Color(0xFF388E3C)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              )),
              const SizedBox(width: 8),
              Expanded(child: ElevatedButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => BudgetAnalyticsScreen(budgetId: budget['_id']),
                )),
                icon: const Icon(Icons.pie_chart, size: 18),
                label: const Text('Analytics'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF388E3C),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              )),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _amountChip(String label, double amount, Color color) {
    return Column(children: [
      Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      const SizedBox(height: 2),
      Text(
        NumberFormat.currency(symbol: '\$', decimalDigits: 0).format(amount),
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color),
      ),
    ]);
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return const Color(0xFF4CAF50);
    }
  }

  void _showCreateBudgetSheet(BuildContext context, FamilyBudgetProvider provider) {
    final titleCtrl = TextEditingController(text: 'Family Budget');
    final totalCtrl = TextEditingController();
    String periodType = 'monthly';
    String budgetType = 'household';
    double emergencyPct = 10;
    bool isLoading = false;
    List<Map<String, dynamic>> categories = [
      {'name': 'Food & Groceries', 'allocated_amount': 0.0, 'is_essential': true,
       'linked_food_module': true, 'color': '#4CAF50'},
      {'name': 'Transport', 'allocated_amount': 0.0, 'is_essential': false,
       'linked_food_module': false, 'color': '#FF9800'},
      {'name': 'Education', 'allocated_amount': 0.0, 'is_essential': false,
       'linked_food_module': false, 'color': '#2196F3'},
      {'name': 'Children Rewards', 'allocated_amount': 0.0, 'is_essential': false,
       'linked_reward_module': true, 'color': '#9C27B0'},
    ];
    final catControllers = categories.map((_) => TextEditingController()).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => DraggableScrollableSheet(
          initialChildSize: 0.9,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollCtrl) => SingleChildScrollView(
            controller: scrollCtrl,
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Center(child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2)),
              )),
              const SizedBox(height: 16),
              const Text('Create Budget',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Budget Title',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: totalCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Total Amount',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                ),
              ),
              const SizedBox(height: 16),
              // Budget type
              const Text('Budget Type', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: _typeChip(ctx, 'Household', 'household', budgetType,
                    (v) => setSheet(() => budgetType = v))),
                const SizedBox(width: 8),
                Expanded(child: _typeChip(ctx, 'Personal', 'personal', budgetType,
                    (v) => setSheet(() => budgetType = v))),
              ]),
              const SizedBox(height: 16),
              // Period type
              const Text('Period', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(children: [
                for (final p in ['weekly', 'monthly', 'custom'])
                  Expanded(child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: _typeChip(ctx, p.capitalize(), p, periodType,
                        (v) => setSheet(() => periodType = v)),
                  )),
              ]),
              const SizedBox(height: 16),
              // Emergency fund slider (BR6)
              Text('Emergency Fund: ${emergencyPct.toStringAsFixed(0)}%',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: emergencyPct,
                min: 0, max: 30, divisions: 30,
                activeColor: const Color(0xFF388E3C),
                label: '${emergencyPct.toStringAsFixed(0)}%',
                onChanged: (v) => setSheet(() => emergencyPct = v),
              ),
              const SizedBox(height: 16),
              // Categories
              const Text('Budget Categories',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...List.generate(categories.length, (i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(children: [
                  Container(
                    width: 16, height: 16,
                    decoration: BoxDecoration(
                      color: _parseColor(categories[i]['color']),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(categories[i]['name'],
                      style: const TextStyle(fontWeight: FontWeight.w500))),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 100,
                    child: TextField(
                      controller: catControllers[i],
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Amount',
                        isDense: true,
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      ),
                      onChanged: (v) {
                        categories[i]['allocated_amount'] = double.tryParse(v) ?? 0;
                      },
                    ),
                  ),
                ]),
              )),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isLoading ? null : () async {
                    final total = double.tryParse(totalCtrl.text.trim());
                    if (total == null || total <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter a valid total amount')));
                      return;
                    }
                    setSheet(() => isLoading = true);
                    try {
                      await provider.createBudget({
                        'title': titleCtrl.text.trim(),
                        'budget_type': budgetType,
                        'period_type': periodType,
                        'start_date': DateTime.now().toIso8601String(),
                        'total_amount': total,
                        'emergency_fund_percentage': emergencyPct,
                        'categories': categories
                            .where((c) => c['allocated_amount'] > 0)
                            .toList(),
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Budget created!'),
                            backgroundColor: Color(0xFF388E3C),
                          ));
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')),
                              backgroundColor: Colors.red));
                      }
                    } finally {
                      setSheet(() => isLoading = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF388E3C),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      : const Text('Create Budget',
                          style: TextStyle(fontSize: 16, color: Colors.white)),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _typeChip(BuildContext ctx, String label, String value, String current,
      Function(String) onTap) {
    final selected = value == current;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF388E3C) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: selected ? const Color(0xFF388E3C) : Colors.grey.shade300),
        ),
        child: Center(
          child: Text(label,
              style: TextStyle(
                color: selected ? Colors.white : Colors.black87,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              )),
        ),
      ),
    );
  }
}

extension StringExtension on String {
  String capitalize() => isEmpty ? '' : '${this[0].toUpperCase()}${substring(1)}';
}
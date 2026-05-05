import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:app_frontend/pages/budget/budget_provider.dart';

class BudgetAnalyticsScreen extends StatefulWidget {
  final String budgetId;
  const BudgetAnalyticsScreen({super.key, required this.budgetId});
  @override
  State<BudgetAnalyticsScreen> createState() => _BudgetAnalyticsScreenState();
}

class _BudgetAnalyticsScreenState extends State<BudgetAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int _touchedIndex = -1;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyBudgetProvider>().loadAnalytics(widget.budgetId);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (_) {
      return const Color(0xFF4CAF50);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FamilyBudgetProvider>(builder: (context, provider, _) {
      final analytics = provider.analyticsData;

      return Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: const Color(0xFF388E3C),
          foregroundColor: Colors.white,
          title: const Text('Budget Analytics'),
          elevation: 0,
          bottom: TabBar(
            controller: _tabCtrl,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            tabs: const [
              Tab(text: 'Pie Chart'),
              Tab(text: 'Trend'),
              Tab(text: 'Expenses'),
            ],
          ),
        ),
        body: provider.isLoading || analytics == null
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFF388E3C)))
            : TabBarView(
                controller: _tabCtrl,
                children: [
                  _buildPieTab(analytics),
                  _buildTrendTab(analytics),
                  _buildExpensesTab(provider),
                ],
              ),
      );
    });
  }

  Widget _buildPieTab(Map<String, dynamic> analytics) {
    final pieData = List<Map<String, dynamic>>.from(analytics['pie_chart_data'] ?? []);
    final totalSpent = (analytics['total_spent'] ?? 0).toDouble();
    final totalBudget = (analytics['total_budget'] ?? 0).toDouble();
    final isOverBudget = analytics['is_over_budget'] == true;

    if (pieData.isEmpty) {
      return const Center(child: Text('No expenses yet'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isOverBudget ? Colors.red.shade50 : const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isOverBudget ? Colors.red.shade300 : const Color(0xFFA5D6A7),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _statBox('Total Spent', totalSpent, Colors.red.shade700),
                _statBox('Remaining', (analytics['total_remaining'] ?? 0).toDouble(),
                    const Color(0xFF388E3C)),
                _statBox('Budget', totalBudget, const Color(0xFF1976D2)),
              ],
            ),
          ),
          if (isOverBudget) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.red),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Budget limit exceeded!',
                      style: TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            height: 260,
            child: PieChart(
              PieChartData(
                pieTouchData: PieTouchData(
                  touchCallback: (FlTouchEvent e, PieTouchResponse? r) {
                    setState(() {
                      _touchedIndex = r?.touchedSection?.touchedSectionIndex ?? -1;
                    });
                  },
                ),
                borderData: FlBorderData(show: false),
                sectionsSpace: 2,
                centerSpaceRadius: 50,
                sections: List.generate(pieData.length, (i) {
                  final d = pieData[i];
                  final pct = double.tryParse(d['percentage'].toString()) ?? 0;
                  final isTouched = i == _touchedIndex;
                  return PieChartSectionData(
                    value: (d['spent_amount'] ?? 0).toDouble(),
                    title: '${pct.toStringAsFixed(0)}%',
                    radius: isTouched ? 80 : 60,
                    titleStyle: TextStyle(
                      fontSize: isTouched ? 15 : 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    color: _parseColor(d['color'] ?? '#4CAF50'),
                  );
                }),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ...pieData.map((d) {
            final spent = (d['spent_amount'] ?? 0).toDouble();
            final allocated = (d['allocated_amount'] ?? 0).toDouble();
            final pct = double.tryParse(d['percentage'].toString()) ?? 0;
            final isOver = d['is_over_budget'] == true;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: isOver ? Border.all(color: Colors.red.shade300) : null,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: _parseColor(d['color'] ?? '#4CAF50'),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d['category_name'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('${d['expense_count'] ?? 0} transactions',
                              style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('\$${spent.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isOver ? Colors.red : Colors.black87,
                            )),
                        Text('${pct.toStringAsFixed(1)}% • of \$${allocated.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTrendTab(Map<String, dynamic> analytics) {
    final trend = List<Map<String, dynamic>>.from(analytics['daily_trend_data'] ?? []);
    if (trend.isEmpty) {
      return const Center(child: Text('No spending data yet'));
    }

    final spots = <FlSpot>[];
    for (int i = 0; i < trend.length; i++) {
      spots.add(FlSpot(i.toDouble(), (trend[i]['daily_spent'] ?? 0).toDouble()));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text('Daily Spending Trend',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (v, _) => Text('\$${v.toInt()}',
                          style: const TextStyle(fontSize: 10)),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i >= 0 && i < trend.length && i % 3 == 0) {
                          return Text(trend[i]['_id'].toString().substring(5),
                              style: const TextStyle(fontSize: 10));
                        }
                        return const Text('');
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFF388E3C),
                    barWidth: 3,
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF388E3C).withOpacity(0.15),
                    ),
                    dotData: const FlDotData(show: false),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statBox(String label, double amount, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 4),
        Text('\$${amount.toStringAsFixed(0)}',
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _buildExpensesTab(FamilyBudgetProvider provider) {
    final expenses = provider.expenses;
    if (expenses.isEmpty) {
      return const Center(child: Text('No expenses found for this budget period'));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: expenses.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final expense = expenses[index];
        final amount = (expense['amount'] ?? 0).toDouble();
        final title = (expense['title'] ?? expense['category'] ?? 'Expense').toString();
        final category = (expense['category'] ?? 'Uncategorized').toString();
        final memberMail = (expense['member_mail'] ?? '').toString();
        final source = (expense['expense_source'] ?? 'budget').toString();
        final description = (expense['description'] ?? '').toString();
        final dateValue = DateTime.tryParse((expense['expense_date'] ?? '').toString());
        final formattedDate = dateValue != null ? DateFormat('dd MMM yyyy, hh:mm a').format(dateValue) : 'Unknown date';

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE0E0E0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '\$${amount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Color(0xFFD32F2F),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '$category • $source',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              if (memberMail.isNotEmpty)
                Text(
                  memberMail,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ],
              const SizedBox(height: 4),
              Text(
                formattedDate,
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ],
          ),
        );
      },
    );
  }
}
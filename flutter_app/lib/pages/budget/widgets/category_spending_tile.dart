import 'package:flutter/material.dart';

class CategorySpendingTile extends StatelessWidget {
  final String categoryName;
  final double allocated;
  final double spent;
  final Color color;
  final bool compact;

  const CategorySpendingTile({
    super.key,
    required this.categoryName,
    required this.allocated,
    required this.spent,
    required this.color,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final progress = allocated > 0 ? (spent / allocated).clamp(0.0, 1.0) : 0.0;
    final isOver = spent > allocated;
    final remaining = allocated - spent;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              categoryName,
              style: TextStyle(fontSize: compact ? 13 : 14, fontWeight: FontWeight.w500),
            ),
          ),
          Text(
            isOver ? '-\$${(spent - allocated).toStringAsFixed(0)} over' : '\$${remaining.toStringAsFixed(0)} left',
            style: TextStyle(
              fontSize: 12,
              color: isOver ? Colors.red : Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        ]),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(isOver ? Colors.red : color),
            minHeight: compact ? 6 : 8,
          ),
        ),
        if (!compact) ...[
          const SizedBox(height: 4),
          Text(
            '\$${spent.toStringAsFixed(2)} of \$${allocated.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 11, color: Colors.grey),
          ),
        ],
      ]),
    );
  }
}

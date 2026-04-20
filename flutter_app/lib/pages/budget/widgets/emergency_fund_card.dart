import 'package:flutter/material.dart';

// BR6 - Emergency fund visual card
class EmergencyFundCard extends StatelessWidget {
  final double total;
  final double spent;
  final bool compact;

  const EmergencyFundCard({
    super.key,
    required this.total,
    required this.spent,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final remaining = (total - spent).clamp(0.0, total);
    final progress = total > 0 ? (spent / total).clamp(0.0, 1.0) : 0.0;
    final pct = (progress * 100).toStringAsFixed(0);
    final isDepleted = remaining <= 0;

    return Container(
      padding: EdgeInsets.all(compact ? 8 : 14),
      decoration: BoxDecoration(
        color: isDepleted ? Colors.red.shade50 : Colors.orange.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isDepleted ? Colors.red.shade200 : Colors.orange.shade200),
      ),
      child: Row(children: [
        Icon(Icons.emergency, color: isDepleted ? Colors.red : Colors.orange, size: compact ? 18 : 22),
        const SizedBox(width: 8),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              'Emergency Fund',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: compact ? 12 : 14,
                color: isDepleted ? Colors.red : Colors.orange.shade800,
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(isDepleted ? Colors.red : Colors.orange),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 4),
              Text('$pct% used', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ]),
        ),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(
            '\$${remaining.toStringAsFixed(0)}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: compact ? 13 : 16,
              color: isDepleted ? Colors.red : Colors.orange.shade800,
            ),
          ),
          Text('remaining', style: TextStyle(fontSize: compact ? 10 : 12, color: Colors.grey)),
        ]),
      ]),
    );
  }
}

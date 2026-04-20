import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:app_frontend/pages/budget/budget_provider.dart';
import 'package:app_frontend/pages/budget/widgets/future_event_card.dart' as fec;

class FutureEventsScreen extends StatefulWidget {
  const FutureEventsScreen({super.key});
  @override
  State<FutureEventsScreen> createState() => _FutureEventsScreenState();
}

class _FutureEventsScreenState extends State<FutureEventsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FamilyBudgetProvider>().loadFutureEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FamilyBudgetProvider>(builder: (ctx, provider, _) {
      return Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: const Color(0xFF388E3C),
          foregroundColor: Colors.white,
          title: const Text('Future Events'),
          elevation: 0,
        ),
        body: provider.isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF388E3C)))
            : provider.futureEvents.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: provider.loadFutureEvents,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: provider.futureEvents.length,
                      itemBuilder: (_, i) => fec.FutureEventCard(
                        event: provider.futureEvents[i],
                        onEdit: () => _showEventSheet(ctx, provider,
                            existing: provider.futureEvents[i]),
                        onDelete: () => _deleteEvent(provider, provider.futureEvents[i]['_id']),
                        onUpdateSaved: (saved) => provider.updateFutureEvent(
                          provider.futureEvents[i]['_id'],
                          {'saved_amount': saved},
                        ),
                      ),
                    ),
                  ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showEventSheet(ctx, provider),
          backgroundColor: const Color(0xFF388E3C),
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Add Event', style: TextStyle(color: Colors.white)),
        ),
      );
    });
  }

  Widget _buildEmptyState() => const Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.event_note, size: 70, color: Colors.grey),
      SizedBox(height: 16),
      Text('No future events planned',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
      SizedBox(height: 8),
      Text('Plan for Eid, tuition, back-to-school\nand get saving reminders.',
          textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
    ]),
  );

  void _showEventSheet(BuildContext context, FamilyBudgetProvider provider,
      {Map<String, dynamic>? existing}) {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? '');
    final costCtrl = TextEditingController(
        text: existing != null ? existing['estimated_cost'].toString() : '');
    final savedCtrl = TextEditingController(
        text: existing != null ? existing['saved_amount'].toString() : '0');
    DateTime selectedDate = existing != null
        ? DateTime.parse(existing['expected_date'])
        : DateTime.now().add(const Duration(days: 90));
    int reminderMonths = existing?['reminder_months_before'] ?? 3;
    String frequency = existing?['saving_frequency'] ?? 'monthly';
    bool isLoading = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(existing != null ? 'Edit Event' : 'New Future Event',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Event Name (e.g. Eid)',
                      border: OutlineInputBorder(), prefixIcon: Icon(Icons.event))),
              const SizedBox(height: 14),
              TextField(controller: costCtrl, keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Estimated Cost',
                      border: OutlineInputBorder(), prefixIcon: Icon(Icons.attach_money))),
              const SizedBox(height: 14),
              TextField(controller: savedCtrl, keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Already Saved',
                      border: OutlineInputBorder(), prefixIcon: Icon(Icons.savings))),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () async {
                  final d = await showDatePicker(context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 3650)));
                  if (d != null) setSheet(() => selectedDate = d);
                },
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: Colors.grey.shade100,
                      border: Border.all(color: Colors.grey.shade400),
                      borderRadius: BorderRadius.circular(8)),
                  child: Row(children: [
                    const Icon(Icons.calendar_today, color: Color(0xFF388E3C)),
                    const SizedBox(width: 10),
                    Text(DateFormat('dd/MM/yyyy').format(selectedDate)),
                    const Spacer(),
                    const Icon(Icons.edit, size: 16, color: Colors.grey),
                  ]),
                ),
              ),
              const SizedBox(height: 14),
              Text('Remind me $reminderMonths months before',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: reminderMonths.toDouble(), min: 1, max: 12, divisions: 11,
                activeColor: const Color(0xFF388E3C),
                label: '$reminderMonths months',
                onChanged: (v) => setSheet(() => reminderMonths = v.round()),
              ),
              const SizedBox(height: 8),
              Row(children: [
                const Text('Saving frequency: ', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(width: 8),
                for (final f in ['weekly', 'monthly'])
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: frequency == f,
                      selectedColor: const Color(0xFF388E3C),
                      labelStyle: TextStyle(
                          color: frequency == f ? Colors.white : Colors.black),
                      onSelected: (s) { if (s) setSheet(() => frequency = f); },
                    ),
                  ),
              ]),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity, height: 50,
                child: ElevatedButton(
                  onPressed: isLoading ? null : () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    final cost = double.tryParse(costCtrl.text.trim());
                    if (cost == null) return;
                    setSheet(() => isLoading = true);
                    try {
                      final payload = {
                        'name': nameCtrl.text.trim(),
                        'expected_date': selectedDate.toIso8601String(),
                        'estimated_cost': cost,
                        'saved_amount': double.tryParse(savedCtrl.text.trim()) ?? 0,
                        'reminder_months_before': reminderMonths,
                        'saving_frequency': frequency,
                      };
                      if (existing != null) {
                        await provider.updateFutureEvent(existing['_id'], payload);
                      } else {
                        await provider.createFutureEvent(payload);
                      }
                      if (ctx.mounted) Navigator.pop(ctx);
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')),
                              backgroundColor: Colors.red));
                      }
                    } finally { setSheet(() => isLoading = false); }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF388E3C),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      : Text(existing != null ? 'Update Event' : 'Save Event',
                          style: const TextStyle(fontSize: 16, color: Colors.white)),
                ),
              ),
            ],
          )),
        ),
      ),
    );
  }

  Future<void> _deleteEvent(FamilyBudgetProvider provider, String eventId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Event'),
        content: const Text('Are you sure you want to delete this future event?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await provider.deleteFutureEvent(eventId);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
        }
      }
    }
  }
}
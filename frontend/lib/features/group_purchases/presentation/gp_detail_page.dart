import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/format.dart';
import '../../../shared/widgets/async_value_widget.dart';
import '../../auth/application/auth_controller.dart';
import '../application/gp_providers.dart';
import '../data/group_purchase_repository.dart';
import '../domain/group_purchase.dart';

class GpDetailPage extends ConsumerStatefulWidget {
  const GpDetailPage({super.key, required this.id});
  final String id;

  @override
  ConsumerState<GpDetailPage> createState() => _GpDetailPageState();
}

class _GpDetailPageState extends ConsumerState<GpDetailPage> {
  bool _busy = false;
  // Local membership guess (backend detail doesn't list participant ids):
  // null = unknown, true/false set after a join/leave action.
  bool? _joined;

  Future<void> _run(Future<void> Function() action, String okMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      ref.invalidate(gpDetailProvider(widget.id));
      ref.invalidate(gpListProvider(null));
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(okMsg)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _join() {
    _run(() async {
      await ref.read(groupPurchaseRepositoryProvider).join(widget.id);
      _joined = true;
    }, 'Joined!');
  }

  void _leave() {
    _run(() async {
      await ref.read(groupPurchaseRepositoryProvider).leave(widget.id);
      _joined = false;
    }, 'Left the group.');
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(gpDetailProvider(widget.id));
    final userId = ref.watch(authControllerProvider).valueOrNull?.userId;
    final loggedIn =
        ref.watch(authControllerProvider).valueOrNull != null;

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.go('/group-purchases')),
        title: const Text('Group purchase'),
      ),
      body: AsyncValueWidget(
        value: detail,
        onRetry: () => ref.invalidate(gpDetailProvider(widget.id)),
        data: (g) {
          final isCreator = userId != null && userId == g.creatorId;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(g.title,
                        style: Theme.of(context).textTheme.headlineSmall),
                  ),
                  _StatusBadge(status: g.status),
                ],
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _PriceRow(group: g),
                      const SizedBox(height: 16),
                      _ProgressRow(group: g),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.schedule,
                              size: 18, color: Theme.of(context).hintColor),
                          const SizedBox(width: 6),
                          Text('Ends in ${countdown(g.expiresAt)}'),
                        ],
                      ),
                      if (g.creatorEmail != null &&
                          g.creatorEmail!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.person_outline,
                                size: 18, color: Theme.of(context).hintColor),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text('Created by ${g.creatorEmail}',
                                  style: Theme.of(context).textTheme.bodyMedium),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              if (g.description != null && g.description!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Description',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 6),
                Text(g.description!),
              ],
              const SizedBox(height: 24),
              _actions(g, isCreator: isCreator, loggedIn: loggedIn),
            ],
          );
        },
      ),
    );
  }

  Widget _actions(GroupPurchase g,
      {required bool isCreator, required bool loggedIn}) {
    if (!g.isActive) {
      return Center(
        child: Text(
          g.status == GroupPurchaseStatus.confirmed
              ? 'This group is confirmed — locked in.'
              : 'This group is no longer active.',
          style: const TextStyle(fontStyle: FontStyle.italic),
        ),
      );
    }
    if (!loggedIn) {
      return FilledButton.icon(
        onPressed: () => context.go('/login'),
        icon: const Icon(Icons.login),
        label: const Text('Sign in to join'),
      );
    }
    if (isCreator) {
      return const Center(
        child: Text("You created this group (auto-joined). Creators can't leave."),
      );
    }
    if (_busy) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_joined == true) {
      return OutlinedButton.icon(
        onPressed: _leave,
        icon: const Icon(Icons.exit_to_app),
        label: const Text('Leave group'),
      );
    }
    return Column(
      children: [
        FilledButton.icon(
          onPressed: _join,
          icon: const Icon(Icons.group_add),
          label: const Text('Join this group'),
        ),
        TextButton(
          onPressed: _leave,
          child: const Text('Already joined? Leave'),
        ),
      ],
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.group});
  final GroupPurchase group;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          money(group.targetPrice),
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(width: 8),
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Text(
            money(group.originalPrice),
            style: const TextStyle(
              decoration: TextDecoration.lineThrough,
              color: Colors.grey,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Text('-${group.discountPercentage.toStringAsFixed(0)}%',
              style: const TextStyle(
                  color: Colors.redAccent, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.group});
  final GroupPurchase group;

  @override
  Widget build(BuildContext context) {
    final ratio = group.minimumParticipants == 0
        ? 0.0
        : (group.currentParticipants / group.minimumParticipants)
            .clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${group.currentParticipants} of ${group.minimumParticipants} joined',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(value: ratio, minHeight: 10),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final GroupPurchaseStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      GroupPurchaseStatus.active => Colors.blue,
      GroupPurchaseStatus.confirmed => Colors.green,
      GroupPurchaseStatus.expired => Colors.grey,
      GroupPurchaseStatus.unknown => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Text(status.label,
          style: TextStyle(color: color, fontWeight: FontWeight.bold)),
    );
  }
}

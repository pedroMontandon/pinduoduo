import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/format.dart';
import '../../../shared/widgets/async_value_widget.dart';
import '../application/gp_providers.dart';
import '../domain/group_purchase.dart';

class GpListPage extends ConsumerWidget {
  const GpListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(gpListProvider(null));

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.go('/products')),
        title: const Text('Group purchases'),
      ),
      body: AsyncValueWidget(
        value: groups,
        onRetry: () => ref.invalidate(gpListProvider(null)),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('No group purchases yet.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(gpListProvider(null).notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              itemBuilder: (context, i) => _GpCard(group: list[i]),
            ),
          );
        },
      ),
    );
  }
}

class _GpCard extends StatelessWidget {
  const _GpCard({required this.group});
  final GroupPurchase group;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ratio = group.minimumParticipants == 0
        ? 0.0
        : (group.currentParticipants / group.minimumParticipants)
            .clamp(0.0, 1.0);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go('/group-purchases/${group.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(group.title,
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                  _StatusChip(status: group.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(money(group.targetPrice),
                      style: theme.textTheme.titleLarge?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                        '-${group.discountPercentage.toStringAsFixed(0)}%',
                        style: const TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(value: ratio, minHeight: 7),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                      '${group.currentParticipants}/${group.minimumParticipants} joined',
                      style: theme.textTheme.bodySmall),
                  Text('ends in ${countdown(group.expiresAt)}',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.hintColor)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final GroupPurchaseStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      GroupPurchaseStatus.active => Colors.blue,
      GroupPurchaseStatus.confirmed => Colors.green,
      GroupPurchaseStatus.expired => Colors.grey,
      GroupPurchaseStatus.unknown => Colors.grey,
    };
    return Chip(
      label: Text(status.label),
      backgroundColor: color.withValues(alpha: 0.15),
      side: BorderSide(color: color),
      labelStyle: TextStyle(color: color, fontWeight: FontWeight.w600),
      visualDensity: VisualDensity.compact,
    );
  }
}

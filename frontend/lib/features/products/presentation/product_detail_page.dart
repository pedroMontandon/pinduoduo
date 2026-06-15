import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/format.dart';
import '../../../shared/widgets/async_value_widget.dart';
import '../../auth/application/auth_controller.dart';
import '../../group_purchases/application/gp_providers.dart';
import '../../group_purchases/domain/group_purchase.dart';
import '../application/products_providers.dart';
import '../data/product_repository.dart';

class ProductDetailPage extends ConsumerWidget {
  const ProductDetailPage({super.key, required this.productId});

  final String productId;

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete product?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(productRepositoryProvider).delete(productId);
      ref.invalidate(productListProvider);
      if (context.mounted) context.go('/products');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = ref.watch(productDetailProvider(productId));
    final groups = ref.watch(gpListProvider(productId));
    final loggedIn = ref.watch(authControllerProvider).valueOrNull != null;

    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.go('/products')),
        title: const Text('Product'),
        actions: [
          if (loggedIn)
            IconButton(
              icon: const Icon(Icons.edit),
              tooltip: 'Edit',
              onPressed: () => context.go('/products/$productId/edit'),
            ),
          if (loggedIn)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete',
              onPressed: () => _delete(context, ref),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            context.go('/group-purchases/new?productId=$productId'),
        icon: const Icon(Icons.group_add),
        label: const Text('Group buy'),
      ),
      body: AsyncValueWidget(
        value: product,
        onRetry: () => ref.invalidate(productDetailProvider(productId)),
        data: (p) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(productDetailProvider(productId));
            await ref.read(gpListProvider(productId).notifier).refresh();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor:
                                Theme.of(context).colorScheme.primaryContainer,
                            child: Icon(Icons.shopping_bag_outlined,
                                size: 28,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onPrimaryContainer),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineSmall),
                                const SizedBox(height: 6),
                                Text(money(p.price),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary,
                                            fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.inventory_2_outlined,
                              size: 18, color: Theme.of(context).hintColor),
                          const SizedBox(width: 6),
                          Text('${p.stock} in stock'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Description',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(p.description.isEmpty ? 'No description.' : p.description),
              const Divider(height: 32),
              Text('Group purchases',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _GroupList(groups: groups),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupList extends StatelessWidget {
  const _GroupList({required this.groups});

  final AsyncValue<List<GroupPurchase>> groups;

  @override
  Widget build(BuildContext context) {
    return groups.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Text('$e'),
      data: (list) {
        if (list.isEmpty) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('No group purchases yet. Start one!'),
          );
        }
        return Column(
          children: [
            for (final g in list)
              Card(
                child: ListTile(
                  title: Text(g.title),
                  subtitle: Text(
                    '${g.discountPercentage.toStringAsFixed(0)}% off · '
                    '${g.currentParticipants}/${g.minimumParticipants} joined',
                  ),
                  trailing: Text(g.status.label),
                  onTap: () => context.go('/group-purchases/${g.id}'),
                ),
              ),
          ],
        );
      },
    );
  }
}

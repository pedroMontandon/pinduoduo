import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/format.dart';
import '../../../shared/widgets/async_value_widget.dart';
import '../../auth/application/auth_controller.dart';
import '../../notifications/application/notifications_providers.dart';
import '../application/products_providers.dart';
import '../domain/product.dart';

class ProductListPage extends ConsumerStatefulWidget {
  const ProductListPage({super.key});

  @override
  ConsumerState<ProductListPage> createState() => _ProductListPageState();
}

class _ProductListPageState extends ConsumerState<ProductListPage> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >=
        _scroll.position.maxScrollExtent - 200) {
      ref.read(productListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(productListProvider);
    final auth = ref.watch(authControllerProvider).valueOrNull;
    final loggedIn = auth != null;
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            tooltip: 'Notificações',
            icon: Badge.count(
              count: unread,
              isLabelVisible: unread > 0,
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.go('/notifications'),
          ),
          IconButton(
            tooltip: 'Group purchases',
            icon: const Icon(Icons.groups),
            onPressed: () => context.go('/group-purchases'),
          ),
          if (loggedIn) ...[
            _UserBadge(email: auth.email),
            IconButton(
              tooltip: 'Sign out',
              icon: const Icon(Icons.logout),
              onPressed: () =>
                  ref.read(authControllerProvider.notifier).logout(),
            ),
          ] else
            IconButton(
              tooltip: 'Sign in',
              icon: const Icon(Icons.login),
              onPressed: () => context.go('/login'),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/products/new'),
        icon: const Icon(Icons.add),
        label: const Text('Product'),
      ),
      body: AsyncValueWidget(
        value: state,
        onRetry: () => ref.invalidate(productListProvider),
        data: (data) {
          if (data.items.isEmpty) {
            return const Center(child: Text('No products yet.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(productListProvider.notifier).refresh(),
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(12),
              itemCount: data.items.length + (data.hasMore ? 1 : 0),
              itemBuilder: (context, i) {
                if (i >= data.items.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return _ProductCard(product: data.items[i]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.go('/products/${product.id}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Icon(Icons.shopping_bag_outlined,
                    color: theme.colorScheme.onPrimaryContainer),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.name,
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(product.description,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.hintColor),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(money(product.price),
                              style: TextStyle(
                                  color: theme.colorScheme.primary,
                                  fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        _StockBadge(stock: product.stock),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

/// App-bar badge showing who is currently logged in (email from the JWT).
class _UserBadge extends StatelessWidget {
  const _UserBadge({required this.email});
  final String? email;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = (email == null || email!.isEmpty) ? 'Signed in' : email!;
    final initial = label[0].toUpperCase();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      child: Tooltip(
        message: 'Logged in as $label',
        child: Chip(
          visualDensity: VisualDensity.compact,
          avatar: CircleAvatar(
            backgroundColor: theme.colorScheme.primary,
            child: Text(
              initial,
              style: TextStyle(
                color: theme.colorScheme.onPrimary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          label: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 160),
            child: Text(label, overflow: TextOverflow.ellipsis),
          ),
        ),
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.stock});
  final int stock;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (stock) {
      0 => (Colors.red, 'Out of stock'),
      < 10 => (Colors.orange, 'Low · $stock left'),
      _ => (Colors.green, '$stock in stock'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}

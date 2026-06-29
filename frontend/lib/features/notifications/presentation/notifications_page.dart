import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/async_value_widget.dart';
import '../application/notifications_providers.dart';
import '../data/notification_repository.dart';
import '../domain/notification.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
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
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      ref.read(notificationsListProvider.notifier).loadMore();
    }
  }

  Future<void> _markAllRead() async {
    ref.read(notificationsListProvider.notifier).markAllReadLocally();
    await ref.read(notificationRepositoryProvider).markAllRead();
    ref.invalidate(unreadCountProvider);
  }

  Future<void> _onTap(AppNotification n) async {
    if (!n.read) {
      ref.read(notificationsListProvider.notifier).markReadLocally(n.id);
      await ref.read(notificationRepositoryProvider).markRead(n.id);
      ref.invalidate(unreadCountProvider);
    }
    if (n.groupPurchaseId != null && mounted) {
      context.go('/group-purchases');
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        leading: BackButton(onPressed: () => context.go('/products')),
        actions: [
          IconButton(
            tooltip: 'Marcar todas como lidas',
            icon: const Icon(Icons.done_all),
            onPressed: _markAllRead,
          ),
        ],
      ),
      body: AsyncValueWidget(
        value: state,
        onRetry: () => ref.invalidate(notificationsListProvider),
        data: (data) {
          if (data.items.isEmpty) {
            return const Center(child: Text('Nenhuma notificação ainda.'));
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(notificationsListProvider.notifier).refresh(),
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(8),
              itemCount: data.items.length + (data.hasMore ? 1 : 0),
              itemBuilder: (context, i) {
                if (i >= data.items.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return _NotificationTile(
                  notification: data.items[i],
                  onTap: () => _onTap(data.items[i]),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unread = !notification.read;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
      color: unread ? theme.colorScheme.primaryContainer.withValues(alpha: 0.25) : null,
      child: ListTile(
        onTap: onTap,
        leading: Icon(
          unread ? Icons.notifications_active : Icons.notifications_none,
          color: unread ? theme.colorScheme.primary : theme.hintColor,
        ),
        title: Text(
          notification.message,
          style: TextStyle(
            fontWeight: unread ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        subtitle: Text(_timeAgo(notification.createdAt)),
        trailing: unread
            ? Icon(Icons.circle, size: 10, color: theme.colorScheme.primary)
            : null,
      ),
    );
  }
}

String _timeAgo(DateTime? date) {
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.inSeconds < 60) return 'agora';
  if (diff.inMinutes < 60) return '${diff.inMinutes} min atrás';
  if (diff.inHours < 24) return '${diff.inHours} h atrás';
  return '${diff.inDays} d atrás';
}

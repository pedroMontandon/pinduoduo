import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/env.dart';
import '../../auth/application/auth_controller.dart';
import '../data/notification_repository.dart';
import '../domain/notification.dart';

/// Live unread-count for the bell badge. Polls every [Env.pollInterval] and
/// resets to 0 when logged out (rebuilds when auth changes).
final unreadCountProvider = StreamProvider.autoDispose<int>((ref) async* {
  final loggedIn = ref.watch(authControllerProvider).valueOrNull != null;
  if (!loggedIn) {
    yield 0;
    return;
  }
  final repo = ref.read(notificationRepositoryProvider);
  while (true) {
    try {
      yield await repo.unreadCount();
    } catch (_) {
      // Ignore transient errors mid-poll; keep the last good value.
    }
    await Future<void>.delayed(Env.pollInterval);
  }
});

/// Paginated, load-more notification list.
class NotificationListState {
  const NotificationListState({
    required this.items,
    required this.total,
    this.loadingMore = false,
  });

  final List<AppNotification> items;
  final int total;
  final bool loadingMore;

  bool get hasMore => items.length < total;

  NotificationListState copyWith({
    List<AppNotification>? items,
    int? total,
    bool? loadingMore,
  }) =>
      NotificationListState(
        items: items ?? this.items,
        total: total ?? this.total,
        loadingMore: loadingMore ?? this.loadingMore,
      );
}

final notificationsListProvider =
    AsyncNotifierProvider<NotificationListNotifier, NotificationListState>(
  NotificationListNotifier.new,
);

class NotificationListNotifier extends AsyncNotifier<NotificationListState> {
  static const _take = 20;

  @override
  Future<NotificationListState> build() async {
    final page =
        await ref.read(notificationRepositoryProvider).list(take: _take);
    return NotificationListState(items: page.items, total: page.total);
  }

  Future<void> loadMore() async {
    final cur = state.valueOrNull;
    if (cur == null || cur.loadingMore || !cur.hasMore) return;
    state = AsyncData(cur.copyWith(loadingMore: true));
    final page = await ref
        .read(notificationRepositoryProvider)
        .list(skip: cur.items.length, take: _take);
    state = AsyncData(NotificationListState(
      items: [...cur.items, ...page.items],
      total: page.total,
    ));
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }

  /// Optimistically flips a notification to read in the current list.
  void markReadLocally(String id) {
    final cur = state.valueOrNull;
    if (cur == null) return;
    state = AsyncData(cur.copyWith(
      items: [
        for (final n in cur.items)
          if (n.id == id) n.copyWith(read: true) else n,
      ],
    ));
  }

  /// Optimistically flips every notification to read.
  void markAllReadLocally() {
    final cur = state.valueOrNull;
    if (cur == null) return;
    state = AsyncData(cur.copyWith(
      items: [for (final n in cur.items) n.copyWith(read: true)],
    ));
  }
}

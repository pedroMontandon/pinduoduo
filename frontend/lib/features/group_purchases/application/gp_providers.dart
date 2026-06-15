import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/env.dart';
import '../data/group_purchase_repository.dart';
import '../domain/group_purchase.dart';

/// Polling detail provider: refetches every [Env.pollInterval] while a detail
/// screen is mounted. Auto-disposes (stops polling) when the screen closes.
final gpDetailProvider =
    StreamProvider.autoDispose.family<GroupPurchase, String>((ref, id) async* {
  final repo = ref.read(groupPurchaseRepositoryProvider);
  var first = true;
  while (true) {
    try {
      yield await repo.get(id);
    } catch (e) {
      // Surface the very first failure; ignore transient errors mid-poll so the
      // screen keeps the last good value.
      if (first) rethrow;
    }
    first = false;
    await Future<void>.delayed(Env.pollInterval);
  }
});

/// List of group purchases, optionally filtered by product id (null = all).
final gpListProvider = AsyncNotifierProvider.family<GpListNotifier,
    List<GroupPurchase>, String?>(GpListNotifier.new);

class GpListNotifier
    extends FamilyAsyncNotifier<List<GroupPurchase>, String?> {
  @override
  Future<List<GroupPurchase>> build(String? productId) async {
    final page = await ref
        .read(groupPurchaseRepositoryProvider)
        .list(productId: productId, take: 50);
    return page.items;
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

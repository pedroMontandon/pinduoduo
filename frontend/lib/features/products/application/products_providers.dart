import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/product_repository.dart';
import '../domain/product.dart';

/// Detail of a single product (re-fetchable via invalidate).
final productDetailProvider =
    FutureProvider.family.autoDispose<Product, String>((ref, id) {
  return ref.read(productRepositoryProvider).get(id);
});

/// Paginated, load-more product list.
class ProductListState {
  const ProductListState({
    required this.items,
    required this.total,
    this.loadingMore = false,
  });

  final List<Product> items;
  final int total;
  final bool loadingMore;

  bool get hasMore => items.length < total;

  ProductListState copyWith({
    List<Product>? items,
    int? total,
    bool? loadingMore,
  }) =>
      ProductListState(
        items: items ?? this.items,
        total: total ?? this.total,
        loadingMore: loadingMore ?? this.loadingMore,
      );
}

final productListProvider =
    AsyncNotifierProvider<ProductListNotifier, ProductListState>(
  ProductListNotifier.new,
);

class ProductListNotifier extends AsyncNotifier<ProductListState> {
  static const _take = 10;

  @override
  Future<ProductListState> build() async {
    final page = await ref.read(productRepositoryProvider).list(take: _take);
    return ProductListState(items: page.items, total: page.total);
  }

  Future<void> loadMore() async {
    final cur = state.valueOrNull;
    if (cur == null || cur.loadingMore || !cur.hasMore) return;
    state = AsyncData(cur.copyWith(loadingMore: true));
    final page = await ref
        .read(productRepositoryProvider)
        .list(skip: cur.items.length, take: _take);
    state = AsyncData(ProductListState(
      items: [...cur.items, ...page.items],
      total: page.total,
    ));
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

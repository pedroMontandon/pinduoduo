import 'package:flutter_test/flutter_test.dart';
import 'package:pinduoduo_app/features/auth/domain/auth_state.dart';
import 'package:pinduoduo_app/features/group_purchases/domain/group_purchase.dart';
import 'package:pinduoduo_app/features/products/domain/product.dart';

void main() {
  test('Product.fromJson parses string decimals', () {
    final p = Product.fromJson({
      'id': 'abc',
      'name': 'Widget',
      'description': 'A thing',
      'price': '12.34', // TypeORM serializes decimals as strings
      'stock': 5,
      'createdAt': '2026-01-01T00:00:00.000Z',
    });
    expect(p.price, 12.34);
    expect(p.stock, 5);
    expect(p.name, 'Widget');
  });

  test('GroupPurchase parses status enum and partial list rows', () {
    final g = GroupPurchase.fromJson({
      'id': 'gp1',
      'title': 'Bulk deal',
      'originalPrice': 100,
      'targetPrice': 70,
      'discountPercentage': 30,
      'minimumParticipants': 3,
      'currentParticipants': 1,
      'status': 'ACTIVE',
      'expiresAt': '2026-01-01T00:00:00.000Z',
    });
    expect(g.status, GroupPurchaseStatus.active);
    expect(g.isActive, true);
    expect(g.isFull, false);
    expect(g.productId, isNull); // absent in list rows
  });

  test('AuthState decodes the sub claim from a JWT', () {
    // header.payload.signature — payload = {"sub":"user-123"}
    const token =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature';
    final s = AuthState.fromToken(token);
    expect(s.userId, 'user-123');
  });
}

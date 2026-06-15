import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/dio_client.dart';
import '../../products/domain/product.dart';
import '../domain/group_purchase.dart';

final groupPurchaseRepositoryProvider =
    Provider<GroupPurchaseRepository>((ref) {
  return GroupPurchaseRepository(ref.read(dioProvider));
});

class GroupPurchaseRepository {
  GroupPurchaseRepository(this._dio);
  final Dio _dio;

  Future<Paginated<GroupPurchase>> list({
    String? productId,
    int skip = 0,
    int take = 10,
  }) {
    return guardDio(() async {
      final res = await _dio.get('/group-purchases', queryParameters: {
        if (productId != null) 'productId': productId,
        'skip': skip,
        'take': take,
      });
      return GroupPurchase.pageFromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<GroupPurchase> get(String id) {
    return guardDio(() async {
      final res = await _dio.get('/group-purchases/$id');
      return GroupPurchase.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<String> create({
    required String productId,
    required String title,
    required String description,
    required double originalPrice,
    required double targetPrice,
    required int minimumParticipants,
    required int durationMinutes,
  }) {
    return guardDio(() async {
      final res = await _dio.post('/group-purchases', data: {
        'productId': productId,
        'title': title,
        'description': description,
        'originalPrice': originalPrice,
        'targetPrice': targetPrice,
        'minimumParticipants': minimumParticipants,
        'durationMinutes': durationMinutes,
      });
      return res.data['id'] as String;
    });
  }

  Future<void> join(String id) {
    return guardDio(() async {
      await _dio.post('/group-purchases/$id/join');
    });
  }

  Future<void> leave(String id) {
    return guardDio(() async {
      await _dio.delete('/group-purchases/$id/leave');
    });
  }
}

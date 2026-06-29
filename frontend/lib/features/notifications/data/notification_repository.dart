import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/dio_client.dart';
import '../../products/domain/product.dart' show Paginated;
import '../domain/notification.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.read(dioProvider));
});

class NotificationRepository {
  NotificationRepository(this._dio);
  final Dio _dio;

  Future<Paginated<AppNotification>> list({int skip = 0, int take = 10}) {
    return guardDio(() async {
      final res = await _dio.get('/notifications', queryParameters: {
        'skip': skip,
        'take': take,
      });
      return Paginated.fromJson(
        res.data as Map<String, dynamic>,
        AppNotification.fromJson,
      );
    });
  }

  Future<int> unreadCount() {
    return guardDio(() async {
      final res = await _dio.get('/notifications/unread-count');
      return ((res.data as Map<String, dynamic>)['count'] as num).toInt();
    });
  }

  Future<void> markRead(String id) {
    return guardDio(() async {
      await _dio.patch('/notifications/$id/read');
    });
  }

  Future<void> markAllRead() {
    return guardDio(() async {
      await _dio.patch('/notifications/read-all');
    });
  }
}

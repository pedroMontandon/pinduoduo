import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/dio_client.dart';
import '../domain/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.read(dioProvider));
});

class ProductRepository {
  ProductRepository(this._dio);
  final Dio _dio;

  Future<Paginated<Product>> list({int skip = 0, int take = 10}) {
    return guardDio(() async {
      final res = await _dio.get('/products', queryParameters: {
        'skip': skip,
        'take': take,
      });
      return Paginated.fromJson(
        res.data as Map<String, dynamic>,
        Product.fromJson,
      );
    });
  }

  Future<Product> get(String id) {
    return guardDio(() async {
      final res = await _dio.get('/products/$id');
      return Product.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<String> create({
    required String name,
    required String description,
    required double price,
    required int stock,
  }) {
    return guardDio(() async {
      final res = await _dio.post('/products', data: {
        'name': name,
        'description': description,
        'price': price,
        'stock': stock,
      });
      return res.data['id'] as String;
    });
  }

  Future<void> update(
    String id, {
    String? name,
    String? description,
    double? price,
    int? stock,
  }) {
    return guardDio(() async {
      await _dio.put('/products/$id', data: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (price != null) 'price': price,
        if (stock != null) 'stock': stock,
      });
    });
  }

  Future<void> delete(String id) {
    return guardDio(() async {
      await _dio.delete('/products/$id');
    });
  }
}

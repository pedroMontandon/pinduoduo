import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/dio_client.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider));
});

class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// POST /users — registers a new account. Returns the new user id.
  Future<String> register({
    required String name,
    required String email,
    required String password,
  }) {
    return guardDio(() async {
      final res = await _dio.post('/users', data: {
        'name': name,
        'email': email,
        'password': password,
      });
      return res.data['id'] as String;
    });
  }

  /// POST /users/login — returns the JWT access token.
  Future<String> login({
    required String email,
    required String password,
  }) {
    return guardDio(() async {
      final res = await _dio.post('/users/login', data: {
        'email': email,
        'password': password,
      });
      return res.data['accessToken'] as String;
    });
  }
}

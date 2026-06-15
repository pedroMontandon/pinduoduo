import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/env.dart';
import '../error/api_exception.dart';
import '../../features/auth/application/auth_controller.dart';

/// Single secure-storage instance (holds the JWT).
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

/// Configured [Dio] used by every repository.
///
/// The auth token is read lazily per request from [authControllerProvider], so
/// there is no initialization cycle even though the auth feature also depends
/// on this client.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
      // Let us map non-2xx ourselves via DioException below.
      validateStatus: (s) => s != null && s >= 200 && s < 300,
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = ref.read(authControllerProvider).valueOrNull?.token;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        // If a previously-authenticated call is rejected, drop the session.
        final hadToken = ref.read(authControllerProvider).valueOrNull != null;
        if (error.response?.statusCode == 401 && hadToken) {
          ref.read(authControllerProvider.notifier).onUnauthorized();
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

/// Helper to run a Dio call and surface a friendly [ApiException].
Future<T> guardDio<T>(Future<T> Function() call) async {
  try {
    return await call();
  } on DioException catch (e) {
    throw ApiException.fromDio(e);
  }
}

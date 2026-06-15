import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/dio_client.dart';
import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

const _tokenKey = 'jwt_token';

/// Holds the current session. `null` data means logged out.
final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthState?>(AuthController.new);

class AuthController extends AsyncNotifier<AuthState?> {
  @override
  Future<AuthState?> build() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.read(key: _tokenKey);
    if (token == null) return null;
    return AuthState.fromToken(token);
  }

  bool get isAuthenticated => state.valueOrNull != null;
  String? get userId => state.valueOrNull?.userId;

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final token = await ref
          .read(authRepositoryProvider)
          .login(email: email, password: password);
      await ref.read(secureStorageProvider).write(key: _tokenKey, value: token);
      return AuthState.fromToken(token);
    });
  }

  /// Registers, then logs in with the same credentials.
  Future<void> register(String name, String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      await repo.register(name: name, email: email, password: password);
      final token = await repo.login(email: email, password: password);
      await ref.read(secureStorageProvider).write(key: _tokenKey, value: token);
      return AuthState.fromToken(token);
    });
  }

  Future<void> logout() async {
    await ref.read(secureStorageProvider).delete(key: _tokenKey);
    state = const AsyncData(null);
  }

  /// Called by the Dio interceptor when a request 401s — drop the session.
  void onUnauthorized() {
    ref.read(secureStorageProvider).delete(key: _tokenKey);
    state = const AsyncData(null);
  }
}

import 'dart:convert';

/// Authenticated session: the raw JWT plus the user id decoded from it.
class AuthState {
  const AuthState({required this.token, required this.userId});

  final String token;
  final String? userId;

  /// Decodes the `sub` claim (user id) from a JWT without extra packages.
  static String? decodeUserId(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      var payload = parts[1].replaceAll('-', '+').replaceAll('_', '/');
      switch (payload.length % 4) {
        case 2:
          payload += '==';
          break;
        case 3:
          payload += '=';
          break;
      }
      final map = jsonDecode(utf8.decode(base64.decode(payload)))
          as Map<String, dynamic>;
      return map['sub'] as String?;
    } catch (_) {
      return null;
    }
  }

  factory AuthState.fromToken(String token) =>
      AuthState(token: token, userId: decodeUserId(token));
}

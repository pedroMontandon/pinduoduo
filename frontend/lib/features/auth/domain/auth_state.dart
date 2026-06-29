import 'dart:convert';

/// Authenticated session: the raw JWT plus the user id and email decoded from it.
class AuthState {
  const AuthState({required this.token, required this.userId, this.email});

  final String token;
  final String? userId;
  final String? email;

  /// Decodes the JWT payload (claims) without extra packages.
  static Map<String, dynamic>? decodePayload(String token) {
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
      return jsonDecode(utf8.decode(base64.decode(payload)))
          as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Decodes the `sub` claim (user id) from a JWT.
  static String? decodeUserId(String token) =>
      decodePayload(token)?['sub'] as String?;

  factory AuthState.fromToken(String token) {
    final claims = decodePayload(token);
    return AuthState(
      token: token,
      userId: claims?['sub'] as String?,
      email: claims?['email'] as String?,
    );
  }
}

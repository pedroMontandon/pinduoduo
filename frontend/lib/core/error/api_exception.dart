import 'package:dio/dio.dart';

/// User-facing error wrapping a failed HTTP call.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;

  /// Maps a [DioException] to a friendly message using the backend's
  /// `{ message }` body when present, falling back per status code.
  factory ApiException.fromDio(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;

    // NestJS errors look like { statusCode, message, error }.
    String? backendMessage;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String) {
        backendMessage = msg;
      } else if (msg is List && msg.isNotEmpty) {
        backendMessage = msg.first.toString();
      }
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.connectionError) {
      return ApiException(
        'Cannot reach the server. Is the backend running?',
        statusCode: status,
      );
    }

    final fallback = switch (status) {
      400 => 'Invalid request.',
      401 => 'You need to sign in.',
      403 => 'Not allowed.',
      404 => 'Not found.',
      409 => 'Conflict — that already exists.',
      _ => 'Something went wrong.',
    };

    return ApiException(backendMessage ?? fallback, statusCode: status);
  }
}

import '../../../shared/format.dart';

/// A user notification (e.g. a confirmed group purchase).
///
/// Named `AppNotification` to avoid clashing with Flutter's `Notification`.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.message,
    this.groupPurchaseId,
    required this.read,
    this.createdAt,
  });

  final String id;
  final String message;
  final String? groupPurchaseId;
  final bool read;
  final DateTime? createdAt;

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        message: message,
        groupPurchaseId: groupPurchaseId,
        read: read ?? this.read,
        createdAt: createdAt,
      );

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        message: (j['message'] ?? '') as String,
        groupPurchaseId: j['groupPurchaseId'] as String?,
        read: (j['read'] ?? false) as bool,
        createdAt: parseDate(j['createdAt']),
      );
}

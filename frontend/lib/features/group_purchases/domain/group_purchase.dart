import '../../../shared/format.dart';
import '../../products/domain/product.dart';

enum GroupPurchaseStatus {
  active,
  confirmed,
  expired,
  unknown;

  static GroupPurchaseStatus parse(dynamic v) {
    switch (v?.toString().toUpperCase()) {
      case 'ACTIVE':
        return GroupPurchaseStatus.active;
      case 'CONFIRMED':
        return GroupPurchaseStatus.confirmed;
      case 'EXPIRED':
        return GroupPurchaseStatus.expired;
      default:
        return GroupPurchaseStatus.unknown;
    }
  }

  String get label => switch (this) {
        GroupPurchaseStatus.active => 'Active',
        GroupPurchaseStatus.confirmed => 'Confirmed',
        GroupPurchaseStatus.expired => 'Expired',
        GroupPurchaseStatus.unknown => 'Unknown',
      };
}

/// A group-purchase campaign. Covers both list rows (some fields null) and the
/// full detail response.
class GroupPurchase {
  const GroupPurchase({
    required this.id,
    required this.title,
    required this.originalPrice,
    required this.targetPrice,
    required this.discountPercentage,
    required this.minimumParticipants,
    required this.currentParticipants,
    required this.status,
    this.productId,
    this.creatorId,
    this.creatorEmail,
    this.description,
    this.expiresAt,
    this.confirmedAt,
    this.createdAt,
  });

  final String id;
  final String title;
  final double originalPrice;
  final double targetPrice;
  final double discountPercentage;
  final int minimumParticipants;
  final int currentParticipants;
  final GroupPurchaseStatus status;

  // Detail-only (null in list rows).
  final String? productId;
  final String? creatorId;
  final String? creatorEmail;
  final String? description;
  final DateTime? expiresAt;
  final DateTime? confirmedAt;
  final DateTime? createdAt;

  bool get isActive => status == GroupPurchaseStatus.active;
  bool get isFull => currentParticipants >= minimumParticipants;

  factory GroupPurchase.fromJson(Map<String, dynamic> j) => GroupPurchase(
        id: j['id'] as String,
        title: (j['title'] ?? '') as String,
        originalPrice: parseDouble(j['originalPrice']),
        targetPrice: parseDouble(j['targetPrice']),
        discountPercentage: parseDouble(j['discountPercentage']),
        minimumParticipants: parseInt(j['minimumParticipants']),
        currentParticipants: parseInt(j['currentParticipants']),
        status: GroupPurchaseStatus.parse(j['status']),
        productId: j['productId'] as String?,
        creatorId: j['creatorId'] as String?,
        creatorEmail: j['creatorEmail'] as String?,
        description: j['description'] as String?,
        expiresAt: parseDate(j['expiresAt']),
        confirmedAt: parseDate(j['confirmedAt']),
        createdAt: parseDate(j['createdAt']),
      );

  static Paginated<GroupPurchase> pageFromJson(Map<String, dynamic> j) =>
      Paginated.fromJson(j, GroupPurchase.fromJson);
}

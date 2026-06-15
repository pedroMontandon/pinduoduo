import '../../../shared/format.dart';

/// A catalog product. Used for both list rows and the detail view.
class Product {
  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String description;
  final double price;
  final int stock;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        name: (j['name'] ?? '') as String,
        description: (j['description'] ?? '') as String,
        price: parseDouble(j['price']),
        stock: parseInt(j['stock']),
        createdAt: parseDate(j['createdAt']),
        updatedAt: parseDate(j['updatedAt']),
      );
}

/// One page of a paginated list response `{ items, total, skip, take }`.
class Paginated<T> {
  const Paginated({
    required this.items,
    required this.total,
    required this.skip,
    required this.take,
  });

  final List<T> items;
  final int total;
  final int skip;
  final int take;

  factory Paginated.fromJson(
    Map<String, dynamic> j,
    T Function(Map<String, dynamic>) fromItem,
  ) {
    final raw = (j['items'] as List? ?? const []);
    return Paginated(
      items: raw
          .map((e) => fromItem(e as Map<String, dynamic>))
          .toList(growable: false),
      total: parseInt(j['total']),
      skip: parseInt(j['skip']),
      take: parseInt(j['take']),
    );
  }
}

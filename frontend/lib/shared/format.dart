import 'package:intl/intl.dart';

final _money = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$ ');

/// Formats a price as `R$ 12,34`.
String money(num value) => _money.format(value);

/// Robustly parses a JSON value that may be a number or a decimal string.
double parseDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0;
}

int parseInt(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? 0;
}

DateTime? parseDate(dynamic v) {
  if (v == null) return null;
  return DateTime.tryParse(v.toString())?.toLocal();
}

/// Human countdown from now until [target]: `2h 5m`, `45s`, or `expired`.
String countdown(DateTime? target) {
  if (target == null) return '—';
  final diff = target.difference(DateTime.now());
  if (diff.isNegative) return 'expired';
  final d = diff.inDays;
  final h = diff.inHours % 24;
  final m = diff.inMinutes % 60;
  final s = diff.inSeconds % 60;
  if (d > 0) return '${d}d ${h}h';
  if (h > 0) return '${h}h ${m}m';
  if (m > 0) return '${m}m ${s}s';
  return '${s}s';
}

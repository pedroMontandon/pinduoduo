import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../products/data/product_repository.dart';
import '../../products/domain/product.dart';
import '../application/gp_providers.dart';
import '../data/group_purchase_repository.dart';

/// Products available to attach a group purchase to.
final _productOptionsProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final page = await ref.read(productRepositoryProvider).list(take: 100);
  return page.items;
});

class GpCreatePage extends ConsumerStatefulWidget {
  const GpCreatePage({super.key, this.initialProductId});
  final String? initialProductId;

  @override
  ConsumerState<GpCreatePage> createState() => _GpCreatePageState();
}

class _GpCreatePageState extends ConsumerState<GpCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _originalPrice = TextEditingController();
  final _targetPrice = TextEditingController();
  final _minParticipants = TextEditingController(text: '2');
  final _durationMinutes = TextEditingController(text: '60');
  String? _productId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _productId = widget.initialProductId;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _originalPrice.dispose();
    _targetPrice.dispose();
    _minParticipants.dispose();
    _durationMinutes.dispose();
    super.dispose();
  }

  double _d(TextEditingController c) =>
      double.parse(c.text.replaceAll(',', '.'));

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_productId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Pick a product.')));
      return;
    }
    setState(() => _saving = true);
    try {
      final id = await ref.read(groupPurchaseRepositoryProvider).create(
            productId: _productId!,
            title: _title.text.trim(),
            description: _description.text.trim(),
            originalPrice: _d(_originalPrice),
            targetPrice: _d(_targetPrice),
            minimumParticipants: int.parse(_minParticipants.text),
            durationMinutes: int.parse(_durationMinutes.text),
          );
      ref.invalidate(gpListProvider(null));
      ref.invalidate(gpListProvider(_productId));
      if (mounted) context.go('/group-purchases/$id');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(_productOptionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('New group purchase')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  products.when(
                    loading: () => const LinearProgressIndicator(),
                    error: (e, _) => Text('Could not load products: $e'),
                    data: (list) => DropdownButtonFormField<String>(
                      initialValue: list.any((p) => p.id == _productId)
                          ? _productId
                          : null,
                      decoration:
                          const InputDecoration(labelText: 'Product'),
                      items: [
                        for (final p in list)
                          DropdownMenuItem(
                            value: p.id,
                            child: Text(p.name,
                                overflow: TextOverflow.ellipsis),
                          ),
                      ],
                      onChanged: (v) => setState(() => _productId = v),
                      validator: (v) =>
                          v == null ? 'Pick a product' : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _title,
                    decoration: const InputDecoration(labelText: 'Title'),
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _description,
                    decoration:
                        const InputDecoration(labelText: 'Description'),
                    maxLines: 2,
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _originalPrice,
                    decoration:
                        const InputDecoration(labelText: 'Original price'),
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true),
                    validator: _price,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _targetPrice,
                    decoration: const InputDecoration(
                        labelText: 'Target (group) price'),
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true),
                    validator: (v) {
                      final base = _price(v);
                      if (base != null) return base;
                      final t = double.tryParse((v ?? '').replaceAll(',', '.'));
                      final o = double.tryParse(
                          _originalPrice.text.replaceAll(',', '.'));
                      if (t != null && o != null && t >= o) {
                        return 'Must be below original price';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _minParticipants,
                    decoration: const InputDecoration(
                        labelText: 'Minimum participants (>= 2)'),
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      final n = int.tryParse(v ?? '');
                      if (n == null || n < 2) return 'At least 2';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _durationMinutes,
                    decoration: const InputDecoration(
                        labelText: 'Duration (minutes, >= 1)'),
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      final n = int.tryParse(v ?? '');
                      if (n == null || n < 1) return 'At least 1 minute';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child:
                                  CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Create group purchase'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'Required' : null;

  String? _price(String? v) {
    final n = double.tryParse((v ?? '').replaceAll(',', '.'));
    if (n == null || n <= 0) return 'Enter a price > 0';
    return null;
  }
}

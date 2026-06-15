import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../application/products_providers.dart';
import '../data/product_repository.dart';

/// Create (productId == null) or edit an existing product.
class ProductFormPage extends ConsumerStatefulWidget {
  const ProductFormPage({super.key, this.productId});

  final String? productId;
  bool get isEdit => productId != null;

  @override
  ConsumerState<ProductFormPage> createState() => _ProductFormPageState();
}

class _ProductFormPageState extends ConsumerState<ProductFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController();
  bool _saving = false;
  bool _prefilled = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _price.dispose();
    _stock.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final repo = ref.read(productRepositoryProvider);
    final price = double.parse(_price.text.replaceAll(',', '.'));
    final stock = int.parse(_stock.text);
    try {
      if (widget.isEdit) {
        await repo.update(
          widget.productId!,
          name: _name.text.trim(),
          description: _description.text.trim(),
          price: price,
          stock: stock,
        );
        ref.invalidate(productDetailProvider(widget.productId!));
      } else {
        await repo.create(
          name: _name.text.trim(),
          description: _description.text.trim(),
          price: price,
          stock: stock,
        );
      }
      ref.invalidate(productListProvider);
      if (mounted) {
        context.go(widget.isEdit
            ? '/products/${widget.productId}'
            : '/products');
      }
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
    // Prefill once when editing.
    if (widget.isEdit && !_prefilled) {
      final existing = ref.watch(productDetailProvider(widget.productId!));
      existing.whenData((p) {
        _name.text = p.name;
        _description.text = p.description;
        _price.text = p.price.toStringAsFixed(2);
        _stock.text = p.stock.toString();
        _prefilled = true;
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit product' : 'New product'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _name,
                    decoration: const InputDecoration(labelText: 'Name'),
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _description,
                    decoration:
                        const InputDecoration(labelText: 'Description'),
                    maxLines: 3,
                    validator: _required,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _price,
                    decoration: const InputDecoration(labelText: 'Price'),
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true),
                    validator: _positiveNum,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _stock,
                    decoration: const InputDecoration(labelText: 'Stock'),
                    keyboardType: TextInputType.number,
                    validator: _nonNegativeInt,
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
                          : Text(widget.isEdit ? 'Save' : 'Create'),
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

  String? _positiveNum(String? v) {
    final n = double.tryParse((v ?? '').replaceAll(',', '.'));
    if (n == null || n < 0) return 'Enter a valid price (>= 0)';
    return null;
  }

  String? _nonNegativeInt(String? v) {
    final n = int.tryParse(v ?? '');
    if (n == null || n < 0) return 'Enter a whole number (>= 0)';
    return null;
  }
}

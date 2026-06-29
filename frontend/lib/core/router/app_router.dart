import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/group_purchases/presentation/gp_create_page.dart';
import '../../features/group_purchases/presentation/gp_detail_page.dart';
import '../../features/group_purchases/presentation/gp_list_page.dart';
import '../../features/notifications/presentation/notifications_page.dart';
import '../../features/products/presentation/product_detail_page.dart';
import '../../features/products/presentation/product_form_page.dart';
import '../../features/products/presentation/product_list_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  // Bridge Riverpod auth changes to go_router's refresh mechanism.
  final refresh = ValueNotifier<int>(0);
  ref.onDispose(refresh.dispose);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);

  return GoRouter(
    initialLocation: '/products',
    refreshListenable: refresh,
    redirect: (context, state) {
      final loggedIn =
          ref.read(authControllerProvider).valueOrNull != null;
      final location = state.matchedLocation;
      final onAuthPage = location == '/login' || location == '/register';

      // Everything except the auth pages requires a session.
      if (!loggedIn && !onAuthPage) return '/login';
      if (loggedIn && onAuthPage) return '/products';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(
        path: '/products',
        builder: (_, __) => const ProductListPage(),
      ),
      GoRoute(
        path: '/products/new',
        builder: (_, __) => const ProductFormPage(),
      ),
      GoRoute(
        path: '/products/:id/edit',
        builder: (_, s) =>
            ProductFormPage(productId: s.pathParameters['id']),
      ),
      GoRoute(
        path: '/products/:id',
        builder: (_, s) =>
            ProductDetailPage(productId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsPage(),
      ),
      GoRoute(
        path: '/group-purchases',
        builder: (_, __) => const GpListPage(),
      ),
      GoRoute(
        path: '/group-purchases/new',
        builder: (_, s) => GpCreatePage(
          initialProductId: s.uri.queryParameters['productId'],
        ),
      ),
      GoRoute(
        path: '/group-purchases/:id',
        builder: (_, s) => GpDetailPage(id: s.pathParameters['id']!),
      ),
    ],
  );
});

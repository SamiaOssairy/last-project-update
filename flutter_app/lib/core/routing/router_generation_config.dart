import 'package:app_frontend/core/routing/app_route.dart';
import 'package:go_router/go_router.dart';

class RouterGenerationConfig {
  static GoRouter goRouter=GoRouter(
    initialLocation: AppRoute.home,
    routes: [
    // GoRoute(path: path)
     ]
     ,
  );
}
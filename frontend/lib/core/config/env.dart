/// App configuration. Override the API base URL at build/run time with:
///   flutter run --dart-define=API_URL=http://10.0.2.2:3000   (Android emulator)
class Env {
  /// Base URL of the NestJS backend.
  ///
  /// Defaults to localhost (works for web/desktop). Android emulators must use
  /// `10.0.2.2` to reach the host machine.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000',
  );

  /// How often the group-purchase detail screen refetches while open.
  static const Duration pollInterval = Duration(seconds: 3);
}

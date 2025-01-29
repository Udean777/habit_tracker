class AIServiceException implements Exception {
  final String message;
  AIServiceException(this.message);

  @override
  String toString() => message;
}

String getTimeZoneName() {
  final timeZoneOffset = DateTime.now().timeZoneOffset.inHours;
  switch (timeZoneOffset) {
    case 7:
      return 'WIB';
    case 8:
      return 'WITA';
    case 9:
      return 'WIT';
    default:
      return 'Unknown Time Zone';
  }
}

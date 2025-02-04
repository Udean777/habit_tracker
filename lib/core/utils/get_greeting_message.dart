String getGreetingMessage(DateTime date) {
  int hour = date.hour;

  if (hour < 12) {
    return 'Good Morning! Wish you a nice day.';
  } else if (hour < 17) {
    return 'Good Afternoon! How\'s today?';
  } else {
    return 'Good Evening! Time to rest!';
  }
}

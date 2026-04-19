import 'package:flutter/material.dart';

class AppI18n {
  static bool isArabic(BuildContext context) {
    return Localizations.localeOf(context).languageCode == 'ar';
  }

  static String t(BuildContext context, String en, String ar) {
    return isArabic(context) ? ar : en;
  }
}

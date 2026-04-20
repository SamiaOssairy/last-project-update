import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/localization/app_i18n.dart';
import '../core/services/api_service.dart';
import '../core/services/locale_service.dart';
import '../core/widgets/app_bottom_nav.dart';

class SettingPage extends StatefulWidget {
  final VoidCallback? onLogout;

  const SettingPage({
    super.key,
    this.onLogout,
  });

  @override
  State<SettingPage> createState() => _SettingPageState();
}

class _SettingPageState extends State<SettingPage> {
  final ApiService _apiService = ApiService();
  String _t(String en, String ar) => AppI18n.t(context, en, ar);
  
  String _familyTitle = '';
  List<Map<String, dynamic>> _savedProfiles = [];
  String _activeProfileKey = '';
  bool _darkMode = false;
  bool _locationSharing = true;
  bool _isUpdatingLocationSharing = false;
  String _languageCode = 'en';

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadSavedProfiles();
    _loadLocationSharing();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final familyTitle = prefs.getString('familyTitle') ?? '';
    
    setState(() {
      _familyTitle = familyTitle;
      _activeProfileKey = prefs.getString('activeProfileKey') ?? '';
      _languageCode = prefs.getString('app_locale') ?? 'en';
    });
  }

  Future<void> _showLanguageDialog() async {
    final selected = await showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(_t('Select Language', 'اختر اللغة')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: Text(_t('English', 'الإنجليزية')),
                value: 'en',
                groupValue: _languageCode,
                onChanged: (value) => Navigator.of(dialogContext).pop(value),
              ),
              RadioListTile<String>(
                title: Text(_t('Arabic', 'العربية')),
                value: 'ar',
                groupValue: _languageCode,
                onChanged: (value) => Navigator.of(dialogContext).pop(value),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(_t('Cancel', 'إلغاء')),
            ),
          ],
        );
      },
    );

    if (selected == null || selected == _languageCode) return;

    await LocaleService.setLocale(Locale(selected));
    if (!mounted) return;
    setState(() {
      _languageCode = selected;
    });
  }

  Future<void> _loadSavedProfiles() async {
    final profiles = await _apiService.getSavedProfiles();
    if (!mounted) return;
    setState(() {
      _savedProfiles = profiles;
    });
  }

  Future<void> _switchToProfile(String profileKey) async {
    try {
      await _apiService.switchProfile(profileKey);
      await _loadUserData();
      await _loadSavedProfiles();
      await _loadLocationSharing();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('Profile switched successfully', 'تم تبديل الحساب بنجاح'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_t('Failed to switch profile', 'فشل تبديل الحساب')}: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _removeProfile(String profileKey) async {
    try {
      final wasActive = profileKey == _activeProfileKey;
      await _apiService.removeSavedProfile(profileKey);
      await _loadSavedProfiles();
      await _loadUserData();
      await _loadLocationSharing();

      if (!mounted) return;

      if (wasActive && _savedProfiles.isEmpty) {
        if (widget.onLogout != null) {
          widget.onLogout!();
        } else {
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('Profile removed successfully', 'تم حذف الحساب بنجاح'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_t('Failed to remove profile', 'فشل حذف الحساب')}: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showSwitchProfileDialog() {
    if (_savedProfiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_t('No saved profiles yet. Login to another family first.', 'لا توجد حسابات محفوظة بعد. سجّل الدخول إلى عائلة أخرى أولاً.'))),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(_t('Switch Profile', 'تبديل الحساب')),
          content: SizedBox(
            width: 420,
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: _savedProfiles.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, index) {
                final profile = _savedProfiles[index];
                final profileKey = profile['profileKey']?.toString() ?? '';
                final isActive = profileKey == _activeProfileKey;
                final title = profile['familyTitle']?.toString() ?? _t('Family', 'العائلة');
                final username = profile['username']?.toString() ?? _t('Member', 'عضو');
                final mail = profile['mail']?.toString() ?? '';

                return ListTile(
                  title: Text('$title ($username)'),
                  subtitle: Text(mail),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isActive)
                        const Padding(
                          padding: EdgeInsets.only(right: 4),
                          child: Icon(Icons.check_circle, color: Color(0xFF4CAF50)),
                        ),
                      IconButton(
                        tooltip: _t('Remove profile', 'حذف الحساب'),
                        icon: const Icon(Icons.close, color: Colors.redAccent),
                        onPressed: () async {
                          Navigator.of(dialogContext).pop();
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (confirmContext) {
                              return AlertDialog(
                                title: Text(_t('Remove saved profile?', 'حذف الحساب المحفوظ؟')),
                                content: Text(_t('Remove $title ($username) from saved profiles?', 'حذف $title ($username) من الحسابات المحفوظة؟')),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.of(confirmContext).pop(false),
                                    child: Text(_t('Cancel', 'إلغاء')),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.of(confirmContext).pop(true),
                                    child: Text(_t('Remove', 'حذف'), style: const TextStyle(color: Colors.red)),
                                  ),
                                ],
                              );
                            },
                          );

                          if (confirmed == true) {
                            await _removeProfile(profileKey);
                          }
                        },
                      ),
                    ],
                  ),
                  onTap: () async {
                    Navigator.of(dialogContext).pop();
                    if (!isActive) {
                      await _switchToProfile(profileKey);
                    }
                  },
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(_t('Close', 'إغلاق')),
            ),
          ],
        );
      },
    );
  }

  Future<void> _loadLocationSharing() async {
    try {
      final response = await _apiService.getMyLocation();
      final location = response['data']?['location'];
      if (location != null && mounted) {
        setState(() {
          _locationSharing = location['is_sharing_enabled'] ?? true;
        });
      }
    } catch (_) {
      // Ignore here; user can still toggle later.
    }
  }

  Future<void> _toggleLocationSharingFromSettings(bool value) async {
    if (_isUpdatingLocationSharing) return;
    final previous = _locationSharing;
    setState(() {
      _locationSharing = value;
      _isUpdatingLocationSharing = true;
    });

    try {
      await _apiService.toggleLocationSharing(value);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value
              ? 'Location sharing enabled'
              : 'Location sharing disabled (parents have been notified)'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationSharing = previous;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update location sharing: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdatingLocationSharing = false;
        });
      }
    }
  }

  Future<void> _handleLogoutCurrent() async {
    await _apiService.logout();

    if (widget.onLogout != null) {
      widget.onLogout!();
    } else if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  Future<void> _handleLogoutAll() async {
    await _apiService.logoutAllProfiles();

    if (widget.onLogout != null) {
      widget.onLogout!();
    } else if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNav(selectedIndex: 4),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE8F5E9),
              Color(0xFFF3F4F6),
              Color(0xFFE8F5E9),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildProfileHeader(),
                      const SizedBox(height: 30),
                      _buildAccountSection(),
                      const SizedBox(height: 25),
                      _buildPreferencesSection(),
                      const SizedBox(height: 25),
                      _buildSupportSection(),
                      const SizedBox(height: 30),
                      _buildLogoutButton(),
                      const SizedBox(height: 100), // Space for bottom nav
                    ],
                  ),
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

  Widget _buildProfileHeader() {
    return Column(
      children: [
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            border: Border.all(color: const Color(0xFF4CAF50), width: 3),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/parent_icon.png',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.person,
                  size: 60,
                  color: Color(0xFF4CAF50),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 15),
        Text(
          _familyTitle.isNotEmpty ? _t('$_familyTitle Family', 'عائلة $_familyTitle') : _t('Family', 'العائلة'),
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          _t('Edit Profile', 'تعديل الملف الشخصي'),
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildAccountSection() {
    final isAr = AppI18n.isArabic(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.settings,
                color: Color(0xFF4CAF50),
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              isAr ? 'الحساب' : 'Account',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9).withOpacity(0.5),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: [
              _buildSettingItem(
                title: isAr ? 'المعلومات الشخصية' : 'Personal Information',
                onTap: () {
                  // Navigate to personal information page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'أفراد العائلة' : 'Family Members',
                onTap: () {
                  // Navigate to family members page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'تغيير كلمة المرور' : 'Change Password',
                onTap: () {
                  _showChangePasswordDialog();
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'تبديل الحساب' : 'Switch Profile',
                onTap: () {
                  _showSwitchProfileDialog();
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'الخصوصية والأمان' : 'Privacy & Security',
                onTap: () {
                  // Navigate to privacy & security page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'تعطيل الحساب' : 'Deactivate Account',
                titleColor: const Color(0xFF4CAF50),
                onTap: () {
                  _showDeactivateDialog();
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool isLoading = false;
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;

    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Container(
                width: 400,
                padding: const EdgeInsets.all(24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _t('Change Password', 'تغيير كلمة المرور'),
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(dialogContext),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      
                      // Current Password
                      TextField(
                        controller: currentPasswordController,
                        obscureText: obscureCurrent,
                        decoration: InputDecoration(
                          labelText: _t('Current Password', 'كلمة المرور الحالية'),
                          hintText: _t('Enter current password', 'أدخل كلمة المرور الحالية'),
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(obscureCurrent ? Icons.visibility_off : Icons.visibility),
                            onPressed: () {
                              setDialogState(() {
                                obscureCurrent = !obscureCurrent;
                              });
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // New Password
                      TextField(
                        controller: newPasswordController,
                        obscureText: obscureNew,
                        decoration: InputDecoration(
                          labelText: _t('New Password', 'كلمة المرور الجديدة'),
                          hintText: _t('Enter new password', 'أدخل كلمة المرور الجديدة'),
                          prefixIcon: const Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                            onPressed: () {
                              setDialogState(() {
                                obscureNew = !obscureNew;
                              });
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Confirm New Password
                      TextField(
                        controller: confirmPasswordController,
                        obscureText: obscureConfirm,
                        decoration: InputDecoration(
                          labelText: _t('Confirm New Password', 'تأكيد كلمة المرور الجديدة'),
                          hintText: _t('Confirm new password', 'أكد كلمة المرور الجديدة'),
                          prefixIcon: const Icon(Icons.lock),
                          suffixIcon: IconButton(
                            icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                            onPressed: () {
                              setDialogState(() {
                                obscureConfirm = !obscureConfirm;
                              });
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Password hint
                      Row(
                        children: [
                          Icon(Icons.info_outline, size: 14, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(
                              _t('Password must be at least 6 characters', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
                            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(dialogContext),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                side: const BorderSide(color: Color(0xFF4CAF50)),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: Text(
                                _t('Cancel', 'إلغاء'),
                                style: TextStyle(color: Color(0xFF4CAF50)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: isLoading
                                  ? null
                                  : () async {
                                      // Validation
                                      if (currentPasswordController.text.isEmpty) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(_t('Please enter current password', 'يرجى إدخال كلمة المرور الحالية'))),
                                        );
                                        return;
                                      }
                                      
                                      if (newPasswordController.text.isEmpty) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(_t('Please enter new password', 'يرجى إدخال كلمة المرور الجديدة'))),
                                        );
                                        return;
                                      }
                                      
                                      // TESTING PHASE ONLY:
                                      // Minimum password length check is temporarily disabled.
                                      // Re-enable before release.
                                      // if (newPasswordController.text.length < 6) {
                                      //   ScaffoldMessenger.of(context).showSnackBar(
                                      //     const SnackBar(content: Text('Password must be at least 6 characters')),
                                      //   );
                                      //   return;
                                      // }
                                      
                                      if (newPasswordController.text != confirmPasswordController.text) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(_t('Passwords do not match', 'كلمتا المرور غير متطابقتين'))),
                                        );
                                        return;
                                      }
                                      
                                      setDialogState(() {
                                        isLoading = true;
                                      });
                                      
                                      try {
                                        await _apiService.setPassword(
                                          currentPassword: currentPasswordController.text,
                                          newPassword: newPasswordController.text,
                                          confirmPassword: confirmPasswordController.text,
                                        );
                                        
                                        if (mounted) {
                                          Navigator.pop(dialogContext);
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(_t('Password changed successfully!', 'تم تغيير كلمة المرور بنجاح!')),
                                              backgroundColor: Colors.green,
                                            ),
                                          );
                                        }
                                      } catch (e) {
                                        if (mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('${_t('Failed', 'فشل')}: ${e.toString().replaceAll('Exception: ', '')}'),
                                              backgroundColor: Colors.red,
                                            ),
                                          );
                                        }
                                      } finally {
                                        if (mounted) {
                                          setDialogState(() {
                                            isLoading = false;
                                          });
                                        }
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4CAF50),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: isLoading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                    : Text(
                                      _t('Update', 'تحديث'),
                                      style: TextStyle(color: Colors.white),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildPreferencesSection() {
    final isAr = AppI18n.isArabic(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.notifications,
                color: Color(0xFF4CAF50),
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              isAr ? 'التفضيلات' : 'Preferences',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9).withOpacity(0.5),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: [
              _buildSettingItem(
                title: isAr ? 'الإشعارات' : 'Notifications',
                onTap: () {
                  // Navigate to notifications page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'اللغة' : 'Language',
                onTap: () {
                  _showLanguageDialog();
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItemWithSwitch(
                title: isAr ? 'الوضع الداكن' : 'Dark Mode',
                value: _darkMode,
                onChanged: (value) {
                  setState(() {
                    _darkMode = value;
                  });
                  // Implement dark mode functionality
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItemWithSwitch(
                title: _isUpdatingLocationSharing
                    ? (isAr ? 'مشاركة الموقع (جاري التحديث...)' : 'Location Sharing (updating...)')
                    : (isAr ? 'مشاركة الموقع' : 'Location Sharing'),
                subtitle: _locationSharing
                    ? (isAr ? 'يمكن للعائلة رؤية موقعك المباشر' : 'Family can see your live location')
                    : (isAr ? 'مخفي عن خريطة العائلة' : 'Hidden from family map'),
                value: _locationSharing,
                onChanged: _toggleLocationSharingFromSettings,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSupportSection() {
    final isAr = AppI18n.isArabic(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.help_outline,
                color: Color(0xFF4CAF50),
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              isAr ? 'الدعم' : 'Support',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFE8F5E9).withOpacity(0.5),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: [
              _buildSettingItem(
                title: isAr ? 'مركز المساعدة' : 'Help Center',
                onTap: () {
                  // Navigate to help center page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'تواصل معنا' : 'Contact Us',
                onTap: () {
                  // Navigate to contact us page
                },
              ),
              const Divider(height: 1, thickness: 1, color: Color(0xFFD4E7D7)),
              _buildSettingItem(
                title: isAr ? 'عن فاميلي هب' : 'About Family Hub',
                onTap: () {
                  // Navigate to about page
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingItem({
    required String title,
    required VoidCallback onTap,
    Color? titleColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                color: titleColor ?? const Color(0xFF1A1A1A),
                fontWeight: FontWeight.w500,
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: titleColor ?? Colors.grey[400],
              size: 24,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItemWithSwitch({
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF1A1A1A),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF777777),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Transform.scale(
            scale: 0.9,
            child: Switch(
              value: value,
              onChanged: _isUpdatingLocationSharing ? null : onChanged,
              activeTrackColor: const Color(0xFF4CAF50).withOpacity(0.5),
              inactiveThumbColor: Colors.grey[300],
              inactiveTrackColor: Colors.grey[200],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    final isAr = AppI18n.isArabic(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: () {
            showDialog(
              context: context,
              builder: (dialogContext) {
                return AlertDialog(
                  title: Text(isAr ? 'خيارات تسجيل الخروج' : 'Logout options'),
                  content: Text(isAr
                      ? 'اختر تسجيل خروج الحساب الحالي فقط أو كل الحسابات المحفوظة.'
                      : 'Choose whether to logout this profile only or all saved profiles.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(dialogContext).pop(),
                      child: Text(isAr ? 'إلغاء' : 'Cancel'),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.of(dialogContext).pop();
                        await _handleLogoutCurrent();
                      },
                      child: Text(isAr ? 'خروج الحساب الحالي' : 'Logout current'),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.of(dialogContext).pop();
                        await _handleLogoutAll();
                      },
                      child: Text(isAr ? 'خروج كل الحسابات' : 'Logout all', style: const TextStyle(color: Colors.red)),
                    ),
                  ],
                );
              },
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4CAF50),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
            elevation: 2,
          ),
          child: Text(
            isAr ? 'خيارات تسجيل الخروج' : 'Logout Options',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  void _showDeactivateDialog() {
    final isAr = AppI18n.isArabic(context);
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Text(
                isAr ? 'تعطيل الحساب' : 'Deactivate Account',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isAr
                        ? 'لتعطيل الحساب، يرجى تأكيد البريد الإلكتروني وكلمة المرور. هذا الإجراء سيمنع جميع أفراد العائلة من تسجيل الدخول.'
                        : 'To deactivate your account, please confirm your email and password. This action will prevent all family members from logging in.',
                    style: TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: emailController,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      hintText: 'Enter your email',
                      prefixIcon: const Icon(Icons.email, color: Color(0xFF4CAF50)),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
                      ),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 15),
                  TextField(
                    controller: passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: 'Enter your password',
                      prefixIcon: const Icon(Icons.lock, color: Color(0xFF4CAF50)),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF4CAF50), width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isLoading ? null : () => Navigator.pop(dialogContext),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
                ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () async {
                          if (emailController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please enter your email'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }
                          if (passwordController.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please enter your password'),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          setDialogState(() {
                            isLoading = true;
                          });

                          try {
                            await _apiService.deactivateAccount(
                              emailController.text.trim(),
                              passwordController.text,
                            );

                            if (mounted) {
                              Navigator.pop(dialogContext);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Account deactivated successfully'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                              // Auto logout after deactivation
                              await Future.delayed(const Duration(seconds: 1));
                              _handleLogoutCurrent();
                            }
                          } catch (e) {
                            setDialogState(() {
                              isLoading = false;
                            });
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(e.toString().replaceAll('Exception: ', '')),
                                  backgroundColor: Colors.red,
                                  duration: const Duration(seconds: 4),
                                ),
                              );
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Deactivate'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

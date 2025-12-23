import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:8000/api';
  
  // Get stored token
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }
  
  // Save token
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }
  
  // Get headers with token
  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  // Auth APIs
  Future<Map<String, dynamic>> signup(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      final responseData = jsonDecode(response.body);
      if (responseData['token'] != null) {
        await _saveToken(responseData['token']);
      }
      return responseData;
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Signup failed');
    }
  }
  
  Future<Map<String, dynamic>> login(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      if (responseData['token'] != null) {
        await _saveToken(responseData['token']);
      }
      // Save isFirstLogin status
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isFirstLogin', responseData['data']['isFirstLogin'] ?? false);
      return responseData;
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Login failed');
    }
  }
  
  // Set/Change Password API
  Future<Map<String, dynamic>> setPassword({
    String? currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final headers = await _getHeaders();
    print('🔵 Setting password...');
    
    final body = {
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    };
    
    if (currentPassword != null && currentPassword.isNotEmpty) {
      body['currentPassword'] = currentPassword;
    }
    
    final response = await http.post(
      Uri.parse('$baseUrl/auth/setPassword'),
      headers: headers,
      body: jsonEncode(body),
    );
    
    print('🔵 Set password response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      // Clear isFirstLogin flag
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isFirstLogin', false);
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to set password');
    }
  }
  
  // Check if first login
  Future<bool> isFirstLogin() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('isFirstLogin') ?? false;
  }
  
  // Member APIs
  Future<List<dynamic>> getAllMembers() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/members'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['members'] ?? [];
    } else {
      throw Exception('Failed to load members');
    }
  }
  
  Future<Map<String, dynamic>> createMember(Map<String, dynamic> data) async {
    final token = await _getToken();
    print('🔵 Token for createMember: ${token != null ? "EXISTS" : "NULL - THIS IS THE PROBLEM!"}');
    
    final headers = await _getHeaders();
    print('🔵 Creating member with headers: $headers');
    print('🔵 Member data: $data');
    
    final response = await http.post(
      Uri.parse('$baseUrl/members'),
      headers: headers,
      body: jsonEncode(data),
    );
    
    print('🔵 Response status: ${response.statusCode}');
    print('🔵 Response body: ${response.body}');
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to create member');
    }
  }
  
  // Member Type APIs
  Future<List<dynamic>> getAllMemberTypes() async {
    final token = await _getToken();
    print('🔵 Token retrieved: ${token != null ? "EXISTS (${token.substring(0, 20)}...)" : "NULL"}');
    
    final headers = await _getHeaders();
    print('🔵 Fetching member types with headers: $headers');
    
    final response = await http.get(
      Uri.parse('$baseUrl/memberTypes'),
      headers: headers,
    );
    
    print('🔵 Member types response status: ${response.statusCode}');
    print('🔵 Member types response body: ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['memberTypes'] ?? [];
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load member types');
    }
  }
  
  // Create Member Type API
  Future<Map<String, dynamic>> createMemberType(String typeName) async {
    final headers = await _getHeaders();
    print('🔵 Creating member type: $typeName');
    
    final response = await http.post(
      Uri.parse('$baseUrl/memberTypes'),
      headers: headers,
      body: jsonEncode({'type': typeName}),
    );
    
    print('🔵 Create member type response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to create member type');
    }
  }
  
  // Delete Member API
  Future<Map<String, dynamic>> deleteMember(String memberId) async {
    final headers = await _getHeaders();
    print('🔵 Deleting member: $memberId');
    
    final response = await http.delete(
      Uri.parse('$baseUrl/members/$memberId'),
      headers: headers,
    );
    
    print('🔵 Delete member response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to delete member');
    }
  }
  
  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    await prefs.remove('username');
    await prefs.remove('familyTitle');
  }

  // Deactivate Account
  Future<Map<String, dynamic>> deactivateAccount(String mail, String password) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/familyAccounts/deactivate'),
      headers: headers,
      body: jsonEncode({
        'mail': mail,
        'password': password,
      }),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to deactivate account');
    }
  }
}

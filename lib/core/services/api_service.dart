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
      // Save user data
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isFirstLogin', responseData['data']['isFirstLogin'] ?? false);
      await prefs.setString('memberType', responseData['data']['memberType'] ?? '');
      await prefs.setString('username', responseData['data']['username'] ?? '');
      await prefs.setString('familyTitle', responseData['data']['familyTitle'] ?? '');
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
    await prefs.remove('isFirstLogin');
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

  // ======================= TASK APIs =======================
  
  // Get all tasks
  Future<List<dynamic>> getAllTasks() async {
    final headers = await _getHeaders();
    print('🔵 Getting all tasks...');
    
    final response = await http.get(
      Uri.parse('$baseUrl/tasks'),
      headers: headers,
    );
    
    print('🔵 Tasks response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['tasks'] ?? [];
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load tasks');
    }
  }

  // Create task
  Future<Map<String, dynamic>> createTask(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/tasks'),
      headers: headers,
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to create task');
    }
  }

  // Delete task
  Future<void> deleteTask(String taskId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/tasks/$taskId'),
      headers: headers,
    );
    
    if (response.statusCode != 200 && response.statusCode != 204) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to delete task');
    }
  }

  // Get my assigned tasks
  Future<List<dynamic>> getMyTasks() async {
    final headers = await _getHeaders();
    print('🔵 Getting my tasks with headers: $headers');
    
    final response = await http.get(
      Uri.parse('$baseUrl/tasks/my-tasks'),
      headers: headers,
    );
    
    print('🔵 Tasks response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['tasks'] ?? [];
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load my tasks');
    }
  }

  // Get all assigned tasks (for status view)
  Future<List<dynamic>> getAllAssignedTasks() async {
    final headers = await _getHeaders();
    print('🔵 Getting all assigned tasks (history)...');
    
    final response = await http.get(
      Uri.parse('$baseUrl/tasks/all-assigned'),
      headers: headers,
    );
    
    print('🔵 Assigned tasks response: ${response.statusCode}');
    print('🔵 Assigned tasks body: ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      final tasks = responseData['data']['assignedTasks'] ?? [];
      print('🔵 Found ${tasks.length} assigned tasks');
      return tasks;
    } else {
      throw Exception('Failed to load assigned tasks');
    }
  }

  // Assign task
  Future<Map<String, dynamic>> assignTask(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/tasks/assign'),
      headers: headers,
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to assign task');
    }
  }

  // Complete task
  Future<Map<String, dynamic>> completeTask(String taskDetailId) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/tasks/assignments/$taskDetailId/complete'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to complete task');
    }
  }

  // Approve task completion (Parent only)
  Future<Map<String, dynamic>> approveTaskCompletion(String taskDetailId, bool approved) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/tasks/assignments/$taskDetailId/approve-completion'),
      headers: headers,
      body: jsonEncode({'approved': approved}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to approve task');
    }
  }

  // Get tasks waiting for approval (Parent only)
  Future<List<dynamic>> getTasksWaitingApproval() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/tasks/waiting-approval'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['tasksWaitingApproval'] ?? [];
    } else {
      throw Exception('Failed to load tasks waiting approval');
    }
  }

  // ======================= POINT WALLET APIs =======================
  
  // Get my wallet
  Future<Map<String, dynamic>> getMyWallet() async {
    final headers = await _getHeaders();
    print('🔵 Getting wallet with headers: $headers');
    
    final response = await http.get(
      Uri.parse('$baseUrl/point-wallet/my-wallet'),
      headers: headers,
    );
    
    print('🔵 Wallet response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['wallet'] ?? {};
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load wallet');
    }
  }

  // Get points ranking/leaderboard
  Future<List<dynamic>> getPointsRanking() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/point-wallet/ranking'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['ranking'] ?? [];
    } else {
      throw Exception('Failed to load ranking');
    }
  }

  // ======================= POINT HISTORY APIs =======================
  
  // Get my point history
  Future<List<dynamic>> getMyPointHistory() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/point-history/my-history'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['history'] ?? [];
    } else {
      throw Exception('Failed to load point history');
    }
  }

  // ======================= REDEEM APIs =======================
  
  // Request redemption
  Future<Map<String, dynamic>> requestRedemption(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/redeem/request'),
      headers: headers,
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to request redemption');
    }
  }

  // Get my redemptions
  Future<List<dynamic>> getMyRedemptions() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/redeem/my-redemptions'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['redemptions'] ?? [];
    } else {
      throw Exception('Failed to load redemptions');
    }
  }

  // Get pending redemptions (Parent only)
  Future<List<dynamic>> getPendingRedemptions() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/redeem/pending'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['redemptions'] ?? [];
    } else {
      throw Exception('Failed to load pending redemptions');
    }
  }

  // Parent approve/reject redemption
  Future<Map<String, dynamic>> parentApproveRedemption(String redeemId, bool approved, {String? note}) async {
    final headers = await _getHeaders();
    final Map<String, dynamic> body = {'approved': approved};
    if (note != null) body['note'] = note;
    
    final response = await http.patch(
      Uri.parse('$baseUrl/redeem/$redeemId/parent-approve'),
      headers: headers,
      body: jsonEncode(body),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to process redemption');
    }
  }

  // Cancel redemption
  Future<void> cancelRedemption(String redeemId) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/redeem/$redeemId/cancel'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to cancel redemption');
    }
  }

  // ======================= TASK CATEGORY APIs =======================
  
  // Get all task categories
  Future<List<dynamic>> getAllTaskCategories() async {
    final headers = await _getHeaders();
    print('🔵 Getting all task categories...');
    
    final response = await http.get(
      Uri.parse('$baseUrl/task-categories'),
      headers: headers,
    );
    
    print('🔵 Categories response: ${response.statusCode} - ${response.body}');
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['categories'] ?? [];
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load task categories');
    }
  }

  // Create task category
  Future<Map<String, dynamic>> createTaskCategory(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/task-categories'),
      headers: headers,
      body: jsonEncode(data),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to create category');
    }
  }

  // ======================= PENDING ASSIGNMENTS APIs (Parent) =======================
  
  // Get pending task assignments (needs parent approval)
  Future<List<dynamic>> getPendingAssignments() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/tasks/pending-assignments'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return responseData['data']['pendingAssignments'] ?? [];
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to load pending assignments');
    }
  }

  // Approve or reject task assignment (Parent only)
  Future<Map<String, dynamic>> approveTaskAssignment(String taskDetailId, bool approved) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/tasks/assignments/$taskDetailId/approve-assignment'),
      headers: headers,
      body: jsonEncode({'approved': approved}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to process assignment');
    }
  }

  // Apply manual penalty (Parent only)
  Future<Map<String, dynamic>> applyPenalty(String taskDetailId, int penaltyPoints, {String? notes}) async {
    final headers = await _getHeaders();
    final Map<String, dynamic> body = {'penalty_points': penaltyPoints};
    if (notes != null) body['notes'] = notes;
    
    final response = await http.post(
      Uri.parse('$baseUrl/tasks/assignments/$taskDetailId/penalty'),
      headers: headers,
      body: jsonEncode(body),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['message'] ?? 'Failed to apply penalty');
    }
  }

  // ======================= USER TYPE CHECK =======================
  
  // Check if current user is Parent
  Future<bool> isParent() async {
    final prefs = await SharedPreferences.getInstance();
    final memberType = prefs.getString('memberType');
    return memberType == 'Parent';
  }

  // Get current member type
  Future<String?> getMemberType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('memberType');
  }
}

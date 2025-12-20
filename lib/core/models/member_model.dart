class Member {
  final String id;
  final String username;
  final MemberType? memberType;
  final bool isOnline;

  Member({
    required this.id,
    required this.username,
    this.memberType,
    this.isOnline = false,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['_id'] ?? '',
      username: json['username'] ?? '',
      memberType: json['member_type_id'] != null
          ? MemberType.fromJson(json['member_type_id'])
          : null,
      isOnline: json['isOnline'] ?? false,
    );
  }

  String getAvatarEmoji() {
    final type = memberType?.type.toLowerCase() ?? '';
    if (type.contains('parent') || type.contains('father')) return '👨';
    if (type.contains('mother')) return '👩';
    if (type.contains('son')) return '👦';
    if (type.contains('daughter')) return '👧';
    if (type.contains('baby')) return '👶';
    return '🧒';
  }
}

class MemberType {
  final String id;
  final String type;

  MemberType({
    required this.id,
    required this.type,
  });

  factory MemberType.fromJson(Map<String, dynamic> json) {
    return MemberType(
      id: json['_id'] ?? '',
      type: json['type'] ?? '',
    );
  }
}

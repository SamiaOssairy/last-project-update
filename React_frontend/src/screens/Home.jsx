import React, { useState, useEffect } from 'react';
import { Home, Users, Calendar, MessageCircle, Settings, MapPin, Shield, LogOut } from 'lucide-react';
import '../styles/Home.css';
import { memberAPI } from '../services/api';

const HomePage = ({ userName = " ", familyTitle: propFamilyTitle = "", onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [locationSharing, setLocationSharing] = useState(true);
  const [protectionSetting, setProtectionSetting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyTitle, setFamilyTitle] = useState(propFamilyTitle);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
  };

  // Fetch user data and family members
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        // Get user data from localStorage if not passed as prop
        if (!propFamilyTitle) {
          const user = localStorage.getItem('user');
          if (user) {
            const userData = JSON.parse(user);
            setFamilyTitle(userData.familyTitle || "");
          }
        } else {
          setFamilyTitle(propFamilyTitle);
        }

        // Fetch family members from backend
        const response = await memberAPI.getAllMembers();
        if (response.data && response.data.members) {
          setFamilyMembers(response.data.members);
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [propFamilyTitle]);

  const upcomingActivities = [
    { id: 1, title: 'Requirments Gathering', date: 'Mon, 8pm', icon: '📄' },
    { id: 2, title: 'Family Movie Night', date: 'Fri, 8pm', icon: '🎬' }
  ];

  const calendarDays = [
    { day: 'Sat', dates: [1, 2, 3, 4] },
    { day: 'Mon', dates: [5, 6, 7, 8] },
    { day: 'Tue', dates: [9, 10, 11, 12] },
    { day: 'Wed', dates: [13, 14, 15, 16] },
    { day: 'Thu', dates: [17, 18, 19, 20] }
  ];

  // Map member type to emoji avatar
  const getAvatarEmoji = (memberType) => {
    const type = memberType?.toLowerCase() || '';
    if (type === 'parent' || type === 'father') return '👨';
    if (type === 'mother') return '👩';
    if (type === 'son') return '👦';
    if (type === 'daughter') return '👧';
    if (type === 'baby') return '👶';
    return '🧒';
  };

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="user-profile">
          <div className="avatar-large">
           
          </div>
          <div className="user-info">
            <h1>{familyTitle ? `${familyTitle} Family` : 'Family Hub'}</h1>
            <p>Welcome {userName}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Family Members Section */}
      {familyMembers.length > 0 && (
        <div className="section">
          <h2 className="section-title">Family Members</h2>
          <div className="family-members-grid">
            {familyMembers.map((member) => (
              <div key={member._id} className="family-member">
                <div className="member-avatar">
                  <span className="avatar-emoji">{getAvatarEmoji(member.member_type_id?.type)}</span>
                  <span className="status-dot"></span>
                </div>
                <span className="member-name">{member.username}</span>
                <span className="member-type">{member.member_type_id?.type || 'Member'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <div className="action-card family-focus">
            <div className="action-header">
              <Home className="action-icon" />
              <span>Family Focus</span>
            </div>
          </div>

          <div className="action-row">
            <div className="action-item">
              <Home className="icon-small" />
              <div className="action-details">
                <span className="action-label">Weekly Chores Complete: 70%</span>
              </div>
            </div>
            <div className="pending-invites">
              <div className="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="3"
                    strokeDasharray="70, 100"
                  />
                </svg>
              </div>
              <div className="pending-text">
                <span className="pending-number">Pending Invites (1)</span>
                <span className="pending-subtitle">Awaiting acceptance</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-outline">Set Family Title</button>
            <button className="btn-primary">View Family Hub</button>
          </div>
        </div>
      </div>

      {/* Upcoming Activities */}
      <div className="section">
        <h2 className="section-title">Upcoming Activites</h2>
        <div className="activities-container">
          <div className="mini-calendar">
            {calendarDays.map((col, idx) => (
              <div key={idx} className="calendar-column">
                <div className="calendar-day">{col.day}</div>
                {col.dates.map((date) => (
                  <div
                    key={date}
                    className={`calendar-date ${date === 20 ? 'selected' : ''}`}
                  >
                    {date}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="activities-list">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-info">
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-date">{activity.date}</span>
                </div>
                <input type="checkbox" className="activity-checkbox" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety & Connection */}
      <div className="section">
        <h2 className="section-title">Safety & Connection</h2>
        <div className="safety-settings">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon-wrapper green">
                <MapPin size={20} />
              </div>
              <div>
                <div className="setting-label">Location Sharing On</div>
                <div className="setting-subtitle">App Access Control</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={locationSharing}
                onChange={(e) => setLocationSharing(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon-wrapper green">
                <Shield size={20} />
              </div>
              <div>
                <div className="setting-label">View Protection Setting</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={protectionSetting}
                onChange={(e) => setProtectionSetting(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={24} />
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={24} />
          <span>Members</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={24} />
          <span>Schedule</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageCircle size={24} />
          <span>Chat</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={24} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default HomePage;

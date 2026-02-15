import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR');
}

function getTypeIcon(type) {
  switch (type) {
    case 'like_post':
    case 'like_gallery':
      return '❤️';
    case 'comment':
      return '💬';
    case 'reply':
      return '↩️';
    default:
      return '🔔';
  }
}

export default function NotificationBell({ setPage }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      setNotifications([]);
      setShowPanel(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await api.getUnreadNotificationCount();
        setUnreadCount(res.data?.count ?? 0);
      } catch {
        // silently ignore
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePanel = async () => {
    const opening = !showPanel;
    setShowPanel(opening);

    if (opening) {
      setLoading(true);
      try {
        const res = await api.getNotifications(30);
        setNotifications(res.data || []);
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }

    setShowPanel(false);

    if (notification.target_type === 'post') {
      setPage('showoff');
    } else if (notification.target_type === 'gallery') {
      setPage('gallery');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="notification-bell" ref={bellRef}>
      <button className="notification-bell-btn" onClick={togglePanel}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span>알림</span>
            <button onClick={handleMarkAllRead}>모두 읽음</button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">새로운 알림이 없습니다</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {!n.is_read && <span className="notification-dot" />}
                  <span className="notification-icon">{getTypeIcon(n.type)}</span>
                  <div className="notification-content">
                    <span className="notification-text">
                      <strong>{n.actor_name}</strong> {n.message}
                    </span>
                    <span className="notification-time">{getRelativeTime(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

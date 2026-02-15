import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const TYPE_STYLES = {
  info: { label: '안내', color: '#1565c0' },
  feature: { label: '새 기능', color: '#2e7d32' },
  event: { label: '이벤트', color: '#e65100' },
  maintenance: { label: '점검', color: '#c62828' },
};

const STORAGE_KEY = 'announcement_read_ids';

const ALLOWED_TAGS = ['b', 'strong', 'em', 'i', 'u', 'br'];

function sanitizeHtml(html) {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br/>')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
      const lower = tag.toLowerCase();
      if (ALLOWED_TAGS.includes(lower)) return match.replace(/\s+[a-z]+=["'][^"']*["']/gi, '');
      return '';
    });
}

function getLocalReadIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addLocalReadId(id) {
  const ids = getLocalReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export default function AnnouncementPopup() {
  const { isLoggedIn } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      if (isLoggedIn) {
        const res = await api.getUnreadAnnouncements();
        setAnnouncements(res.data || []);
      } else {
        const res = await api.getAnnouncements();
        const allAnnouncements = res.data || [];
        const readIds = getLocalReadIds();
        const unread = allAnnouncements.filter(a => !readIds.includes(a.id));
        setAnnouncements(unread);
      }
    } catch {
      // 에러 시 무시
    }
    setLoaded(true);
  }, [isLoggedIn]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const markAsRead = async (announcement) => {
    if (isLoggedIn) {
      try {
        await api.markAnnouncementRead(announcement.id);
      } catch {}
    }
    addLocalReadId(announcement.id);
  };

  const handleDismiss = async () => {
    const current = announcements[currentIndex];
    if (current) {
      await markAsRead(current);
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setAnnouncements([]);
      setCurrentIndex(0);
    }
  };

  const handleDismissAll = async () => {
    for (const ann of announcements) {
      await markAsRead(ann);
    }
    setAnnouncements([]);
    setCurrentIndex(0);
  };

  if (!loaded || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const typeStyle = TYPE_STYLES[current.type] || TYPE_STYLES.info;

  return (
    <div className="announcement-overlay" onClick={handleDismiss}>
      <div className="announcement-popup" onClick={(e) => e.stopPropagation()}>
        <div className="announcement-header">
          <span className="announcement-type-badge" style={{ background: typeStyle.color }}>
            {typeStyle.label}
          </span>
          <span className="announcement-date">
            {new Date(current.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {announcements.length > 1 && (
            <span className="announcement-counter">{currentIndex + 1} / {announcements.length}</span>
          )}
          <button className="announcement-close" onClick={handleDismiss} aria-label="닫기">&times;</button>
        </div>
        <h2 className="announcement-title">{current.title}</h2>
        <div
          className="announcement-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.content) }}
        />
        <div className="announcement-footer">
          <button className="announcement-confirm-btn" onClick={handleDismiss}>
            {currentIndex < announcements.length - 1 ? '다음' : '확인'}
          </button>
          {announcements.length > 1 && currentIndex < announcements.length - 1 && (
            <button className="announcement-dismiss-all" onClick={handleDismissAll}>
              모두 확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

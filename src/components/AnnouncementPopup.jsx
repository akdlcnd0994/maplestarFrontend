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
const SESSION_KEY = 'announcement_dismissed_session';

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

function getSessionDismissedIds() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addSessionDismissedId(id) {
  const ids = getSessionDismissedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids));
  }
}

export default function AnnouncementPopup() {
  const { isLoggedIn } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await api.getAnnouncements();
      const allAnnouncements = res.data || [];
      const permanentReadIds = getLocalReadIds();
      const sessionDismissedIds = getSessionDismissedIds();
      const visible = allAnnouncements.filter(
        a => !permanentReadIds.includes(a.id) && !sessionDismissedIds.includes(a.id)
      );
      setAnnouncements(visible);
    } catch {
      // 에러 시 무시
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // 이번 세션에서만 닫기 (다음 방문 시 다시 표시)
  const handleClose = () => {
    const current = announcements[currentIndex];
    if (current) {
      addSessionDismissedId(current.id);
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setAnnouncements([]);
      setCurrentIndex(0);
    }
  };

  // 영구적으로 다시 보지 않기
  const handleDontShowAgain = async () => {
    const current = announcements[currentIndex];
    if (current) {
      addLocalReadId(current.id);
      if (isLoggedIn) {
        try {
          await api.markAnnouncementRead(current.id);
        } catch {}
      }
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setAnnouncements([]);
      setCurrentIndex(0);
    }
  };

  if (!loaded || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const typeStyle = TYPE_STYLES[current.type] || TYPE_STYLES.info;

  return (
    <div className="announcement-overlay" onClick={handleClose}>
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
          <button className="announcement-close" onClick={handleClose} aria-label="닫기">&times;</button>
        </div>
        <h2 className="announcement-title">{current.title}</h2>
        <div
          className="announcement-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.content) }}
        />
        <div className="announcement-footer">
          <button className="announcement-confirm-btn" onClick={handleClose}>
            확인
          </button>
          <button className="announcement-dismiss-all" onClick={handleDontShowAgain}>
            다음에 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}

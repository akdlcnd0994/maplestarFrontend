import { useState, useEffect } from 'react';
import { api } from '../services/api';

const TYPE_STYLES = {
  info: { label: '안내', color: '#1565c0' },
  feature: { label: '새 기능', color: '#2e7d32' },
  event: { label: '이벤트', color: '#e65100' },
  maintenance: { label: '점검', color: '#c62828' },
};

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await api.getUnreadAnnouncements();
      setAnnouncements(res.data || []);
    } catch (e) {
      // 로그인 안됐으면 무시
    }
  };

  const handleDismiss = async () => {
    const current = announcements[currentIndex];
    if (current) {
      try {
        await api.markAnnouncementRead(current.id);
      } catch (e) {}
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAnnouncements([]);
    }
  };

  const handleDismissAll = async () => {
    for (const ann of announcements) {
      try {
        await api.markAnnouncementRead(ann.id);
      } catch (e) {}
    }
    setAnnouncements([]);
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const typeStyle = TYPE_STYLES[current.type] || TYPE_STYLES.info;

  return (
    <div className="announcement-overlay" onClick={handleDismiss}>
      <div className="announcement-popup" onClick={(e) => e.stopPropagation()}>
        <div className="announcement-header">
          <span className="announcement-type-badge" style={{ background: typeStyle.color }}>
            {typeStyle.label}
          </span>
          {announcements.length > 1 && (
            <span className="announcement-counter">{currentIndex + 1} / {announcements.length}</span>
          )}
          <button className="announcement-close" onClick={handleDismiss}>×</button>
        </div>
        <h2 className="announcement-title">{current.title}</h2>
        <div className="announcement-content" dangerouslySetInnerHTML={{ __html: current.content.replace(/\n/g, '<br/>') }} />
        <div className="announcement-footer">
          <button className="announcement-confirm-btn" onClick={handleDismiss}>
            {currentIndex < announcements.length - 1 ? '다음' : '확인'}
          </button>
          {announcements.length > 1 && (
            <button className="announcement-dismiss-all" onClick={handleDismissAll}>모두 확인</button>
          )}
        </div>
      </div>
    </div>
  );
}

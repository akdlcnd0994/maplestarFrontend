import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getIconEmoji } from '../components/UserAvatar';

export default function SchedulePage({ setPage }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '20:00',
    event_type: 'event',
    max_participants: '',
  });

  const isAdmin = user?.role === 'master' || user?.role === 'submaster';

  const types = {
    boss: { bg: '#c44536', label: '보스' },
    party: { bg: '#5a7247', label: '파퀘' },
    event: { bg: '#daa520', label: '이벤트' },
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.getEvents();
      setEvents(res.data || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    }
    setLoading(false);
  };

  const loadParticipants = async (eventId) => {
    try {
      const res = await api.getEventParticipants(eventId);
      setParticipants(res.data || []);
      setShowParticipants(eventId);
    } catch (e) {
      console.error('Failed to load participants:', e);
    }
  };

  const handleJoin = async (eventId) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      setPage('login');
      return;
    }
    try {
      const res = await api.joinEvent(eventId);
      alert(res.data.message);
      loadEvents();
      checkAuth();
      if (showParticipants === eventId) {
        loadParticipants(eventId);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_time: '20:00',
      event_type: 'event',
      max_participants: '',
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditMode(true);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      event_time: event.event_time || '20:00',
      event_type: event.event_type || 'event',
      max_participants: event.max_participants || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      alert('제목과 날짜는 필수입니다.');
      return;
    }

    try {
      if (editMode && selectedEvent) {
        await api.updateEvent(selectedEvent.id, {
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        });
        alert('일정이 수정되었습니다.');
      } else {
        await api.createEvent({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        });
        alert('일정이 등록되었습니다.');
      }
      setShowModal(false);
      loadEvents();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;
    try {
      await api.deleteEvent(eventId);
      alert('일정이 삭제되었습니다.');
      loadEvents();
    } catch (e) {
      alert(e.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: '', day: '', full: '' };
    const d = new Date(dateStr);
    return {
      date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
      day: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
      full: dateStr,
    };
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>운동회 일정</h1>
        {isAdmin && (
          <button className="write-btn" onClick={openAddModal}>일정 추가</button>
        )}
      </div>

      {/* 일정 추가/수정 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? '일정 수정' : '일정 추가'}>
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목 <span className="required">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="일정 제목"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>날짜 <span className="required">*</span></label>
              <input
                type="date"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>시간</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={e => setFormData({ ...formData, event_time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>유형</label>
              <select
                value={formData.event_type}
                onChange={e => setFormData({ ...formData, event_type: e.target.value })}
              >
                <option value="event">이벤트</option>
                <option value="boss">보스</option>
                <option value="party">파퀘</option>
              </select>
            </div>
            <div className="form-group">
              <label>정원 (선택)</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={e => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="제한 없음"
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="일정에 대한 설명"
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowModal(false)}>취소</button>
            <button type="submit" className="primary">{editMode ? '수정' : '등록'}</button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="schedule-list">
          {events.length === 0 ? (
            <div className="empty-message">예정된 일정이 없습니다.</div>
          ) : (
            events.map((e) => {
              const { date, day } = formatDate(e.event_date);
              const typeInfo = types[e.event_type] || types.event;
              const isFull = e.max_participants && e.current_participants >= e.max_participants;
              return (
                <div key={e.id} className="schedule-item">
                  <div className="schedule-date">
                    <span className="sch-date">{date}</span>
                    <span className="sch-day">{day}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-main">
                      <span className="schedule-type" style={{ background: typeInfo.bg }}>
                        {typeInfo.label}
                      </span>
                      <h4>{e.title}</h4>
                      {isAdmin && (
                        <div className="admin-btns">
                          <button className="edit-btn-small" onClick={() => openEditModal(e)}>수정</button>
                          <button className="delete-btn-small" onClick={() => handleDelete(e.id)}>삭제</button>
                        </div>
                      )}
                    </div>
                    <p>{e.description}</p>
                    <div className="schedule-meta">
                      <span className="schedule-time">🕘 {e.event_time}</span>
                      {e.max_participants && (
                        <span className={`schedule-participants ${isFull ? 'full' : ''}`}>
                          👥 {e.current_participants || 0}/{e.max_participants}
                        </span>
                      )}
                      <button
                        className="view-participants-btn"
                        onClick={() => showParticipants === e.id ? setShowParticipants(null) : loadParticipants(e.id)}
                      >
                        {showParticipants === e.id ? '접기' : '참가자 보기'}
                      </button>
                    </div>

                    {/* 참가자 목록 */}
                    {showParticipants === e.id && (
                      <div className="participants-list">
                        <h5>참가자 ({participants.length}명)</h5>
                        {participants.length === 0 ? (
                          <p className="no-participants">아직 참가자가 없습니다.</p>
                        ) : (
                          <div className="participants-grid">
                            {participants.map((p) => (
                              <div key={p.id} className="participant-item">
                                <div className={`participant-avatar ${p.default_icon && !p.profile_image ? 'has-icon' : ''}`}>
                                  {p.profile_image ? (
                                    <img src={getImageUrl(p.profile_image)} alt="" style={{ transform: `scale(${p.profile_zoom || 1})` }} />
                                  ) : getIconEmoji(p.default_icon)}
                                </div>
                                <div className="participant-info">
                                  <span className="participant-name">{p.character_name}</span>
                                  <span className="participant-detail">Lv.{p.level} {p.job}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className={`join-btn ${isFull ? 'disabled' : ''}`}
                    onClick={() => handleJoin(e.id)}
                    disabled={isFull}
                  >
                    {isFull ? '마감' : '참가신청'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="schedule-info-box">
        <h4>일정 안내</h4>
        <ul>
          <li>모든 일정은 한국 시간 기준입니다.</li>
          <li>참가 신청은 행사 1시간 전까지 가능합니다.</li>
          <li>다시 클릭하면 참가 취소됩니다.</li>
          <li>일정 변경 시 디스코드로 공지됩니다.</li>
        </ul>
      </div>
    </div>
  );
}

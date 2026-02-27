import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import RichTextEditor from '../components/RichTextEditor';

export default function NoticePage({ setPage, selectedNotice, setSelectedNotice }) {
  const { user, isLoggedIn } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWrite, setShowWrite] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [writeData, setWriteData] = useState({ title: '', content: '', is_important: false });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'master' || user?.role === 'submaster';

  useEffect(() => {
    loadNotices();
  }, []);

  // 메인페이지에서 선택된 공지가 있으면 바로 표시
  useEffect(() => {
    if (selectedNotice) {
      setShowDetail(selectedNotice);
      setSelectedNotice?.(null); // 사용 후 초기화
    }
  }, [selectedNotice]);

  const loadNotices = async () => {
    try {
      const res = await api.getNotices();
      setNotices(res.data || []);
    } catch (e) {
      console.error('Failed to load notices:', e);
    }
    setLoading(false);
  };

  const handleWrite = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      setPage('login');
      return;
    }
    if (!isAdmin) {
      alert('공지사항 작성은 길마/부마만 가능합니다.');
      return;
    }
    setEditMode(false);
    setWriteData({ title: '', content: '', is_important: false });
    setShowWrite(true);
  };

  const handleEdit = (notice) => {
    setEditMode(true);
    setWriteData({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important || false,
    });
    setShowDetail(null);
    setShowWrite(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!writeData.title.trim() || !writeData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (editMode) {
        await api.updateNotice(writeData.id, {
          title: writeData.title,
          content: writeData.content,
          is_important: writeData.is_important,
        });
      } else {
        await api.createNotice({
          title: writeData.title,
          content: writeData.content,
          is_important: writeData.is_important,
        });
      }
      closeModal();
      loadNotices();
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.deleteNotice(id);
      setShowDetail(null);
      loadNotices();
    } catch (e) {
      alert(e.message);
    }
  };

  const closeModal = () => {
    setShowWrite(false);
    setWriteData({ title: '', content: '', is_important: false });
    setEditMode(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 공지 내용 렌더링: 리치에디터(HTML) 또는 구버전 일반 텍스트 모두 대응
  const renderContent = (content) => {
    if (!content) return '';
    // HTML 태그로 시작하면 리치에디터 출력물로 간주
    if (/^<[a-z]/i.test(content.trim())) {
      return content.replace(/src="(\/api\/[^"]+)"/g, (_, path) => `src="${getImageUrl(path)}"`);
    }
    // 구버전 일반 텍스트 → XSS 이스케이프 후 줄바꿈 처리
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>공지사항</h1>
        {isAdmin && (
          <button className="write-btn" onClick={handleWrite}>글쓰기</button>
        )}
      </div>

      {/* 글쓰기/수정 모달 */}
      <Modal isOpen={showWrite} onClose={closeModal} title={editMode ? "공지사항 수정" : "공지사항 작성"} className="write-modal" preventOutsideClose>
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="공지사항 제목"
              value={writeData.title}
              onChange={e => setWriteData({ ...writeData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>내용 <span className="editor-hint">이미지를 붙여넣기(Ctrl+V) 또는 드래그하면 바로 삽입됩니다</span></label>
            <RichTextEditor
              content={writeData.content}
              onChange={(html) => setWriteData(d => ({ ...d, content: html }))}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={writeData.is_important}
                onChange={e => setWriteData({ ...writeData, is_important: e.target.checked })}
              />
              <span>중요 공지로 설정 (상단 고정)</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={closeModal}>취소</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? '저장 중...' : editMode ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 상세보기 모달 */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content notice-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="notice-detail-header">
                {showDetail.is_important && <span className="notice-tag important">중요</span>}
                <h3>{showDetail.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowDetail(null)}>×</button>
            </div>
            <div className="notice-detail-body">
              <div className="notice-detail-meta">
                <span className="notice-author">{showDetail.user?.character_name || '관리자'}</span>
                <span className="notice-date">{formatDate(showDetail.created_at)}</span>
              </div>
              <div
                className="notice-detail-content rich-content"
                dangerouslySetInnerHTML={{ __html: renderContent(showDetail.content) }}
              />
              {isAdmin && (
                <div className="notice-detail-actions">
                  <button className="edit-btn" onClick={() => handleEdit(showDetail)}>수정</button>
                  <button className="delete-btn" onClick={() => handleDelete(showDetail.id)}>삭제</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="notice-list">
          {notices.length === 0 ? (
            <div className="empty-message">공지사항이 없습니다.</div>
          ) : (
            <>
              {/* 중요 공지 */}
              {notices.filter(n => n.is_important).map((notice, i) => (
                <div
                  key={notice.id || i}
                  className="notice-list-item important"
                  onClick={() => setShowDetail(notice)}
                >
                  <div className="notice-list-header">
                    <span className="notice-tag important">중요</span>
                    <span className="notice-title">{notice.title}</span>
                  </div>
                  <div className="notice-list-meta">
                    <span className="notice-author">{notice.user?.character_name || '관리자'}</span>
                    <span className="notice-time">{formatTime(notice.created_at)}</span>
                  </div>
                </div>
              ))}
              {/* 일반 공지 */}
              {notices.filter(n => !n.is_important).map((notice, i) => (
                <div
                  key={notice.id || i}
                  className="notice-list-item"
                  onClick={() => setShowDetail(notice)}
                >
                  <div className="notice-list-header">
                    <span className="notice-title">{notice.title}</span>
                  </div>
                  <div className="notice-list-meta">
                    <span className="notice-author">{notice.user?.character_name || '관리자'}</span>
                    <span className="notice-time">{formatTime(notice.created_at)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

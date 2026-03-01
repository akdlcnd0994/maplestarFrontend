import { useState, useEffect, useRef } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getIconEmoji } from '../components/UserAvatar';
import StyledName, { ProfileFrame } from '../components/StyledName';

export default function GalleryPage({ setPage }) {
  const { user, isLoggedIn, checkAuth, updateUser } = useAuth();
  const isAdmin = user?.role === 'master' || user?.role === 'submaster';
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, image: null, data: null });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ id: null, title: '', description: '' });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likingIds, setLikingIds] = useState(new Set());
  const fileRef = useRef(null);

  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: true
  });

  useEffect(() => {
    loadGallery(1, true);
  }, []);

  // 클립보드 붙여넣기 이벤트 처리
  useEffect(() => {
    if (!showUpload) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const namedFile = new File([file], `screenshot_${Date.now()}.png`, { type: file.type });
            setSelectedFile(namedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(namedFile);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [showUpload]);

  // 라이트박스 키보드 이벤트
  useEffect(() => {
    if (!lightbox.open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox({ open: false, image: null, data: null });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.open]);

  const loadGallery = async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.getGallery({
        page,
        limit: pagination.limit
      });

      const newImages = res.data || [];
      const meta = res.meta || res.pagination || {};

      if (reset) {
        setImages(newImages);
      } else {
        setImages(prev => [...prev, ...newImages]);
      }

      setPagination({
        page: meta.page || page,
        limit: meta.limit || pagination.limit,
        total: meta.total || 0,
        totalPages: meta.totalPages || 1,
        hasMore: page < (meta.totalPages || 1)
      });
    } catch (e) {
      console.error('Failed to load gallery:', e);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (!pagination.hasMore || loadingMore) return;
    loadGallery(pagination.page + 1, false);
  };

  const handleUploadClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      setPage('login');
      return;
    }
    setShowUpload(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!selectedFile) {
      alert('이미지를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await api.uploadGallery(uploadData.title, selectedFile, uploadData.description);
      closeUpload();
      loadGallery(1, true); // 새 업로드 후 첫 페이지로
      checkAuth();
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  const handleLike = async (id, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (likingIds.has(id)) return;
    setLikingIds(prev => new Set([...prev, id]));
    try {
      const res = await api.likeGallery(id);

      setImages(prev => prev.map(img =>
        img.id === id ? {
          ...img,
          is_liked: res.data?.liked ? 1 : 0,
          like_count: res.data?.liked ? (img.like_count || 0) + 1 : Math.max((img.like_count || 1) - 1, 0)
        } : img
      ));

      if (lightbox.open && lightbox.data?.id === id) {
        setLightbox(prev => ({
          ...prev,
          data: {
            ...prev.data,
            is_liked: res.data?.liked ? 1 : 0,
            like_count: res.data?.liked ? (prev.data.like_count || 0) + 1 : Math.max((prev.data.like_count || 1) - 1, 0)
          }
        }));
      }
      if (res.data?.pointEarned) {
        updateUser({ point_balance: (user?.point_balance || 0) + res.data.pointEarned });
        checkAuth();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openLightbox = (img) => {
    setLightbox({
      open: true,
      image: getImageUrl(img.image_url),
      data: img
    });
    loadGalleryComments(img.id);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setUploadData({ title: '', description: '' });
    setSelectedFile(null);
    setPreview(null);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const loadGalleryComments = async (galleryId) => {
    if (comments[galleryId]) return;
    setLoadingComments(true);
    try {
      const res = await api.getGalleryComments(galleryId);
      setComments(prev => ({ ...prev, [galleryId]: res.data || [] }));
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
    setLoadingComments(false);
  };

  const handleAddComment = async (galleryId) => {
    if (!newComment.trim()) return;
    if (!isLoggedIn) { alert('로그인이 필요합니다.'); return; }
    try {
      await api.createGalleryComment(galleryId, newComment);
      setNewComment('');
      const res = await api.getGalleryComments(galleryId);
      setComments(prev => ({ ...prev, [galleryId]: res.data || [] }));
      setImages(prev => prev.map(img =>
        img.id === galleryId ? { ...img, comment_count: (img.comment_count || 0) + 1 } : img
      ));
      if (lightbox.open && lightbox.data?.id === galleryId) {
        setLightbox(prev => ({
          ...prev,
          data: { ...prev.data, comment_count: (prev.data.comment_count || 0) + 1 }
        }));
      }
      checkAuth();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteComment = async (galleryId, commentId) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await api.deleteGalleryComment(galleryId, commentId);
      const res = await api.getGalleryComments(galleryId);
      setComments(prev => ({ ...prev, [galleryId]: res.data || [] }));
      setImages(prev => prev.map(img =>
        img.id === galleryId ? { ...img, comment_count: Math.max((img.comment_count || 1) - 1, 0) } : img
      ));
      if (lightbox.open && lightbox.data?.id === galleryId) {
        setLightbox(prev => ({
          ...prev,
          data: { ...prev.data, comment_count: Math.max((prev.data.comment_count || 1) - 1, 0) }
        }));
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (days < 1) return '오늘';
    if (days < 7) return `${days}일 전`;
    if (weeks < 4) return `${weeks}주일 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 삭제 핸들러
  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('정말 이 사진을 삭제하시겠습니까?')) return;
    try {
      await api.deleteGallery(id);
      setImages(images.filter(img => img.id !== id));
      if (lightbox.open && lightbox.data?.id === id) {
        setLightbox({ open: false, image: null, data: null });
      }
      alert('삭제되었습니다.');
    } catch (e) {
      alert(e.message);
    }
  };

  // 수정 모달 열기
  const openEditModal = (img, e) => {
    e?.stopPropagation();
    setEditMode(true);
    setEditData({ id: img.id, title: img.title || '', description: img.description || '' });
  };

  // 수정 저장
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    try {
      await api.request(`/gallery/${editData.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editData.title, description: editData.description }),
      });
      setImages(images.map(img =>
        img.id === editData.id
          ? { ...img, title: editData.title, description: editData.description }
          : img
      ));
      if (lightbox.open && lightbox.data?.id === editData.id) {
        setLightbox(prev => ({
          ...prev,
          data: { ...prev.data, title: editData.title, description: editData.description }
        }));
      }
      setEditMode(false);
      alert('수정되었습니다.');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>갤러리</h1>
        <button className="write-btn" onClick={handleUploadClick}>업로드</button>
      </div>

      {/* 업로드 모달 */}
      <Modal isOpen={showUpload} onClose={closeUpload} title="사진 업로드">
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="사진 제목"
              value={uploadData.title}
              onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>설명 (선택)</label>
            <textarea
              placeholder="사진에 대한 설명"
              rows="2"
              value={uploadData.description}
              onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>사진 - Ctrl+V로 붙여넣기 가능!</label>
            <div
              className={`image-upload-zone large ${preview ? 'has-preview' : ''}`}
              onClick={() => !preview && fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="미리보기" className="upload-preview-large" />
              ) : (
                <>
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">클릭하여 선택 또는 Ctrl+V 붙여넣기</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
            {preview && (
              <button type="button" className="clear-image-btn" onClick={clearImage}>
                이미지 제거
              </button>
            )}
          </div>
          <div className="form-actions">
            <button type="button" onClick={closeUpload}>취소</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 수정 모달 */}
      <Modal isOpen={editMode} onClose={() => setEditMode(false)} title="사진 수정">
        <form className="write-form" onSubmit={handleEditSave}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="사진 제목"
              value={editData.title}
              onChange={e => setEditData({ ...editData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>설명 (선택)</label>
            <textarea
              placeholder="사진에 대한 설명"
              rows="2"
              value={editData.description}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setEditMode(false)}>취소</button>
            <button type="submit" className="primary">저장</button>
          </div>
        </form>
      </Modal>

      {/* 이미지 라이트박스 */}
      {lightbox.open && (
        <div className="lightbox-overlay" onClick={() => setLightbox({ open: false, image: null, data: null })}>
          <button className="lightbox-close" onClick={() => setLightbox({ open: false, image: null, data: null })}>×</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image} alt="" className="lightbox-image" />
          </div>
          {lightbox.data && (
            <div className="lightbox-info" onClick={e => e.stopPropagation()}>
              <h3>{lightbox.data.title}</h3>
              {lightbox.data.description && <p>{lightbox.data.description}</p>}
              <div className="lightbox-meta">
                <StyledName user={lightbox.data?.user} showTitle={false} />
                <span>·</span>
                <span>{formatTime(lightbox.data.created_at)}</span>
              </div>
              <div className="lightbox-actions">
                <button
                  className={`lightbox-like-btn${likingIds.has(lightbox.data.id) ? ' liking' : ''}${lightbox.data.is_liked ? ' liked' : ''}`}
                  disabled={likingIds.has(lightbox.data.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(lightbox.data.id, e);
                  }}
                >
                  <span className="like-heart">{likingIds.has(lightbox.data.id) ? '⏳' : lightbox.data.is_liked ? '❤️' : '♡'}</span> 좋아요 {lightbox.data.like_count || 0}
                </button>
                {(isAdmin || (user && Number(lightbox.data.user_id) === Number(user.id))) && (
                  <>
                    <button className="lightbox-edit-btn" onClick={(e) => openEditModal(lightbox.data, e)}>
                      수정
                    </button>
                    <button className="lightbox-delete-btn" onClick={(e) => handleDelete(lightbox.data.id, e)}>
                      삭제
                    </button>
                  </>
                )}
              </div>
              {/* 댓글 섹션 */}
              <div className="gallery-comments-section">
                <h4>댓글 {lightbox.data.comment_count || 0}</h4>
                <div className="gallery-comments-list">
                  {loadingComments ? (
                    <div className="comments-loading">댓글 로딩 중...</div>
                  ) : (comments[lightbox.data.id] || []).length === 0 ? (
                    <div className="no-comments">아직 댓글이 없습니다.</div>
                  ) : (
                    (comments[lightbox.data.id] || []).map((c) => (
                      <div key={c.id} className="comment-item gallery-comment-item">
                        <ProfileFrame user={c.user} size="sm">
                          <div className={`comment-avatar ${c.user?.default_icon && !c.user?.profile_image ? 'has-icon' : ''}`}>
                            {c.user?.profile_image ? (
                              <img src={getImageUrl(c.user.profile_image)} alt="" style={{ transform: `scale(${c.user?.profile_zoom || 1})` }} />
                            ) : getIconEmoji(c.user?.default_icon)}
                          </div>
                        </ProfileFrame>
                        <div className="comment-body">
                          <div className="comment-header">
                            <StyledName user={c.user} showTitle={true} className="comment-author" />
                            <span className="comment-time">{formatTime(c.created_at)}</span>
                            {(isAdmin || c.user_id === user?.id) && (
                              <button className="comment-delete-btn" onClick={() => handleDeleteComment(lightbox.data.id, c.id)}>삭제</button>
                            )}
                          </div>
                          <p className="comment-text">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {isLoggedIn && (
                  <div className="comment-form gallery-comment-form">
                    <input
                      type="text"
                      placeholder="댓글을 입력하세요"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(lightbox.data.id)}
                    />
                    <button onClick={() => handleAddComment(lightbox.data.id)}>등록</button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="lightbox-hint">ESC 또는 바깥 클릭으로 닫기</div>
        </div>
      )}

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="gallery-grid-improved">
            {images.length === 0 ? (
              <div className="empty-message">갤러리가 비어있습니다. 첫 사진을 업로드해보세요!</div>
            ) : (
              images.map((img, i) => (
                <div key={img.id || i} className="gallery-card" onClick={() => openLightbox(img)}>
                  <div className="gallery-card-image">
                    {img.thumbnail_url || img.image_url ? (
                      <img src={getImageUrl(img.thumbnail_url || img.image_url)} alt={img.title} />
                    ) : (
                      <div className="gallery-placeholder">🖼️</div>
                    )}
                  </div>
                  <div className="gallery-card-info">
                    <span className="gallery-card-title">{img.title}</span>
                    <div className="gallery-card-meta">
                      <StyledName user={img.user} showTitle={false} className="gallery-card-author" />
                      <span className="gallery-card-time">{formatTime(img.created_at)}</span>
                    </div>
                    <div className="gallery-card-actions">
                      <button
                        className={`gallery-like-btn${likingIds.has(img.id) ? ' liking' : ''}${img.is_liked ? ' liked' : ''}`}
                        disabled={likingIds.has(img.id)}
                        onClick={(e) => handleLike(img.id, e)}
                      >
                        <span className="like-heart">{likingIds.has(img.id) ? '⏳' : img.is_liked ? '❤️' : '♡'}</span> {img.like_count || 0}
                      </button>
                      <span className="gallery-comment-count">💬 {img.comment_count || 0}</span>
                      {(isAdmin || (user && Number(img.user_id) === Number(user.id))) && (
                        <>
                          <button className="gallery-edit-btn" onClick={(e) => openEditModal(img, e)}>
                            수정
                          </button>
                          <button className="gallery-delete-btn" onClick={(e) => handleDelete(img.id, e)}>
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 - 더보기 버튼 */}
          {pagination.hasMore && images.length > 0 && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? '로딩 중...' : `더 보기 (${images.length}/${pagination.total})`}
              </button>
            </div>
          )}

          {/* 페이지 정보 */}
          {images.length > 0 && (
            <div className="pagination-info">
              총 {pagination.total}개의 사진
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getIconEmoji } from '../components/UserAvatar';
import StyledName, { ProfileFrame } from '../components/StyledName';

export default function ShowoffPage({ setPage, category = 'showoff' }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const isAdmin = user?.role === 'master' || user?.role === 'submaster';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [writeData, setWriteData] = useState({ title: '', content: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState({});
  const fileRef = useRef(null);

  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: true
  });

  useEffect(() => {
    loadPosts(1, true);
  }, [category]);

  useEffect(() => {
    if (!showWrite) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const namedFile = new File([file], `screenshot_${Date.now()}_${i}.png`, { type: file.type });
            imageFiles.push(namedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [showWrite, selectedFiles]);

  useEffect(() => {
    if (!lightbox.open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox({ open: false, images: [], index: 0 });
      } else if (e.key === 'ArrowLeft') {
        setLightbox(prev => ({
          ...prev,
          index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1
        }));
      } else if (e.key === 'ArrowRight') {
        setLightbox(prev => ({
          ...prev,
          index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.open]);

  const loadPosts = async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.getPosts({
        category,
        page,
        limit: pagination.limit
      });

      const newPosts = res.data || [];
      const meta = res.meta || res.pagination || {};

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setPagination({
        page: meta.page || page,
        limit: meta.limit || pagination.limit,
        total: meta.total || 0,
        totalPages: meta.totalPages || 1,
        hasMore: page < (meta.totalPages || 1)
      });
    } catch (e) {
      console.error('Failed to load posts:', e);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (!pagination.hasMore || loadingMore) return;
    loadPosts(pagination.page + 1, false);
  };

  const loadComments = async (postId) => {
    if (comments[postId]) return;

    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: res.data || [] }));
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
  };

  const toggleComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      await loadComments(postId);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await api.createComment(postId, newComment);
      setNewComment('');
      const res = await api.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: res.data || [] }));
      // 댓글 수 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
      ));
      checkAuth();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert('게시글이 삭제되었습니다.');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await api.deleteComment(postId, commentId);
      const res = await api.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: res.data || [] }));
      // 댓글 수 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: Math.max((p.comment_count || 1) - 1, 0) } : p
      ));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleWrite = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      setPage('login');
      return;
    }
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
      const res = await api.createPost({
        category,
        title: writeData.title,
        content: writeData.content,
      });

      if (selectedFiles.length > 0 && res.data?.id) {
        await api.uploadPostImages(res.data.id, selectedFiles);
      }

      closeModal();
      loadPosts(1, true); // 새 글 작성 후 첫 페이지로
      checkAuth();
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const res = await api.likePost(postId);
      // 좋아요 수 업데이트
      setPosts(prev => prev.map(p =>
        p.id === postId ? {
          ...p,
          like_count: res.data?.liked ? (p.like_count || 0) + 1 : Math.max((p.like_count || 1) - 1, 0)
        } : p
      ));
      if (res.data?.pointEarned) checkAuth();
    } catch (e) {
      alert(e.message);
    }
  };

  const addFiles = (files) => {
    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);

    files.forEach(file => {
      if (selectedFiles.length + files.indexOf(file) < 5) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result].slice(0, 5));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const closeModal = () => {
    setShowWrite(false);
    setWriteData({ title: '', content: '' });
    setSelectedFiles([]);
    setPreviews([]);
  };

  const openLightbox = (images, index) => {
    const imageUrls = images.map(img => getImageUrl(img.image_url));
    setLightbox({ open: true, images: imageUrls, index });
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

  return (
    <div className="page-content board-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>{category === 'info' ? '정보게시판' : '자유게시판'}</h1>
        <button className="write-btn" onClick={handleWrite}>글쓰기</button>
      </div>

      <Modal isOpen={showWrite} onClose={closeModal} title="글쓰기">
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={writeData.title}
              onChange={e => setWriteData({ ...writeData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>내용</label>
            <textarea
              placeholder="내용을 입력하세요"
              rows="6"
              value={writeData.content}
              onChange={e => setWriteData({ ...writeData, content: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>이미지 (최대 5장) - Ctrl+V로 붙여넣기 가능</label>
            <div
              className={`image-upload-zone ${previews.length > 0 ? 'has-files' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              <span className="upload-icon">+</span>
              <span className="upload-text">클릭하여 선택 또는 Ctrl+V 붙여넣기</span>
              <span className="upload-hint">{previews.length}/5장</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
            {previews.length > 0 && (
              <div className="image-preview-grid">
                {previews.map((preview, i) => (
                  <div key={i} className="preview-item">
                    <img src={preview} alt={`미리보기 ${i + 1}`} />
                    <button type="button" className="remove-preview" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" onClick={closeModal}>취소</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </Modal>

      {lightbox.open && (
        <div className="lightbox-overlay" onClick={() => setLightbox({ open: false, images: [], index: 0 })}>
          <button className="lightbox-close" onClick={() => setLightbox({ open: false, images: [], index: 0 })}>×</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav prev"
                onClick={() => setLightbox(prev => ({ ...prev, index: prev.index > 0 ? prev.index - 1 : prev.images.length - 1 }))}
              >
                ‹
              </button>
            )}
            <img src={lightbox.images[lightbox.index]} alt="" className="lightbox-image" />
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav next"
                onClick={() => setLightbox(prev => ({ ...prev, index: prev.index < prev.images.length - 1 ? prev.index + 1 : 0 }))}
              >
                ›
              </button>
            )}
          </div>
          {lightbox.images.length > 1 && (
            <div className="lightbox-counter">{lightbox.index + 1} / {lightbox.images.length}</div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="board-list">
            {posts.length === 0 ? (
              <div className="empty-message">게시글이 없습니다. 첫 글을 작성해보세요!</div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className={`board-item ${p.is_recommended ? 'recommended' : ''}`}>
                  {p.is_recommended ? <div className="recommended-badge">추천</div> : null}
                  <div className="board-item-header">
                    <div className="board-author">
                      <ProfileFrame user={p.user} size="sm">
                        <div className={`board-avatar ${p.user?.default_icon && !p.user?.profile_image ? 'has-icon' : ''}`}>
                          {p.user?.profile_image ? (
                            <img src={getImageUrl(p.user.profile_image)} alt="" style={{ transform: `scale(${p.user?.profile_zoom || 1})` }} />
                          ) : getIconEmoji(p.user?.default_icon)}
                        </div>
                      </ProfileFrame>
                      <div className="board-author-info">
                        <div className="author-name-row">
                          <StyledName user={p.user} />
                          {p.user?.role === 'honorary' && (
                            <span className="user-badge honorary">명예</span>
                          )}
                          {p.user?.alliance_name && !p.user?.is_main_guild && (
                            <span className="user-guild-badge">{p.user.alliance_emblem} {p.user.alliance_name}</span>
                          )}
                        </div>
                        <span className="post-meta">{p.user?.job} · {formatTime(p.created_at)}</span>
                      </div>
                    </div>
                    {(isAdmin || p.user_id === user?.id) && (
                      <button className="delete-btn-small" onClick={() => handleDeletePost(p.id)}>삭제</button>
                    )}
                  </div>

                  <div className="board-item-content">
                    <h3 className="board-title">{p.title}</h3>
                    <p className="board-text">{p.content}</p>

                    {p.images && p.images.length > 0 && (
                      <div className={`board-images count-${Math.min(p.images.length, 4)}`}>
                        {p.images.slice(0, 4).map((img, j) => (
                          <div
                            key={j}
                            className="board-image-item"
                            onClick={() => openLightbox(p.images, j)}
                          >
                            <img src={getImageUrl(img.thumbnail_url || img.image_url)} alt="" />
                            {j === 3 && p.images.length > 4 && (
                              <div className="more-images">+{p.images.length - 4}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="board-item-footer">
                    <div className="board-actions">
                      <button className="action-btn like" onClick={(e) => handleLike(p.id, e)}>
                        <span className="action-icon">♥</span>
                        <span className="action-count">{p.like_count || 0}</span>
                      </button>
                      <button className="action-btn comment" onClick={() => toggleComments(p.id)}>
                        <span className="action-icon">💬</span>
                        <span className="action-count">{p.comment_count || 0}</span>
                      </button>
                    </div>
                  </div>

                  {expandedPost === p.id && (
                    <div className="board-comments">
                      {loadingComments[p.id] ? (
                        <div className="comments-loading">댓글 로딩 중...</div>
                      ) : (
                        <>
                          <div className="comments-list">
                            {(comments[p.id] || []).length === 0 ? (
                              <div className="no-comments">아직 댓글이 없습니다.</div>
                            ) : (
                              (comments[p.id] || []).map((c) => (
                                <div key={c.id} className="comment-item">
                                  <ProfileFrame user={c.user} size="sm">
                                    <div className={`comment-avatar ${c.user?.default_icon && !c.user?.profile_image ? 'has-icon' : ''}`}>
                                      {c.user?.profile_image ? (
                                        <img src={getImageUrl(c.user.profile_image)} alt="" style={{ transform: `scale(${c.user?.profile_zoom || 1})` }} />
                                      ) : getIconEmoji(c.user?.default_icon)}
                                    </div>
                                  </ProfileFrame>
                                  <div className="comment-body">
                                    <div className="comment-header">
                                      <StyledName user={c.user} showTitle={false} className="comment-author" />
                                      {c.user?.role === 'honorary' && (
                                        <span className="user-badge honorary small">명예</span>
                                      )}
                                      {c.user?.alliance_name && !c.user?.is_main_guild && (
                                        <span className="user-guild-badge small">{c.user.alliance_emblem}</span>
                                      )}
                                      <span className="comment-time">{formatTime(c.created_at)}</span>
                                      {(isAdmin || c.user_id === user?.id) && (
                                        <button className="comment-delete-btn" onClick={() => handleDeleteComment(p.id, c.id)}>삭제</button>
                                      )}
                                    </div>
                                    <p className="comment-text">{c.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          {isLoggedIn && (
                            <div className="comment-form">
                              <input
                                type="text"
                                placeholder="댓글을 입력하세요"
                                value={expandedPost === p.id ? newComment : ''}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(p.id)}
                              />
                              <button onClick={() => handleAddComment(p.id)}>등록</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* 페이지네이션 - 더보기 버튼 */}
          {pagination.hasMore && posts.length > 0 && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? '로딩 중...' : `더 보기 (${posts.length}/${pagination.total})`}
              </button>
            </div>
          )}

          {/* 페이지 정보 */}
          {posts.length > 0 && (
            <div className="pagination-info">
              총 {pagination.total}개의 게시글
            </div>
          )}
        </>
      )}
    </div>
  );
}

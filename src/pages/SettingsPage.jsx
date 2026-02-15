import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getImageUrl } from '../services/api';
import { DEFAULT_ICONS, getIconEmoji } from '../components/UserAvatar';
import Modal from '../components/Modal';
import { JOB_LIST } from '../constants/jobs';
import { formatDate } from '../utils/format';
import StyledName, { ProfileFrame } from '../components/StyledName';

export default function SettingsPage({ setPage, guildLogo, setGuildLogo }) {
  const { user, updateUser, isLoggedIn, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('posts');

  const isAdmin = user?.role === 'master' || user?.role === 'submaster';

  useEffect(() => {
    if (!isLoggedIn) setPage('login');
  }, [isLoggedIn, setPage]);

  if (!isLoggedIn) return null;

  const tabs = [
    { id: 'profile', label: '프로필 설정' },
    { id: 'customize', label: '꾸미기' },
    { id: 'activity', label: '내 활동' },
    ...(isAdmin ? [{ id: 'admin', label: '관리' }] : []),
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>설정</h1>
      </div>

      {/* 탭 네비게이션 */}
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="settings-content">
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            updateUser={updateUser}
            checkAuth={checkAuth}
            guildLogo={guildLogo}
            setGuildLogo={setGuildLogo}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === 'customize' && (
          <CustomizeTab user={user} checkAuth={checkAuth} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            setPage={setPage}
          />
        )}
        {activeTab === 'admin' && isAdmin && (
          <AdminTab setPage={setPage} />
        )}
      </div>
    </div>
  );
}

// 프로필 설정 탭
function ProfileTab({ user, updateUser, checkAuth, guildLogo, setGuildLogo, isAdmin }) {
  const [profileUploading, setProfileUploading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(user?.default_icon || null);
  const logoRef = useRef(null);
  const profileRef = useRef(null);

  const [profileZoom, setProfileZoom] = useState(
    user?.profile_zoom || localStorage.getItem('profileZoom') || '1'
  );

  useEffect(() => {
    if (user?.profile_zoom) {
      setProfileZoom(user.profile_zoom);
    }
  }, [user?.profile_zoom]);

  const [profileData, setProfileData] = useState({
    job: user?.job || '',
    level: user?.level || '',
    discord: user?.discord || '',
  });
  const [saving, setSaving] = useState(false);

  const handleZoomChange = async (zoom) => {
    setProfileZoom(zoom);
    localStorage.setItem('profileZoom', zoom);
    try {
      await api.updateProfile({ profile_zoom: zoom });
      await checkAuth();
    } catch (e) {
      console.error('Failed to save zoom:', e);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGuildLogo(reader.result);
      localStorage.setItem('guildLogo', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileUploading(true);
    try {
      const res = await api.uploadProfileImage(file);
      updateUser({ profile_image: res.data?.url });
      alert('프로필 이미지가 변경되었습니다.');
    } catch (e) {
      alert(e.message);
    }
    setProfileUploading(false);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        job: profileData.job,
        level: parseInt(profileData.level) || user?.level,
        discord: profileData.discord,
        default_icon: selectedIcon,
      });
      await checkAuth();
      alert('프로필이 저장되었습니다.');
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  const removeLogo = () => {
    setGuildLogo(null);
    localStorage.removeItem('guildLogo');
  };

  return (
    <>
      <div className="settings-section">
        <h3>내 프로필</h3>
        <div className="profile-settings">
          <div className="profile-image-area">
            <div className="current-profile" onClick={() => profileRef.current?.click()}>
              {user?.profile_image ? (
                <img
                  src={getImageUrl(user.profile_image)}
                  alt="프로필"
                  style={{ transform: `scale(${profileZoom})` }}
                />
              ) : selectedIcon ? (
                <div className="no-profile selected-icon"><span>{getIconEmoji(selectedIcon)}</span></div>
              ) : (
                <div className="no-profile"><span>👤</span></div>
              )}
              <div className="logo-overlay">
                <span>{profileUploading ? '업로드 중...' : '사진 업로드'}</span>
              </div>
            </div>
            <input
              ref={profileRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              style={{ display: 'none' }}
            />
            {user?.profile_image && (
              <div className="profile-zoom-settings">
                <label>프로필 사진 확대</label>
                <div className="zoom-buttons">
                  {['1', '1.5', '2', '3'].map(zoom => (
                    <button
                      key={zoom}
                      className={`zoom-btn ${profileZoom === zoom ? 'active' : ''}`}
                      onClick={() => handleZoomChange(zoom)}
                    >
                      x{zoom}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="profile-hint">또는 아래에서 기본 아이콘 선택</p>
          </div>

          <div className="default-icons-section">
            <label>기본 아이콘</label>
            <div className="default-icons-grid">
              {DEFAULT_ICONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`icon-option ${selectedIcon === item.id ? 'selected' : ''}`}
                  onClick={async () => {
                    setSelectedIcon(item.id);
                    try {
                      await api.updateProfile({
                        ...profileData,
                        default_icon: item.id,
                        clear_profile_image: true
                      });
                      await checkAuth();
                      alert('아이콘이 변경되었습니다.');
                    } catch (e) {
                      alert('아이콘 저장 실패: ' + e.message);
                    }
                  }}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label>캐릭터 닉네임</label>
              <input type="text" value={user?.character_name || ''} disabled />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>직업</label>
                <select
                  value={profileData.job}
                  onChange={e => setProfileData({ ...profileData, job: e.target.value })}
                  className="job-select"
                >
                  {JOB_LIST.map(job => (
                    <option key={job.value} value={job.value}>{job.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>레벨</label>
                <input
                  type="number"
                  value={profileData.level}
                  onChange={e => setProfileData({ ...profileData, level: e.target.value })}
                  placeholder="레벨"
                  min="1"
                  max="300"
                />
              </div>
            </div>
            <div className="form-group">
              <label>디스코드</label>
              <input
                type="text"
                value={profileData.discord}
                onChange={e => setProfileData({ ...profileData, discord: e.target.value })}
                placeholder="디스코드 아이디"
              />
            </div>
            <button className="save-btn" onClick={handleProfileSave} disabled={saving}>
              {saving ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="settings-section">
          <h3>길드 로고</h3>
          <div className="logo-upload-area">
            <div className="current-logo" onClick={() => logoRef.current?.click()}>
              {guildLogo ? (
                <img src={guildLogo} alt="길드 로고" />
              ) : (
                <div className="no-logo"><span>🍁</span><p>로고 없음</p></div>
              )}
              <div className="logo-overlay"><span>📷 변경</span></div>
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <div className="logo-info">
              <p>권장: 200x200px</p>
              <p>형식: PNG, JPG</p>
              {guildLogo && (
                <button className="remove-logo" onClick={removeLogo}>삭제</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 꾸미기 탭
function CustomizeTab({ user, checkAuth }) {
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [equipping, setEquipping] = useState(null);
  const [activeCategory, setActiveCategory] = useState('name_color');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, myRes] = await Promise.all([
        api.getCustomizationItems(),
        api.getMyCustomizations(),
      ]);
      setItems(itemsRes.data || []);
      setMyItems(myRes.data || []);
    } catch (e) {
      console.error('Failed to load customization data:', e);
    }
    setLoading(false);
  };

  const categories = [
    { id: 'name_color', label: '닉네임 색상', icon: '🎨' },
    { id: 'frame', label: '프로필 프레임', icon: '🖼️' },
    { id: 'title', label: '칭호', icon: '🏷️' },
  ];

  const isOwned = (itemId) => myItems.some(m => m.item_id === itemId);
  const isEquipped = (itemId) => myItems.some(m => m.item_id === itemId && m.is_equipped);

  const handlePurchase = async (itemId) => {
    if (purchasing) return;
    setPurchasing(itemId);
    try {
      await api.purchaseCustomization(itemId);
      await loadData();
      await checkAuth();
    } catch (e) {
      alert(e.message || '구매에 실패했습니다.');
    }
    setPurchasing(null);
  };

  const handleEquip = async (itemId, equip) => {
    if (equipping) return;
    setEquipping(itemId);
    try {
      await api.equipCustomization(itemId, equip);
      await loadData();
      await checkAuth();
    } catch (e) {
      alert(e.message || '장착에 실패했습니다.');
    }
    setEquipping(null);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return '#ff6b00';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      case 'uncommon': return '#22c55e';
      default: return '#9ca3af';
    }
  };

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case 'legendary': return '전설';
      case 'epic': return '에픽';
      case 'rare': return '레어';
      case 'uncommon': return '고급';
      default: return '일반';
    }
  };

  const filteredItems = items.filter(item => item.type === activeCategory);

  const renderPreview = (item) => {
    if (item.type === 'name_color') {
      const previewUser = { ...user, active_name_color: item.value, active_title: user?.active_title };
      return <StyledName user={previewUser} showTitle={false} />;
    }
    if (item.type === 'frame') {
      return (
        <ProfileFrame user={{ active_frame: item.value }} size="sm">
          <span className="customize-frame-preview-icon">👤</span>
        </ProfileFrame>
      );
    }
    if (item.type === 'title') {
      return <span className="user-title-badge preview">{item.value}</span>;
    }
    return null;
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="customize-tab">
      <div className="customize-preview-card">
        <h4>현재 내 프로필</h4>
        <div className="customize-my-preview">
          <ProfileFrame user={user} size="md">
            {user?.profile_image ? (
              <img src={getImageUrl(user.profile_image)} alt="" style={{ transform: `scale(${user.profile_zoom || 1})` }} />
            ) : (
              <span className="avatar-default-large">{getIconEmoji(user?.default_icon) || '👤'}</span>
            )}
          </ProfileFrame>
          <div className="customize-my-name">
            <StyledName user={user} />
          </div>
        </div>
      </div>

      <div className="customize-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`customize-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="customize-items-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-message">아이템이 없습니다.</div>
        ) : (
          filteredItems.map(item => {
            const owned = isOwned(item.id);
            const equipped = isEquipped(item.id);
            return (
              <div key={item.id} className={`customize-item-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`}>
                <div className="customize-item-header">
                  <span className="customize-item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                    {getRarityLabel(item.rarity)}
                  </span>
                  {equipped && <span className="equipped-badge">장착중</span>}
                </div>
                <div className="customize-item-preview">
                  {renderPreview(item)}
                </div>
                <div className="customize-item-info">
                  <span className="customize-item-name">{item.name}</span>
                  {item.description && <span className="customize-item-desc">{item.description}</span>}
                </div>
                <div className="customize-item-action">
                  {!owned ? (
                    <button
                      className="customize-buy-btn"
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasing === item.id}
                    >
                      {purchasing === item.id ? '구매중...' : `${item.price}P 구매`}
                    </button>
                  ) : equipped ? (
                    <button
                      className="customize-unequip-btn"
                      onClick={() => handleEquip(item.id, false)}
                      disabled={equipping === item.id}
                    >
                      {equipping === item.id ? '처리중...' : '해제'}
                    </button>
                  ) : (
                    <button
                      className="customize-equip-btn"
                      onClick={() => handleEquip(item.id, true)}
                      disabled={equipping === item.id}
                    >
                      {equipping === item.id ? '처리중...' : '장착'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 내 활동 탭
function ActivityTab({ activeSubTab, setActiveSubTab, setPage }) {
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [myGallery, setMyGallery] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 각 탭별 페이지네이션 상태
  const [postsPagination, setPostsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasMore: true });
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasMore: true });
  const [galleryPagination, setGalleryPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0, hasMore: true });
  const [eventsPagination, setEventsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasMore: true });

  const subTabs = [
    { id: 'posts', label: '내가 쓴 글' },
    { id: 'comments', label: '내 댓글' },
    { id: 'gallery', label: '내 갤러리' },
    { id: 'events', label: '참여한 일정' },
  ];

  useEffect(() => {
    // 탭 변경 시 첫 페이지부터 로드
    loadData(1, true);
  }, [activeSubTab]);

  const loadData = async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      if (activeSubTab === 'posts') {
        const res = await api.getMyPosts({ page, limit: postsPagination.limit });
        const newData = res.data || [];
        const meta = res.meta || {};
        if (reset) {
          setMyPosts(newData);
        } else {
          setMyPosts(prev => [...prev, ...newData]);
        }
        setPostsPagination({
          page: meta.page || page,
          limit: meta.limit || postsPagination.limit,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasMore: page < (meta.totalPages || 1)
        });
      } else if (activeSubTab === 'comments') {
        const res = await api.getMyComments({ page, limit: commentsPagination.limit });
        const newData = res.data || [];
        const meta = res.meta || {};
        if (reset) {
          setMyComments(newData);
        } else {
          setMyComments(prev => [...prev, ...newData]);
        }
        setCommentsPagination({
          page: meta.page || page,
          limit: meta.limit || commentsPagination.limit,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasMore: page < (meta.totalPages || 1)
        });
      } else if (activeSubTab === 'gallery') {
        const res = await api.getMyGallery({ page, limit: galleryPagination.limit });
        const newData = res.data || [];
        const meta = res.meta || {};
        if (reset) {
          setMyGallery(newData);
        } else {
          setMyGallery(prev => [...prev, ...newData]);
        }
        setGalleryPagination({
          page: meta.page || page,
          limit: meta.limit || galleryPagination.limit,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasMore: page < (meta.totalPages || 1)
        });
      } else if (activeSubTab === 'events') {
        const res = await api.getMyEvents({ page, limit: eventsPagination.limit });
        const newData = res.data || [];
        const meta = res.meta || {};
        if (reset) {
          setMyEvents(newData);
        } else {
          setMyEvents(prev => [...prev, ...newData]);
        }
        setEventsPagination({
          page: meta.page || page,
          limit: meta.limit || eventsPagination.limit,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasMore: page < (meta.totalPages || 1)
        });
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    if (loadingMore) return;
    if (activeSubTab === 'posts' && postsPagination.hasMore) {
      loadData(postsPagination.page + 1, false);
    } else if (activeSubTab === 'comments' && commentsPagination.hasMore) {
      loadData(commentsPagination.page + 1, false);
    } else if (activeSubTab === 'gallery' && galleryPagination.hasMore) {
      loadData(galleryPagination.page + 1, false);
    } else if (activeSubTab === 'events' && eventsPagination.hasMore) {
      loadData(eventsPagination.page + 1, false);
    }
  };

  const getCurrentPagination = () => {
    if (activeSubTab === 'posts') return postsPagination;
    if (activeSubTab === 'comments') return commentsPagination;
    if (activeSubTab === 'gallery') return galleryPagination;
    if (activeSubTab === 'events') return eventsPagination;
    return { hasMore: false, total: 0 };
  };

  const getCurrentItems = () => {
    if (activeSubTab === 'posts') return myPosts;
    if (activeSubTab === 'comments') return myComments;
    if (activeSubTab === 'gallery') return myGallery;
    if (activeSubTab === 'events') return myEvents;
    return [];
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.deletePost(postId);
      alert('삭제되었습니다.');
      loadData(1, true); // 첫 페이지부터 다시 로드
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteGallery = async (galleryId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.deleteGallery(galleryId);
      alert('삭제되었습니다.');
      loadData(1, true); // 첫 페이지부터 다시 로드
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="activity-tab">
      {/* 서브 탭 */}
      <div className="sub-tabs">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            className={`sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="activity-content">
          {/* 내가 쓴 글 */}
          {activeSubTab === 'posts' && (
            <>
              <div className="my-posts-list">
                {myPosts.length === 0 ? (
                  <div className="empty-message">작성한 글이 없습니다.</div>
                ) : (
                  myPosts.map(post => (
                    <div key={post.id} className="my-item">
                      <div className="my-item-main">
                        <span className="my-item-category">{post.category_name || '게시판'}</span>
                        <span className="my-item-title">{post.title}</span>
                      </div>
                      <div className="my-item-meta">
                        <span className="my-item-date">{formatDate(post.created_at)}</span>
                        <span className="my-item-stats">
                          👁 {post.view_count || 0} · 💬 {post.comment_count || 0} · ❤️ {post.like_count || 0}
                        </span>
                      </div>
                      <div className="my-item-actions">
                        <button className="btn-small" onClick={() => setPage(post.category_slug || 'showoff')}>보기</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeletePost(post.id)}>삭제</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {postsPagination.hasMore && myPosts.length > 0 && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? '로딩 중...' : `더 보기 (${myPosts.length}/${postsPagination.total})`}
                  </button>
                </div>
              )}
              {myPosts.length > 0 && (
                <div className="pagination-info">총 {postsPagination.total}개의 글</div>
              )}
            </>
          )}

          {/* 내 댓글 */}
          {activeSubTab === 'comments' && (
            <>
              <div className="my-comments-list">
                {myComments.length === 0 ? (
                  <div className="empty-message">작성한 댓글이 없습니다.</div>
                ) : (
                  myComments.map(comment => (
                    <div key={comment.id} className="my-item">
                      <div className="my-item-main">
                        <span className="my-item-category">댓글</span>
                        <span className="my-item-content">{comment.content}</span>
                      </div>
                      <div className="my-item-meta">
                        <span className="my-item-post">원글: {comment.post_title}</span>
                        <span className="my-item-date">{formatDate(comment.created_at)}</span>
                      </div>
                      <div className="my-item-actions">
                        <button className="btn-small" onClick={() => setPage(comment.category_slug || 'showoff')}>원글 보기</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {commentsPagination.hasMore && myComments.length > 0 && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? '로딩 중...' : `더 보기 (${myComments.length}/${commentsPagination.total})`}
                  </button>
                </div>
              )}
              {myComments.length > 0 && (
                <div className="pagination-info">총 {commentsPagination.total}개의 댓글</div>
              )}
            </>
          )}

          {/* 내 갤러리 */}
          {activeSubTab === 'gallery' && (
            <>
              <div className="my-gallery-grid">
                {myGallery.length === 0 ? (
                  <div className="empty-message">업로드한 이미지가 없습니다.</div>
                ) : (
                  myGallery.map(item => (
                    <div key={item.id} className="my-gallery-item">
                      <div className="my-gallery-thumb">
                        <img src={getImageUrl(item.image_url)} alt={item.title} />
                      </div>
                      <div className="my-gallery-info">
                        <span className="my-gallery-title">{item.title}</span>
                        <span className="my-gallery-date">{formatDate(item.created_at)}</span>
                        <span className="my-gallery-stats">👁 {item.view_count || 0} · ❤️ {item.like_count || 0}</span>
                      </div>
                      <div className="my-item-actions">
                        <button className="btn-small" onClick={() => setPage('gallery')}>보기</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteGallery(item.id)}>삭제</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {galleryPagination.hasMore && myGallery.length > 0 && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? '로딩 중...' : `더 보기 (${myGallery.length}/${galleryPagination.total})`}
                  </button>
                </div>
              )}
              {myGallery.length > 0 && (
                <div className="pagination-info">총 {galleryPagination.total}개의 이미지</div>
              )}
            </>
          )}

          {/* 참여한 일정 */}
          {activeSubTab === 'events' && (
            <>
              <div className="my-events-list">
                {myEvents.length === 0 ? (
                  <div className="empty-message">참여한 일정이 없습니다.</div>
                ) : (
                  myEvents.map(event => (
                    <div key={event.id} className="my-item my-event-item">
                      <div className="my-event-date-box">
                        <span className="event-month">{new Date(event.event_date).getMonth() + 1}월</span>
                        <span className="event-day">{new Date(event.event_date).getDate()}</span>
                      </div>
                      <div className="my-item-main">
                        <span className="my-item-title">{event.title}</span>
                        <span className="my-item-desc">{event.description}</span>
                      </div>
                      <div className="my-item-meta">
                        <span className="my-item-time">🕘 {event.event_time}</span>
                        <span className={`participation-status ${event.participation_status}`}>
                          {event.participation_status === 'confirmed' ? '참가 확정' : '대기'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {eventsPagination.hasMore && myEvents.length > 0 && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? '로딩 중...' : `더 보기 (${myEvents.length}/${eventsPagination.total})`}
                  </button>
                </div>
              )}
              {myEvents.length > 0 && (
                <div className="pagination-info">총 {eventsPagination.total}개의 일정</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 관리 탭 (어드민용)
function AdminTab({ setPage }) {
  const { user } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('pending');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // 부화기 관리 상태
  const [incubatorUsers, setIncubatorUsers] = useState([]);
  const [selectedIncubatorUser, setSelectedIncubatorUser] = useState(null);
  const [userInventory, setUserInventory] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('100');

  // 랭킹 관리 상태
  const [resettingScroll, setResettingScroll] = useState(false);
  const [resettingChaos, setResettingChaos] = useState(false);

  // 프로필 수정 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editJob, setEditJob] = useState('');
  const [editLevel, setEditLevel] = useState('');

  const isMaster = user?.role === 'master';

  // 포인트 관리 상태
  const [pointConfig, setPointConfig] = useState([]);
  const [pointUsers, setPointUsers] = useState([]);
  const [pointGrantUser, setPointGrantUser] = useState(null);
  const [pointAmount, setPointAmount] = useState('');
  const [pointDesc, setPointDesc] = useState('');
  const [showPointModal, setShowPointModal] = useState(false);
  const [pointAction, setPointAction] = useState('grant');

  // 교환소 관리 상태
  const [shopItems, setShopItems] = useState([]);
  const [showShopModal, setShowShopModal] = useState(false);
  const [editingShopItem, setEditingShopItem] = useState(null);
  const [shopForm, setShopForm] = useState({ name: '', description: '', price: '', stock: '', max_per_user: '1', sort_order: '0' });
  const [shopFile, setShopFile] = useState(null);

  // 공지 팝업 관리 상태
  const [announceList, setAnnounceList] = useState([]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState(null);
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '', type: 'info', priority: '0' });

  // 감사 로그
  const [auditLogs, setAuditLogs] = useState([]);

  const adminTabs = [
    { id: 'pending', label: '가입 대기' },
    { id: 'members', label: '멤버 관리' },
    { id: 'points', label: '포인트 관리' },
    { id: 'shop_admin', label: '교환소 관리' },
    { id: 'announce', label: '공지 팝업' },
    { id: 'incubator', label: '부화기 관리' },
    { id: 'rankings', label: '랭킹 관리' },
    { id: 'audit', label: '감사 로그' },
    { id: 'shortcuts', label: '빠른 이동' },
  ];

  useEffect(() => {
    loadAdminData();
  }, [activeAdminTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeAdminTab === 'pending') {
        const res = await api.getMembers({ pending: true });
        setPendingMembers(res.data || []);
      } else if (activeAdminTab === 'members') {
        const res = await api.getMembers({ limit: 100 });
        setAllMembers(res.data || []);
      } else if (activeAdminTab === 'incubator') {
        const res = await api.getIncubatorAdminUsers();
        setIncubatorUsers(res.data || []);
      } else if (activeAdminTab === 'points') {
        const [configRes, usersRes] = await Promise.all([
          api.getPointConfig(),
          api.getPointUsers(),
        ]);
        setPointConfig(configRes.data || []);
        setPointUsers(usersRes.data || []);
      } else if (activeAdminTab === 'shop_admin') {
        const res = await api.getAdminShopItems();
        setShopItems(res.data || []);
      } else if (activeAdminTab === 'announce') {
        const res = await api.getAdminAnnouncements();
        setAnnounceList(res.data || []);
      } else if (activeAdminTab === 'audit') {
        const res = await api.getAuditLog({ limit: 50 });
        setAuditLogs(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
    setLoading(false);
  };

  const loadUserInventory = async (userId) => {
    try {
      const res = await api.getIncubatorUserInventory(userId);
      setUserInventory(res.data);
      setShowInventoryModal(true);
    } catch (e) {
      alert('인벤토리를 불러오지 못했습니다.');
    }
  };

  const handleGrantBonus = async () => {
    if (!selectedIncubatorUser) return;
    const amount = parseInt(bonusAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('올바른 수량을 입력하세요.');
      return;
    }
    try {
      await api.grantIncubatorBonus(selectedIncubatorUser.id, amount);
      alert(`${selectedIncubatorUser.character_name}님에게 ${amount}회 보너스가 지급되었습니다.`);
      setShowBonusModal(false);
      setBonusAmount('100');
      loadAdminData();
    } catch (e) {
      alert(e.message || '보너스 지급에 실패했습니다.');
    }
  };

  const handleRevokeBonus = async (targetUser) => {
    if (!targetUser.bonus_hatches || targetUser.bonus_hatches <= 0) {
      alert('회수할 보너스가 없습니다.');
      return;
    }
    if (!confirm(`${targetUser.character_name}님의 보너스 ${targetUser.bonus_hatches}회를 모두 회수하시겠습니까?`)) return;
    try {
      await api.revokeIncubatorBonus(targetUser.id);
      alert(`${targetUser.character_name}님의 보너스가 회수되었습니다.`);
      loadAdminData();
    } catch (e) {
      alert(e.message || '보너스 회수에 실패했습니다.');
    }
  };

  const handleResetIncubatorUser = async (targetUser) => {
    if (!confirm(`정말 ${targetUser.character_name}님의 부화기 데이터를 모두 초기화하시겠습니까?\n\n인벤토리, 히스토리, 통계, 보너스가 모두 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await api.resetIncubatorUser(targetUser.id);
      alert(`${targetUser.character_name}님의 부화기 데이터가 초기화되었습니다.`);
      loadAdminData();
    } catch (e) {
      alert(e.message || '데이터 초기화에 실패했습니다.');
    }
  };

  const handleResetScrollRankings = async () => {
    if (!confirm('정말 주문서 시뮬레이터 랭킹을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    setResettingScroll(true);
    try {
      await api.resetScrollRankings();
      alert('주문서 시뮬레이터 랭킹이 초기화되었습니다.');
    } catch (e) {
      alert(e.message || '랭킹 초기화에 실패했습니다.');
    }
    setResettingScroll(false);
  };

  const handleResetChaosRankings = async () => {
    if (!confirm('정말 혼줌 시뮬레이터 랭킹을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    setResettingChaos(true);
    try {
      await api.resetChaosRankings();
      alert('혼줌 시뮬레이터 랭킹이 초기화되었습니다.');
    } catch (e) {
      alert(e.message || '랭킹 초기화에 실패했습니다.');
    }
    setResettingChaos(false);
  };

  const handleApprove = async (memberId) => {
    try {
      await api.approveMember(memberId);
      alert('가입이 승인되었습니다.');
      loadAdminData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (memberId) => {
    if (!confirm('정말 가입 신청을 거절하시겠습니까?')) return;
    try {
      await api.deleteMember(memberId);
      alert('가입 신청이 거절되었습니다.');
      loadAdminData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.updateMemberRole(memberId, newRole);
      alert('역할이 변경되었습니다.');
      setShowRoleModal(false);
      loadAdminData();
    } catch (e) {
      alert(e.message);
    }
  };

  const openRoleModal = (member) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const openProfileModal = (member) => {
    setEditingMember(member);
    setEditJob(member.job || '');
    setEditLevel(member.level?.toString() || '');
    setShowProfileModal(true);
  };

  const handleProfileUpdate = async () => {
    if (!editingMember) return;
    try {
      await api.updateMemberProfile(editingMember.id, {
        job: editJob,
        level: parseInt(editLevel) || 1,
      });
      alert('프로필이 수정되었습니다.');
      setShowProfileModal(false);
      loadAdminData();
    } catch (e) {
      alert(e.message);
    }
  };

  const getRoleName = (role) => {
    const roles = {
      master: '길드 마스터',
      submaster: '부마스터',
      member: '길드원',
      honorary: '명예 길드원',
    };
    return roles[role] || role;
  };

  return (
    <div className="admin-tab">
      {/* 관리 서브 탭 */}
      <div className="sub-tabs">
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            className={`sub-tab ${activeAdminTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveAdminTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="admin-content">
          {/* 가입 대기 */}
          {activeAdminTab === 'pending' && (
            <div className="pending-list">
              {pendingMembers.length === 0 ? (
                <div className="empty-message">가입 대기 중인 멤버가 없습니다.</div>
              ) : (
                pendingMembers.map(member => (
                  <div key={member.id} className="pending-item">
                    <div className="pending-avatar">
                      {member.profile_image ? (
                        <img src={getImageUrl(member.profile_image)} alt="" />
                      ) : (
                        <span>{getIconEmoji(member.default_icon)}</span>
                      )}
                    </div>
                    <div className="pending-info">
                      <span className="pending-name">{member.character_name}</span>
                      <span className="pending-detail">Lv.{member.level} {member.job}</span>
                      <span className="pending-discord">Discord: {member.discord}</span>
                    </div>
                    <div className="pending-actions">
                      <button className="btn-approve" onClick={() => handleApprove(member.id)}>승인</button>
                      <button className="btn-reject" onClick={() => handleReject(member.id)}>거절</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 멤버 관리 */}
          {activeAdminTab === 'members' && (
            <div className="members-manage-list">
              {allMembers.map(member => (
                <div key={member.id} className="member-manage-item">
                  <div className="member-manage-avatar">
                    {member.profile_image ? (
                      <img src={getImageUrl(member.profile_image)} alt="" style={{ transform: `scale(${member.profile_zoom || 1})` }} />
                    ) : (
                      <span>{getIconEmoji(member.default_icon)}</span>
                    )}
                  </div>
                  <div className="member-manage-info">
                    <span className="member-manage-name">{member.character_name}</span>
                    <span className="member-manage-detail">Lv.{member.level} {member.job}</span>
                  </div>
                  <span className={`member-manage-role role-${member.role}`}>{getRoleName(member.role)}</span>
                  <div className="member-manage-actions">
                    <button className="btn-small" onClick={() => openProfileModal(member)}>프로필 수정</button>
                    <button className="btn-small" onClick={() => openRoleModal(member)}>역할 변경</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 부화기 관리 */}
          {activeAdminTab === 'incubator' && (
            <div className="incubator-admin">
              <div className="incubator-admin-header">
                <h4>유저별 부화 현황</h4>
              </div>
              <div className="incubator-users-list">
                {incubatorUsers.length === 0 ? (
                  <div className="empty-message">데이터가 없습니다.</div>
                ) : (
                  incubatorUsers.map(u => (
                    <div key={u.id} className="incubator-user-item">
                      <div className="incubator-user-info">
                        <span className="incubator-user-name">{u.character_name}</span>
                        <span className={`incubator-user-role role-${u.role}`}>
                          {u.role === 'master' ? '마스터' : u.role === 'submaster' ? '부마스터' : '길드원'}
                        </span>
                      </div>
                      <div className="incubator-user-stats">
                        <span className="stat-item">총 부화: <strong>{u.total_hatches || 0}</strong></span>
                        <span className="stat-item legendary">전설뱃지: <strong>{u.legendary_inventory || 0}</strong></span>
                        {u.bonus_hatches > 0 && (
                          <span className="stat-item bonus">보너스: <strong>+{u.bonus_hatches}</strong></span>
                        )}
                      </div>
                      <div className="incubator-user-actions">
                        <button className="btn-small" onClick={() => { setSelectedIncubatorUser(u); loadUserInventory(u.id); }}>
                          인벤토리
                        </button>
                        {isMaster && (
                          <>
                            <button className="btn-small btn-bonus" onClick={() => { setSelectedIncubatorUser(u); setShowBonusModal(true); }}>
                              보너스 지급
                            </button>
                            {u.bonus_hatches > 0 && (
                              <button className="btn-small btn-revoke" onClick={() => handleRevokeBonus(u)}>
                                보너스 회수
                              </button>
                            )}
                            <button className="btn-small btn-reset-user" onClick={() => handleResetIncubatorUser(u)}>
                              초기화
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 랭킹 관리 */}
          {activeAdminTab === 'rankings' && (
            <div className="rankings-admin">
              <div className="rankings-admin-header">
                <h4>게임 랭킹 관리</h4>
                <p className="admin-warning">⚠️ 랭킹 초기화는 되돌릴 수 없습니다. 신중하게 진행해주세요.</p>
              </div>
              <div className="rankings-reset-list">
                <div className="ranking-reset-item">
                  <div className="ranking-reset-info">
                    <span className="ranking-name">📜 주문서 시뮬레이터</span>
                    <span className="ranking-desc">주문서 작 랭킹 (총 스탯 기준)</span>
                  </div>
                  <button
                    className="btn-reset-ranking"
                    onClick={handleResetScrollRankings}
                    disabled={resettingScroll}
                  >
                    {resettingScroll ? '초기화 중...' : '랭킹 초기화'}
                  </button>
                </div>
                <div className="ranking-reset-item">
                  <div className="ranking-reset-info">
                    <span className="ranking-name">🎲 혼줌 시뮬레이터</span>
                    <span className="ranking-desc">혼줌 공마 랭킹 (공+마 합계 기준)</span>
                  </div>
                  <button
                    className="btn-reset-ranking"
                    onClick={handleResetChaosRankings}
                    disabled={resettingChaos}
                  >
                    {resettingChaos ? '초기화 중...' : '랭킹 초기화'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 포인트 관리 */}
          {activeAdminTab === 'points' && (
            <div className="admin-points">
              <h4>활동 포인트 설정</h4>
              <div className="point-config-list">
                {pointConfig.map(cfg => (
                  <div key={cfg.id} className="point-config-item">
                    <div className="point-config-info">
                      <span className="point-config-name">{cfg.activity_name}</span>
                      <span className="point-config-type">{cfg.activity_type}</span>
                    </div>
                    <div className="point-config-controls">
                      <label>포인트
                        <input type="number" value={cfg.points_per_action} min="0" max="100"
                          onChange={async (e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val)) return;
                            try {
                              await api.updatePointConfig(cfg.activity_type, { points_per_action: val });
                              setPointConfig(prev => prev.map(c => c.activity_type === cfg.activity_type ? { ...c, points_per_action: val } : c));
                            } catch (err) { alert(err.message); }
                          }}
                        />
                      </label>
                      <label>일일제한
                        <input type="number" value={cfg.daily_limit} min="0" max="100"
                          onChange={async (e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val)) return;
                            try {
                              await api.updatePointConfig(cfg.activity_type, { daily_limit: val });
                              setPointConfig(prev => prev.map(c => c.activity_type === cfg.activity_type ? { ...c, daily_limit: val } : c));
                            } catch (err) { alert(err.message); }
                          }}
                        />
                      </label>
                      <label className="point-config-toggle">
                        <input type="checkbox" checked={cfg.is_active === 1}
                          onChange={async (e) => {
                            const val = e.target.checked ? 1 : 0;
                            try {
                              await api.updatePointConfig(cfg.activity_type, { is_active: val });
                              setPointConfig(prev => prev.map(c => c.activity_type === cfg.activity_type ? { ...c, is_active: val } : c));
                            } catch (err) { alert(err.message); }
                          }}
                        />
                        활성
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ marginTop: '24px' }}>유저 포인트 관리</h4>
              <div className="point-users-list">
                {pointUsers.map(u => (
                  <div key={u.id} className="point-user-item">
                    <div className="point-user-info">
                      <span className="point-user-name">{u.character_name}</span>
                      <span className="point-user-balance">{(u.balance || 0).toLocaleString()}P</span>
                    </div>
                    <div className="point-user-actions">
                      <button className="btn-small btn-bonus" onClick={() => {
                        setPointGrantUser(u); setPointAction('grant'); setPointAmount(''); setPointDesc(''); setShowPointModal(true);
                      }}>지급</button>
                      <button className="btn-small btn-revoke" onClick={() => {
                        setPointGrantUser(u); setPointAction('deduct'); setPointAmount(''); setPointDesc(''); setShowPointModal(true);
                      }}>차감</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 교환소 관리 */}
          {activeAdminTab === 'shop_admin' && (
            <div className="admin-shop">
              <div className="admin-shop-header">
                <h4>교환소 상품 관리</h4>
                <button className="btn-add-item" onClick={() => {
                  setEditingShopItem(null);
                  setShopForm({ name: '', description: '', price: '', stock: '', max_per_user: '1', sort_order: '0' });
                  setShopFile(null);
                  setShowShopModal(true);
                }}>+ 상품 추가</button>
              </div>
              <div className="shop-admin-list">
                {shopItems.map(item => (
                  <div key={item.id} className={`shop-admin-item ${!item.is_active ? 'inactive' : ''}`}>
                    <div className="shop-admin-image">
                      {item.image_url ? <img src={getImageUrl(item.image_url)} alt="" /> : <div className="no-img">No Image</div>}
                    </div>
                    <div className="shop-admin-info">
                      <span className="shop-admin-name">{item.name}</span>
                      <span className="shop-admin-price">{item.price}P / 재고 {item.stock}개</span>
                    </div>
                    <div className="shop-admin-actions">
                      <button className="btn-small" onClick={() => {
                        setEditingShopItem(item);
                        setShopForm({
                          name: item.name, description: item.description || '', price: String(item.price),
                          stock: String(item.stock), max_per_user: String(item.max_per_user), sort_order: String(item.sort_order),
                        });
                        setShopFile(null);
                        setShowShopModal(true);
                      }}>수정</button>
                      <button className="btn-small btn-revoke" onClick={async () => {
                        if (!confirm(`"${item.name}" 상품을 삭제하시겠습니까?`)) return;
                        try { await api.deleteShopItem(item.id); loadAdminData(); } catch (e) { alert(e.message); }
                      }}>삭제</button>
                    </div>
                  </div>
                ))}
                {shopItems.length === 0 && <div className="empty-message">등록된 상품이 없습니다.</div>}
              </div>
            </div>
          )}

          {/* 공지 팝업 관리 */}
          {activeAdminTab === 'announce' && (
            <div className="admin-announce">
              <div className="admin-announce-header">
                <h4>공지 팝업 관리</h4>
                <button className="btn-add-item" onClick={() => {
                  setEditingAnnounce(null);
                  setAnnounceForm({ title: '', content: '', type: 'info', priority: '0' });
                  setShowAnnounceModal(true);
                }}>+ 공지 추가</button>
              </div>
              <div className="announce-admin-list">
                {announceList.map(ann => (
                  <div key={ann.id} className={`announce-admin-item ${!ann.is_active ? 'inactive' : ''}`}>
                    <div className="announce-admin-info">
                      <span className={`announce-type-tag type-${ann.type}`}>
                        {ann.type === 'info' ? '안내' : ann.type === 'feature' ? '새 기능' : ann.type === 'event' ? '이벤트' : '점검'}
                      </span>
                      <span className="announce-admin-title">{ann.title}</span>
                      <span className="announce-admin-date">{ann.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="announce-admin-actions">
                      <button className="btn-small" onClick={() => {
                        setEditingAnnounce(ann);
                        setAnnounceForm({
                          title: ann.title, content: ann.content, type: ann.type, priority: String(ann.priority),
                        });
                        setShowAnnounceModal(true);
                      }}>수정</button>
                      <button className="btn-small" onClick={async () => {
                        const newActive = ann.is_active ? 0 : 1;
                        try { await api.updateAnnouncement(ann.id, { is_active: newActive }); loadAdminData(); } catch (e) { alert(e.message); }
                      }}>{ann.is_active ? '비활성' : '활성화'}</button>
                      <button className="btn-small btn-revoke" onClick={async () => {
                        if (!confirm('이 공지를 삭제하시겠습니까?')) return;
                        try { await api.deleteAnnouncement(ann.id); loadAdminData(); } catch (e) { alert(e.message); }
                      }}>삭제</button>
                    </div>
                  </div>
                ))}
                {announceList.length === 0 && <div className="empty-message">등록된 공지가 없습니다.</div>}
              </div>
            </div>
          )}

          {/* 감사 로그 */}
          {activeAdminTab === 'audit' && (
            <div className="admin-audit">
              <h4>관리자 감사 로그</h4>
              <div className="audit-log-list">
                {auditLogs.map(log => (
                  <div key={log.id} className="audit-log-item">
                    <div className="audit-log-info">
                      <span className="audit-log-action">{log.action_type}</span>
                      <span className="audit-log-target">{log.target_type} #{log.target_id}</span>
                    </div>
                    <div className="audit-log-meta">
                      <span className="audit-log-admin">{log.admin_name}</span>
                      <span className="audit-log-date">{log.created_at?.slice(0, 16)}</span>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && <div className="empty-message">로그가 없습니다.</div>}
              </div>
            </div>
          )}

          {/* 빠른 이동 */}
          {activeAdminTab === 'shortcuts' && (
            <div className="admin-shortcuts">
              <div className="shortcut-grid">
                <button className="shortcut-btn" onClick={() => setPage('notice')}>
                  <span className="shortcut-icon">📢</span>
                  <span>공지사항 관리</span>
                </button>
                <button className="shortcut-btn" onClick={() => setPage('schedule')}>
                  <span className="shortcut-icon">📅</span>
                  <span>일정 관리</span>
                </button>
                <button className="shortcut-btn" onClick={() => setPage('alliance')}>
                  <span className="shortcut-icon">🏰</span>
                  <span>연합 길드 관리</span>
                </button>
                <button className="shortcut-btn" onClick={() => setPage('attendance')}>
                  <span className="shortcut-icon">◆</span>
                  <span>출석 혜택 설정</span>
                </button>
                <button className="shortcut-btn" onClick={() => setPage('members')}>
                  <span className="shortcut-icon">👥</span>
                  <span>길드원 목록</span>
                </button>
                <button className="shortcut-btn" onClick={() => setPage('showoff')}>
                  <span className="shortcut-icon">💬</span>
                  <span>게시판 관리</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 역할 변경 모달 */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="역할 변경">
        {selectedMember && (
          <div className="role-change-modal">
            <p><strong>{selectedMember.character_name}</strong>님의 역할을 변경합니다.</p>
            <div className="role-options">
              <button
                className={`role-option ${selectedMember.role === 'master' ? 'current' : ''}`}
                onClick={() => handleRoleChange(selectedMember.id, 'master')}
              >
                길드 마스터
              </button>
              <button
                className={`role-option ${selectedMember.role === 'submaster' ? 'current' : ''}`}
                onClick={() => handleRoleChange(selectedMember.id, 'submaster')}
              >
                부마스터
              </button>
              <button
                className={`role-option ${selectedMember.role === 'member' ? 'current' : ''}`}
                onClick={() => handleRoleChange(selectedMember.id, 'member')}
              >
                길드원
              </button>
              <button
                className={`role-option ${selectedMember.role === 'honorary' ? 'current' : ''}`}
                onClick={() => handleRoleChange(selectedMember.id, 'honorary')}
              >
                명예 길드원
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 인벤토리 모달 */}
      <Modal isOpen={showInventoryModal} onClose={() => setShowInventoryModal(false)} title={userInventory?.user?.character_name + '님의 인벤토리'}>
        {userInventory && (
          <div className="inventory-modal">
            <div className="inventory-stats">
              <div className="stat-box">
                <span className="label">오늘 부화</span>
                <span className="value">{userInventory.todayStats?.totalHatches || 0}</span>
              </div>
              <div className="stat-box">
                <span className="label">보너스 잔여</span>
                <span className="value bonus">{userInventory.bonusHatches || 0}</span>
              </div>
            </div>
            <div className="inventory-grid-modal">
              {userInventory.inventory?.length === 0 ? (
                <div className="empty-message">인벤토리가 비어있습니다.</div>
              ) : (
                userInventory.inventory?.map(item => (
                  <div key={item.item_id} className={`inventory-item-modal rate-${item.rate < 1 ? 'legendary' : item.rate < 3 ? 'rare' : 'common'}`}>
                    <span className="item-name">{item.name}</span>
                    <span className="item-count">x{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 보너스 지급 모달 */}
      <Modal isOpen={showBonusModal} onClose={() => setShowBonusModal(false)} title="보너스 부화 횟수 지급">
        {selectedIncubatorUser && (
          <div className="bonus-modal">
            <p><strong>{selectedIncubatorUser.character_name}</strong>님에게 보너스 부화 횟수를 지급합니다.</p>
            <p className="current-bonus">현재 보너스: {selectedIncubatorUser.bonus_hatches || 0}회</p>
            <div className="bonus-input-group">
              <label>지급할 횟수</label>
              <input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                min="1"
                max="10000"
                placeholder="100"
              />
            </div>
            <div className="bonus-presets">
              <button onClick={() => setBonusAmount('100')}>100</button>
              <button onClick={() => setBonusAmount('500')}>500</button>
              <button onClick={() => setBonusAmount('1000')}>1000</button>
              <button onClick={() => setBonusAmount('3000')}>3000</button>
            </div>
            <button className="btn-grant-bonus" onClick={handleGrantBonus}>지급하기</button>
          </div>
        )}
      </Modal>

      {/* 포인트 지급/차감 모달 */}
      <Modal isOpen={showPointModal} onClose={() => setShowPointModal(false)} title={pointAction === 'grant' ? '포인트 지급' : '포인트 차감'}>
        {pointGrantUser && (
          <div className="bonus-modal">
            <p><strong>{pointGrantUser.character_name}</strong>님 (현재: {(pointGrantUser.balance || 0).toLocaleString()}P)</p>
            <div className="bonus-input-group">
              <label>포인트 수량</label>
              <input type="number" value={pointAmount} onChange={(e) => setPointAmount(e.target.value)} min="1" max="10000" placeholder="수량" />
            </div>
            <div className="bonus-input-group">
              <label>사유</label>
              <input type="text" value={pointDesc} onChange={(e) => setPointDesc(e.target.value)} placeholder="사유 입력" />
            </div>
            <button className="btn-grant-bonus" onClick={async () => {
              const amt = parseInt(pointAmount);
              if (!amt || amt <= 0) { alert('올바른 수량을 입력하세요.'); return; }
              try {
                if (pointAction === 'grant') {
                  await api.grantPoints(pointGrantUser.id, amt, pointDesc);
                  alert(`${amt}P 지급 완료`);
                } else {
                  await api.deductPoints(pointGrantUser.id, amt, pointDesc);
                  alert(`${amt}P 차감 완료`);
                }
                setShowPointModal(false);
                loadAdminData();
              } catch (e) { alert(e.message); }
            }}>{pointAction === 'grant' ? '지급하기' : '차감하기'}</button>
          </div>
        )}
      </Modal>

      {/* 교환소 상품 추가/수정 모달 */}
      <Modal isOpen={showShopModal} onClose={() => setShowShopModal(false)} title={editingShopItem ? '상품 수정' : '상품 추가'}>
        <div className="shop-form-modal">
          <div className="form-group">
            <label>상품명</label>
            <input type="text" value={shopForm.name} onChange={(e) => setShopForm(p => ({ ...p, name: e.target.value }))} placeholder="상품명" />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea value={shopForm.description} onChange={(e) => setShopForm(p => ({ ...p, description: e.target.value }))} placeholder="상품 설명" rows="3" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>가격 (P)</label>
              <input type="number" value={shopForm.price} onChange={(e) => setShopForm(p => ({ ...p, price: e.target.value }))} min="1" />
            </div>
            <div className="form-group">
              <label>재고</label>
              <input type="number" value={shopForm.stock} onChange={(e) => setShopForm(p => ({ ...p, stock: e.target.value }))} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>인당 최대</label>
              <input type="number" value={shopForm.max_per_user} onChange={(e) => setShopForm(p => ({ ...p, max_per_user: e.target.value }))} min="1" />
            </div>
            <div className="form-group">
              <label>정렬순서</label>
              <input type="number" value={shopForm.sort_order} onChange={(e) => setShopForm(p => ({ ...p, sort_order: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>이미지</label>
            <input type="file" accept="image/*" onChange={(e) => setShopFile(e.target.files[0])} />
          </div>
          <button className="btn-save-profile" onClick={async () => {
            if (!shopForm.name || !shopForm.price) { alert('상품명과 가격은 필수입니다.'); return; }
            const formData = new FormData();
            formData.append('name', shopForm.name);
            formData.append('description', shopForm.description);
            formData.append('price', shopForm.price);
            formData.append('stock', shopForm.stock || '0');
            formData.append('max_per_user', shopForm.max_per_user || '1');
            formData.append('sort_order', shopForm.sort_order || '0');
            if (shopFile) formData.append('file', shopFile);
            try {
              if (editingShopItem) {
                await api.updateShopItem(editingShopItem.id, formData);
                alert('상품이 수정되었습니다.');
              } else {
                await api.createShopItem(formData);
                alert('상품이 등록되었습니다.');
              }
              setShowShopModal(false);
              loadAdminData();
            } catch (e) { alert(e.message); }
          }}>{editingShopItem ? '수정' : '등록'}</button>
        </div>
      </Modal>

      {/* 공지 팝업 추가/수정 모달 */}
      <Modal isOpen={showAnnounceModal} onClose={() => setShowAnnounceModal(false)} title={editingAnnounce ? '공지 수정' : '공지 추가'}>
        <div className="announce-form-modal">
          <div className="form-group">
            <label>제목</label>
            <input type="text" value={announceForm.title} onChange={(e) => setAnnounceForm(p => ({ ...p, title: e.target.value }))} placeholder="공지 제목" />
          </div>
          <div className="form-group">
            <label>내용</label>
            <textarea value={announceForm.content} onChange={(e) => setAnnounceForm(p => ({ ...p, content: e.target.value }))} placeholder="공지 내용" rows="6" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>유형</label>
              <select value={announceForm.type} onChange={(e) => setAnnounceForm(p => ({ ...p, type: e.target.value }))}>
                <option value="info">안내</option>
                <option value="feature">새 기능</option>
                <option value="event">이벤트</option>
                <option value="maintenance">점검</option>
              </select>
            </div>
            <div className="form-group">
              <label>우선순위</label>
              <input type="number" value={announceForm.priority} onChange={(e) => setAnnounceForm(p => ({ ...p, priority: e.target.value }))} min="0" />
            </div>
          </div>
          <button className="btn-save-profile" onClick={async () => {
            if (!announceForm.title || !announceForm.content) { alert('제목과 내용은 필수입니다.'); return; }
            try {
              if (editingAnnounce) {
                await api.updateAnnouncement(editingAnnounce.id, { ...announceForm, priority: parseInt(announceForm.priority) || 0 });
                alert('공지가 수정되었습니다.');
              } else {
                await api.createAnnouncement({ ...announceForm, priority: parseInt(announceForm.priority) || 0 });
                alert('공지가 등록되었습니다.');
              }
              setShowAnnounceModal(false);
              loadAdminData();
            } catch (e) { alert(e.message); }
          }}>{editingAnnounce ? '수정' : '등록'}</button>
        </div>
      </Modal>

      {/* 프로필 수정 모달 */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="멤버 프로필 수정">
        {editingMember && (
          <div className="profile-edit-modal">
            <p><strong>{editingMember.character_name}</strong>님의 프로필을 수정합니다.</p>
            <div className="form-group">
              <label>직업</label>
              <select
                value={editJob}
                onChange={(e) => setEditJob(e.target.value)}
                className="job-select"
              >
                {JOB_LIST.map(job => (
                  <option key={job.value} value={job.value}>{job.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>레벨</label>
              <input
                type="number"
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value)}
                min="1"
                max="300"
                placeholder="레벨"
              />
            </div>
            <button className="btn-save-profile" onClick={handleProfileUpdate}>저장</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

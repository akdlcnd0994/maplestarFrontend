import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/api';
import NotificationBell from './NotificationBell';
import StyledName, { ProfileFrame } from './StyledName';
import { getIconEmoji } from './UserAvatar';

const navStructure = [
  { id: 'main', label: '홈' },
  { id: 'notice', label: '공지사항' },
  { label: '커뮤니티', isNew: true, children: [
    { id: 'gallery', label: '갤러리' },
    { id: 'showoff', label: '자유게시판' },
    { id: 'info', label: '정보게시판', isNew: true },
  ]},
  { label: '미니게임', children: [
    { id: 'games', label: '미니게임' },
    { id: 'scroll', label: '주문서' },
    { id: 'incubator', label: '부화기' },
  ]},
  { label: '무릉도장', children: [
    { id: 'mureung-overall', label: '종합랭킹' },
    { id: 'mureung-job', label: '직업랭킹' },
    { id: 'mureung-guild', label: '길드랭킹' },
    { id: 'mureung-history', label: '역대기록' },
  ]},
  { id: 'schedule', label: '운동회일정' },
  { label: '길드', children: [
    { id: 'members', label: '길드원' },
    { id: 'alliance', label: '연합길드' },
  ]},
  { id: 'attendance', label: '출석체크' },
  { label: '포인트', isNew: true, children: [
    { id: 'point', label: '포인트', isNew: true },
    { id: 'roulette', label: '룰렛', isNew: true },
    { id: 'shop', label: '교환소', isNew: true },
  ]},
];

export default function Header({ page, setPage, guildLogo }) {
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointPopup, setPointPopup] = useState(null);
  const [openMobileGroup, setOpenMobileGroup] = useState(null);
  const prevPointRef = useRef(null);

  // 포인트 변화 감지 → 플로팅 "+N" 팝업
  // user?.point_balance만 dependency로 사용 → checkAuth()로 user 객체만 교체돼도 값이 같으면 effect 재실행 없음
  useEffect(() => {
    const currentPoint = user?.point_balance;

    // 로그아웃 시 리셋 (undefined)
    if (currentPoint === undefined) {
      prevPointRef.current = null;
      return;
    }

    if (prevPointRef.current !== null && currentPoint > prevPointRef.current) {
      const delta = currentPoint - prevPointRef.current;
      setPointPopup({ amount: delta, key: Date.now() });
      setTimeout(() => setPointPopup(null), 1800);
    }
    prevPointRef.current = currentPoint;
  }, [user?.point_balance]); // eslint-disable-line react-hooks/exhaustive-deps

  // 페이지 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [page]);

  // 모바일 메뉴 열려있을 때 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (navId) => {
    setPage(navId);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isGroupActive = (children) => children.some(c => c.id === page);

  const toggleMobileGroup = (label) => {
    setOpenMobileGroup(prev => prev === label ? null : label);
  };

  return (
    <>
      <header className="main-header">
        <div className="header-inner">
          {/* 모바일 햄버거 버튼 */}
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <div className="logo" onClick={() => handleNavClick('main')}>
            {guildLogo ? (
              <img src={guildLogo} alt="로고" className="logo-img" />
            ) : (
              <span className="logo-icon">🍁</span>
            )}
            <span className="logo-text">메이플운동회</span>
          </div>

          <nav className="main-nav">
            {navStructure.map((nav, i) =>
              nav.children ? (
                <div key={i} className={`nav-dropdown ${isGroupActive(nav.children) ? 'active' : ''}`}>
                  <button className={`nav-dropdown-btn ${isGroupActive(nav.children) ? 'active' : ''}`}>
                    {nav.label}{nav.isNew && <span className="nav-new-badge">N</span>}<span className="nav-arrow">▾</span>
                  </button>
                  <div className="nav-dropdown-menu">
                    {nav.children.map(child => (
                      <button
                        key={child.id}
                        className={page === child.id ? 'active' : ''}
                        onClick={() => setPage(child.id)}
                      >
                        {child.label}{child.isNew && <span className="nav-new-badge">N</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  key={nav.id}
                  className={page === nav.id ? 'active' : ''}
                  onClick={() => setPage(nav.id)}
                >
                  {nav.label}
                </button>
              )
            )}
          </nav>

          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-menu">
                <span className="point-badge-wrapper">
                  <span className={`header-point-badge ${pointPopup ? 'point-bump' : ''}`} onClick={() => setPage('point')}>
                    {(user?.point_balance || 0).toLocaleString()}P
                  </span>
                  {pointPopup && (
                    <span key={pointPopup.key} className="point-float-popup">
                      +{pointPopup.amount}
                    </span>
                  )}
                </span>
                <div className="header-profile-hover">
                  <StyledName user={user} showTitle={false} className="user-name" />
                  <div className="header-profile-popup">
                    <div className="profile-popup-avatar">
                      <ProfileFrame user={user} size="md">
                        <div className="profile-popup-img">
                          {user?.profile_image ? (
                            <img src={getImageUrl(user.profile_image)} alt="" style={{ transform: `scale(${user.profile_zoom || 1})` }} />
                          ) : (
                            <span className="profile-popup-icon">{getIconEmoji(user?.default_icon)}</span>
                          )}
                        </div>
                      </ProfileFrame>
                    </div>
                    <StyledName user={user} showTitle={true} className="profile-popup-name" />
                    <div className="profile-popup-info">
                      <span className="profile-popup-job">{user?.job || '-'}</span>
                      <span className="profile-popup-role">
                        {user?.role === 'master' ? '길드마스터' :
                         user?.role === 'submaster' ? '부마스터' :
                         user?.role === 'honorary' ? '명예길드원' : '길드원'}
                      </span>
                    </div>
                    <button className="profile-popup-btn" onClick={() => setPage('settings')}>프로필 설정</button>
                  </div>
                </div>
                <NotificationBell setPage={setPage} />
                <button className="settings-btn" onClick={() => setPage('settings')}>⚙️</button>
                <button className="user-btn" onClick={logout}>로그아웃</button>
              </div>
            ) : (
              <>
                <button className="login-link" onClick={() => setPage('login')}>로그인</button>
                <button className="register-link" onClick={() => setPage('signup')}>회원가입</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 사이드바 오버레이 */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* 모바일 사이드바 */}
      <aside className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-logo">
            {guildLogo ? (
              <img src={guildLogo} alt="로고" className="logo-img" />
            ) : (
              <span className="logo-icon">🍁</span>
            )}
            <span>메이플운동회</span>
          </div>
          <button
            className="mobile-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 모바일 사용자 정보 */}
        <div className="mobile-user-section">
          {isLoggedIn ? (
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                {user?.profile_image ? (
                  <img
                    src={getImageUrl(user.profile_image)}
                    alt=""
                    style={{ transform: `scale(${user.profile_zoom || 1})` }}
                  />
                ) : (
                  <span className="avatar-default">●</span>
                )}
              </div>
              <div className="mobile-user-details">
                <StyledName user={user} showTitle={false} className="mobile-user-name" />
                <span className="mobile-user-role">
                  {user?.role === 'master' ? '길드마스터' :
                   user?.role === 'submaster' ? '부마스터' : '길드원'}
                </span>
                <span className="point-badge-wrapper">
                  <span className={`mobile-user-point ${pointPopup ? 'point-bump' : ''}`} onClick={() => handleNavClick('point')}>
                    {(user?.point_balance || 0).toLocaleString()}P
                  </span>
                  {pointPopup && (
                    <span key={pointPopup.key} className="point-float-popup mobile">
                      +{pointPopup.amount}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <button className="mobile-login-btn" onClick={() => handleNavClick('login')}>
                로그인
              </button>
              <button className="mobile-signup-btn" onClick={() => handleNavClick('signup')}>
                회원가입
              </button>
            </div>
          )}
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="mobile-nav">
          {navStructure.map((nav, i) =>
            nav.children ? (
              <div key={i} className="mobile-nav-group">
                <button
                  className={`mobile-nav-group-header ${isGroupActive(nav.children) ? 'active' : ''} ${openMobileGroup === nav.label ? 'open' : ''}`}
                  onClick={() => toggleMobileGroup(nav.label)}
                >
                  <span className="mobile-nav-icon">●</span>
                  <span className="mobile-nav-label">{nav.label}{nav.isNew && <span className="nav-new-badge">N</span>}</span>
                  <span className={`mobile-nav-arrow ${openMobileGroup === nav.label ? 'open' : ''}`}>▾</span>
                </button>
                <div className={`mobile-nav-group-items ${openMobileGroup === nav.label ? 'open' : ''}`}>
                  {nav.children.map(child => (
                    <button
                      key={child.id}
                      className={`mobile-nav-item mobile-nav-child ${page === child.id ? 'active' : ''}`}
                      onClick={() => handleNavClick(child.id)}
                    >
                      <span className="mobile-nav-label">{child.label}{child.isNew && <span className="nav-new-badge">N</span>}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                key={nav.id}
                className={`mobile-nav-item ${page === nav.id ? 'active' : ''}`}
                onClick={() => handleNavClick(nav.id)}
              >
                <span className="mobile-nav-icon">●</span>
                <span className="mobile-nav-label">{nav.label}</span>
              </button>
            )
          )}
        </nav>

        {/* 모바일 하단 액션 */}
        {isLoggedIn && (
          <div className="mobile-sidebar-footer">
            <button
              className="mobile-settings-btn"
              onClick={() => handleNavClick('settings')}
            >
              설정
            </button>
            <button
              className="mobile-logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

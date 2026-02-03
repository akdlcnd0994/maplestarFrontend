import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/api';

export default function Header({ page, setPage, guildLogo }) {
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'main', label: '홈' },
    { id: 'notice', label: '공지사항' },
    { id: 'showoff', label: '게시판' },
    { id: 'gallery', label: '갤러리' },
    { id: 'games', label: '미니게임' },
    { id: 'scroll', label: '주문서' },
    { id: 'incubator', label: '부화기' },
    { id: 'schedule', label: '운동회일정' },
    { id: 'members', label: '길드원' },
    { id: 'attendance', label: '출석체크' },
    { id: 'alliance', label: '연합길드' },
  ];

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
            {navItems.map(nav => (
              <button
                key={nav.id}
                className={page === nav.id ? 'active' : ''}
                onClick={() => setPage(nav.id)}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            {isLoggedIn ? (
              <div className="user-menu">
                <span className="user-name">{user?.character_name || user?.username}</span>
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
                <span className="mobile-user-name">{user?.character_name || user?.username}</span>
                <span className="mobile-user-role">
                  {user?.role === 'master' ? '길드마스터' :
                   user?.role === 'submaster' ? '부마스터' : '길드원'}
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
          {navItems.map(nav => (
            <button
              key={nav.id}
              className={`mobile-nav-item ${page === nav.id ? 'active' : ''}`}
              onClick={() => handleNavClick(nav.id)}
            >
              <span className="mobile-nav-icon">●</span>
              <span className="mobile-nav-label">{nav.label}</span>
            </button>
          ))}
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

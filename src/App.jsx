import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import AttendanceWidget from './components/AttendanceWidget';

// Pages
import MainPage from './pages/MainPage';
import AlliancePage from './pages/AlliancePage';
import SchedulePage from './pages/SchedulePage';
import ShowoffPage from './pages/ShowoffPage';
import GalleryPage from './pages/GalleryPage';
import MembersPage from './pages/MembersPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SettingsPage from './pages/SettingsPage';
import NoticePage from './pages/NoticePage';
import AttendancePage from './pages/AttendancePage';
import GamesPage from './pages/GamesPage';
import ScrollPage from './pages/ScrollPage';
import IncubatorPage from './pages/IncubatorPage';
import PointPage from './pages/PointPage';
import ShopPage from './pages/ShopPage';
import AnnouncementPopup from './components/AnnouncementPopup';

export default function App() {
  const { isLoggedIn, loading, sessionExpired, clearSessionExpired } = useAuth();
  const [page, setPage] = useState('main');
  const [guildLogo, setGuildLogo] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // 로컬 스토리지에서 길드 로고 복원
  useEffect(() => {
    const savedLogo = localStorage.getItem('guildLogo');
    if (savedLogo) {
      setGuildLogo(savedLogo);
    }
  }, []);

  // 세션 만료 처리
  useEffect(() => {
    if (sessionExpired) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      clearSessionExpired();
      setPage('login');
    }
  }, [sessionExpired, clearSessionExpired]);

  const renderPage = () => {
    const pageProps = { setPage, guildLogo, setGuildLogo, selectedNotice, setSelectedNotice, selectedMember, setSelectedMember };

    switch (page) {
      case 'notice':
        return <NoticePage {...pageProps} />;
      case 'alliance':
        return <AlliancePage {...pageProps} />;
      case 'schedule':
        return <SchedulePage {...pageProps} />;
      case 'showoff':
        return <ShowoffPage {...pageProps} />;
      case 'gallery':
        return <GalleryPage {...pageProps} />;
      case 'members':
        return <MembersPage {...pageProps} />;
      case 'attendance':
        return <AttendancePage {...pageProps} />;
      case 'register':
        return <RegisterPage {...pageProps} />;
      case 'login':
        return <LoginPage {...pageProps} />;
      case 'signup':
        return <SignupPage {...pageProps} />;
      case 'settings':
        return <SettingsPage {...pageProps} />;
      case 'games':
        return <GamesPage {...pageProps} />;
      case 'scroll':
        return <ScrollPage {...pageProps} />;
      case 'incubator':
        return <IncubatorPage {...pageProps} />;
      case 'point':
        return <PointPage {...pageProps} />;
      case 'shop':
        return <ShopPage {...pageProps} />;
      default:
        return <MainPage {...pageProps} />;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="bg-pattern"></div>
        <div className="loading-screen">
          <div className="loading-emblem">🍁</div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="bg-pattern"></div>

      <Header page={page} setPage={setPage} guildLogo={guildLogo} />

      {isLoggedIn && <AnnouncementPopup />}

      <main className="main-content">{renderPage()}</main>

      {isLoggedIn && page === 'main' && (
        <div className="floating-widget">
          <AttendanceWidget />
        </div>
      )}

      <Footer />
    </div>
  );
}

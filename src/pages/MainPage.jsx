import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { getIconEmoji } from '../components/UserAvatar';

export default function MainPage({ setPage, guildLogo, setSelectedNotice, setSelectedMember }) {
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ memberCount: 0, allianceCount: 0, guildLevel: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [noticesRes, membersRes, eventsRes, alliancesRes] = await Promise.all([
        api.getNotices().catch(() => ({ data: [] })),
        api.getMembers({ limit: 6, online: true }).catch(() => ({ data: [] })),
        api.getEvents().catch(() => ({ data: [] })),
        api.getAlliances().catch(() => ({ data: [] })),
      ]);

      setNotices(noticesRes.data?.slice(0, 4) || []);
      setMembers(membersRes.data?.slice(0, 6) || []);
      setEvents(eventsRes.data?.slice(0, 3) || []);

      const mainGuild = alliancesRes.data?.find(a => a.is_main) || {};
      setStats({
        memberCount: mainGuild.member_count || 0,
        allianceCount: alliancesRes.data?.length || 0,
        guildLevel: mainGuild.guild_level || 0,
      });
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
  };

  const quickMenus = [
    { id: 'notice', title: '공지사항', desc: '길드 소식 확인', page: 'notice' },
    { id: 'board', title: '자유게시판', desc: '자유 게시판', page: 'showoff' },
    { id: 'info', title: '정보게시판', desc: '정보 공유', page: 'info' },
    { id: 'gallery', title: '갤러리', desc: '스크린샷 모음', page: 'gallery' },
    { id: 'schedule', title: '운동회 일정', desc: '이벤트 스케줄', page: 'schedule' },
    { id: 'members', title: '길드원', desc: '멤버 목록', page: 'members' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const getDday = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="page-content home-page">
      <section className="hero-section premium">
        <div className="hero-bg-pattern"></div>
        <div className="hero-corner top-left"></div>
        <div className="hero-corner top-right"></div>
        <div className="hero-corner bottom-left"></div>
        <div className="hero-corner bottom-right"></div>
        <div className="hero-inner">
          <div className="guild-emblem premium">
            <div className="emblem-ring"></div>
            {guildLogo ? (
              <img src={guildLogo} alt="길드 로고" className="emblem-img" />
            ) : (
              <div className="emblem-maple"></div>
            )}
          </div>
          <div className="guild-badge">메이플스타 길드 연합</div>
          <h1 className="guild-title premium">메이플운동회</h1>
          <p className="guild-slogan premium">레전드 시대의 감성을 함께하는 길드</p>
          <div className="hero-stats premium">
            <div className="stat-box">
              <div className="stat-icon-mini members-icon"></div>
              <div className="stat-content">
                <span className="stat-num">{stats.memberCount || '-'}</span>
                <span className="stat-label">길드원</span>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon-mini alliance-icon"></div>
              <div className="stat-content">
                <span className="stat-num">{stats.allianceCount || '-'}</span>
                <span className="stat-label">연합 길드</span>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon-mini level-icon"></div>
              <div className="stat-content">
                <span className="stat-num">Lv.{stats.guildLevel || '-'}</span>
                <span className="stat-label">길드 레벨</span>
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <a
              href="https://discord.gg/jQeDb8D5kK"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-link"
            >
              <span className="discord-icon">💬</span>
              <span>길드 디스코드 참여하기</span>
            </a>
          </div>
        </div>
      </section>

      <section className="notice-section premium">
        <div className="section-header premium">
          <div className="header-line"></div>
          <h2>공지사항</h2>
          <div className="header-line"></div>
        </div>
        <div className="notice-board premium">
          {notices.length === 0 ? (
            <div className="empty-message">공지사항이 없습니다.</div>
          ) : (
            notices.map((item, i) => (
              <div
                key={i}
                className={`notice-item premium ${item.is_important ? 'hot' : ''}`}
                onClick={() => {
                  setSelectedNotice(item);
                  setPage('notice');
                }}
              >
                <span className={`notice-tag ${item.is_important ? 'important' : ''}`}>
                  {item.is_important ? '중요' : '공지'}
                </span>
                <span className="notice-title">{item.title}</span>
                <span className="notice-date">{formatDate(item.created_at)}</span>
              </div>
            ))
          )}
        </div>
        <button className="view-all-btn" onClick={() => setPage('notice')}>
          전체보기
        </button>
      </section>

      <section className="quick-menu premium">
        {quickMenus.map((item, i) => (
          <div key={i} className={`menu-card premium menu-${item.id}`} onClick={() => setPage(item.page)}>
            <div className={`card-icon icon-${item.id}`}></div>
            <div className="card-info">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
            <div className="card-arrow"></div>
          </div>
        ))}
      </section>

      <section className="members-preview premium">
        <div className="section-header premium">
          <div className="header-line"></div>
          <h2>활동 중인 길드원</h2>
          <div className="header-line"></div>
        </div>
        <div className="member-grid premium">
          {members.length === 0 ? (
            <div className="empty-message">접속 중인 길드원이 없습니다.</div>
          ) : (
            members.map((m, i) => (
              <div
                key={i}
                className="member-card premium"
                onClick={() => {
                  setSelectedMember(m);
                  setPage('members');
                }}
              >
                <div className="member-avatar premium">
                  {m.profile_image ? (
                    <img src={getImageUrl(m.profile_image)} alt={m.character_name} style={{ transform: `scale(${m.profile_zoom || 1})` }} />
                  ) : (
                    <span>{getIconEmoji(m.default_icon)}</span>
                  )}
                  <div className={`online-indicator ${m.is_online ? 'online' : ''}`}></div>
                </div>
                <div className="member-info">
                  <span className="member-name">{m.character_name}</span>
                  <span className="member-detail">
                    <span className="level-badge">Lv.{m.level}</span>
                    <span className="job-text">{m.job}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <button className="view-more-btn" onClick={() => setPage('members')}>
          <span>전체 길드원 보기</span>
          <span className="arrow-icon"></span>
        </button>
      </section>

      <section className="upcoming-events premium">
        <div className="section-header premium">
          <div className="header-line"></div>
          <h2>다가오는 일정</h2>
          <div className="header-line"></div>
        </div>
        <div className="event-cards premium">
          {events.length === 0 ? (
            <div className="empty-message">예정된 일정이 없습니다.</div>
          ) : (
            events.map((e, i) => {
              const eventDate = new Date(e.event_date);
              const dday = getDday(e.event_date);
              return (
                <div
                  key={i}
                  className={`event-card premium ${dday <= 3 ? 'upcoming' : ''}`}
                  onClick={() => setPage('schedule')}
                >
                  <div className="event-date">
                    <span className="date-month">{eventDate.getMonth() + 1}월</span>
                    <span className="date-day">{eventDate.getDate()}</span>
                    <span className="date-weekday">
                      {['일', '월', '화', '수', '목', '금', '토'][eventDate.getDay()]}
                    </span>
                  </div>
                  <div className="event-info">
                    <h4>{e.title}</h4>
                    <p>{e.description}</p>
                    <div className="event-meta">
                      <span className="time-icon"></span>
                      <span className="event-time">{e.event_time}</span>
                    </div>
                  </div>
                  <span className={`event-dday ${dday <= 3 ? 'soon' : ''}`}>
                    {dday === 0 ? 'TODAY' : `D-${dday}`}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <button className="view-more-btn" onClick={() => setPage('schedule')}>
          <span>전체 일정 보기</span>
          <span className="arrow-icon"></span>
        </button>
      </section>
    </div>
  );
}

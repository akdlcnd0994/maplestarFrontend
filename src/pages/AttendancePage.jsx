import { useState, useEffect, useMemo } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getIconEmoji } from '../components/UserAvatar';
import StyledName, { ProfileFrame } from '../components/StyledName';
import Modal from '../components/Modal';

export default function AttendancePage({ setPage }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [benefits, setBenefits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [todayChecked, setTodayChecked] = useState(false);
  const [serverToday, setServerToday] = useState(null);

  // 관리자 기능
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsersAttendance, setAllUsersAttendance] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [benefitForm, setBenefitForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    reward_5: '',
    reward_10: '',
    reward_15: '',
    reward_20: '',
    reward_full: '',
  });

  const isAdmin = user?.role === 'master' || user?.role === 'submaster';

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  useEffect(() => {
    // 월이 변경될 때마다 해당 월의 출석 데이터, 혜택, 랭킹 로드
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    loadBenefits(year, month);
    loadRanking(year, month);

    if (isLoggedIn) {
      loadMonthAttendance(year, month);
    }
  }, [currentDate, isLoggedIn]);

  const loadData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [rankingRes, benefitsRes] = await Promise.all([
        api.getAttendanceRanking(year, month).catch(() => ({ data: { ranking: [] } })),
        api.getAttendanceBenefits(year, month).catch(() => ({ data: null })),
      ]);

      const rankData = rankingRes.data;
      setRanking(rankData?.ranking || rankData || []);
      setBenefits(benefitsRes.data);

      if (isLoggedIn) {
        const [attendanceRes, statsRes] = await Promise.all([
          api.getAttendance(),
          api.getAttendanceStats(),
        ]);

        setAttendance(attendanceRes.data || []);
        setStats(statsRes.data);

        // 서버 기준 오늘 날짜 및 출석 여부 사용 (stats에서만 제공)
        if (statsRes.data?.server_today) setServerToday(statsRes.data.server_today);
        setTodayChecked(!!statsRes.data?.checked_today);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setLoading(false);
  };

  // 특정 년/월의 혜택 로드
  const loadBenefits = async (year, month) => {
    try {
      const res = await api.getAttendanceBenefits(year, month);
      setBenefits(res.data);
    } catch (e) {
      console.error('Failed to load benefits:', e);
      setBenefits(null);
    }
  };

  const loadRanking = async (year, month) => {
    try {
      const res = await api.getAttendanceRanking(year, month);
      const rankData = res.data;
      setRanking(rankData?.ranking || rankData || []);
    } catch (e) {
      console.error('Failed to load ranking:', e);
    }
  };

  const loadMonthAttendance = async (year, month) => {
    if (!isLoggedIn) return;
    try {
      const res = await api.getAttendanceByMonth(year, month);
      setAttendance(res.data || []);
    } catch (e) {
      console.error('Failed to load month attendance:', e);
    }
  };

  const handleCheck = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      setPage('login');
      return;
    }

    setChecking(true);
    try {
      const res = await api.checkAttendance();
      setTodayChecked(true);
      await loadData();
      checkAuth();
      alert(`${res.data.message} 연속 ${res.data.streak}일째!`);
    } catch (e) {
      alert(e.message);
    }
    setChecking(false);
  };

  // 관리자: 전체 유저 출석 현황 로드
  const loadAllUsersAttendance = async () => {
    try {
      const res = await api.getAllUsersAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
      setAllUsersAttendance(res.data || []);
    } catch (e) {
      console.error('Failed to load all users attendance:', e);
    }
  };

  // 관리자: 혜택 저장
  const handleSaveBenefits = async (e) => {
    e.preventDefault();
    try {
      await api.saveAttendanceBenefits(benefitForm);
      alert('혜택이 저장되었습니다.');
      setShowBenefitModal(false);
      // 저장한 년/월의 혜택 다시 로드
      loadBenefits(benefitForm.year, benefitForm.month);
    } catch (e) {
      alert(e.message);
    }
  };

  // 달력 관련 함수들
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // 서버 기준 오늘 날짜 파싱 (KST 오전 5시 기준), 비로그인 시 브라우저 시간 fallback
  const effectiveToday = serverToday || new Date().toISOString().split('T')[0];
  const todayParts = effectiveToday.split('-').map(Number);
  const todayYear = todayParts[0];
  const todayMonth = todayParts[1]; // 1-based
  const todayDay = todayParts[2];
  const isCurrentMonth = todayYear === year && todayMonth === month + 1;

  const attendanceDates = useMemo(() => {
    return new Set(attendance.map(a => a.check_date));
  }, [attendance]);

  const calendarDays = useMemo(() => {
    const days = [];
    // 이전 달의 빈 칸
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    // 이번 달의 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = isCurrentMonth && todayDay === day;
      const isChecked = attendanceDates.has(dateStr);
      const isPast = dateStr < effectiveToday;
      days.push({ day, dateStr, isToday, isChecked, isPast, isCurrentMonth: true });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, attendanceDates, isCurrentMonth, effectiveToday, todayDay]);

  const monthlyCheckCount = attendance.length;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 혜택 확인
  const getBenefitStatus = (count) => {
    const thresholds = [5, 10, 15, 20];
    return thresholds.map(t => ({
      days: t,
      achieved: count >= t,
      reward: benefits?.[`reward_${t}`] || '-',
    }));
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="page-content attendance-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>출석체크</h1>
        {isAdmin && (
          <button className="write-btn" onClick={() => { setShowAdminPanel(!showAdminPanel); if (!showAdminPanel) loadAllUsersAttendance(); }}>
            {showAdminPanel ? '일반 보기' : '관리자 패널'}
          </button>
        )}
      </div>

      {/* 관리자 패널 */}
      {isAdmin && showAdminPanel && (
        <div className="admin-panel">
          <div className="admin-header">
            <h2>출석 관리</h2>
            <button className="benefit-btn" onClick={() => {
              setBenefitForm({
                year,
                month: month + 1,
                reward_5: benefits?.reward_5 || '',
                reward_10: benefits?.reward_10 || '',
                reward_15: benefits?.reward_15 || '',
                reward_20: benefits?.reward_20 || '',
                reward_full: benefits?.reward_full || '',
              });
              setShowBenefitModal(true);
            }}>
              {month + 1}월 혜택 설정
            </button>
          </div>

          <div className="users-attendance-list">
            <div className="list-header">
              <span className="col-name">길드원</span>
              <span className="col-count">출석</span>
              <span className="col-streak">연속</span>
              <span className="col-last">최근 출석</span>
            </div>
            {allUsersAttendance.map((u, i) => (
              <div key={i} className="user-attendance-row" onClick={() => setSelectedUser(u)}>
                <div className="col-name">
                  <div className="user-avatar-small">
                    {u.profile_image ? (
                      <img src={getImageUrl(u.profile_image)} alt="" style={{ transform: `scale(${u.profile_zoom || 1})` }} />
                    ) : (
                      <span>{getIconEmoji(u.default_icon)}</span>
                    )}
                  </div>
                  <span>{u.character_name}</span>
                </div>
                <span className="col-count">{u.month_count || 0}일</span>
                <span className="col-streak">{u.current_streak || 0}일</span>
                <span className="col-last">{u.last_check_date ? u.last_check_date.slice(5) : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일반 사용자 뷰 */}
      {(!isAdmin || !showAdminPanel) && (
        <>
          {/* 출석 현황 카드 */}
          <div className="attendance-summary">
            <div className="summary-card main-card">
              <div className="card-icon icon-calendar"></div>
              <div className="card-content">
                <span className="card-value">{monthlyCheckCount}<span className="unit">일</span></span>
                <span className="card-label">이번 달 출석</span>
              </div>
            </div>
            <div className="summary-card streak-card">
              <div className="card-icon icon-streak"></div>
              <div className="card-content">
                <span className="card-value">{stats?.current_streak || 0}<span className="unit">일</span></span>
                <span className="card-label">연속 출석</span>
              </div>
            </div>
            <div className="summary-card record-card">
              <div className="card-icon icon-trophy"></div>
              <div className="card-content">
                <span className="card-value">{stats?.max_streak || 0}<span className="unit">일</span></span>
                <span className="card-label">최고 연속</span>
              </div>
            </div>
            <div className="summary-card total-card">
              <div className="card-icon icon-total"></div>
              <div className="card-content">
                <span className="card-value">{stats?.total_checks || 0}<span className="unit">일</span></span>
                <span className="card-label">누적 출석</span>
              </div>
            </div>
          </div>

          {/* 출석 버튼 */}
          <div className="check-section">
            {isLoggedIn ? (
              todayChecked ? (
                <div className="checked-stamp">
                  <div className="stamp-inner">
                    <div className="stamp-check"></div>
                    <span className="stamp-text">오늘 출석 완료</span>
                    <span className="stamp-date">{todayMonth}.{todayDay}</span>
                  </div>
                </div>
              ) : (
                <button className="check-btn" onClick={handleCheck} disabled={checking}>
                  {checking ? '출석 중...' : '출석체크'}
                </button>
              )
            ) : (
              <button className="check-btn login-required" onClick={() => setPage('login')}>
                로그인하고 출석체크하기
              </button>
            )}
          </div>

          {/* 달력 */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="nav-btn" onClick={prevMonth}>◀</button>
              <div className="month-display">
                <span className="year">{year}년</span>
                <span className="month">{month + 1}월</span>
                {!isCurrentMonth && (
                  <button className="today-btn" onClick={goToCurrentMonth}>오늘</button>
                )}
              </div>
              <button className="nav-btn" onClick={nextMonth}>▶</button>
            </div>

            <div className="calendar-grid">
              <div className="weekday-row">
                {weekDays.map((day, i) => (
                  <div key={i} className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="days-grid">
                {calendarDays.map((item, i) => (
                  <div
                    key={i}
                    className={`day-cell ${!item.isCurrentMonth ? 'empty' : ''} ${item.isToday ? 'today' : ''} ${item.isChecked ? 'checked' : ''} ${item.isPast && !item.isChecked && item.isCurrentMonth ? 'missed' : ''}`}
                  >
                    {item.day && (
                      <>
                        <span className="day-number">{item.day}</span>
                        {item.isChecked && <span className="check-mark">✓</span>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 이번 달 혜택 */}
          <div className="benefits-section">
            <div className="section-header">
              <div className="header-line"></div>
              <h2>{month + 1}월 출석 혜택</h2>
              <div className="header-line"></div>
            </div>
            <div className="benefits-grid">
              {getBenefitStatus(monthlyCheckCount).map((b, i) => (
                <div key={i} className={`benefit-card ${b.achieved ? 'achieved' : ''}`}>
                  <div className="benefit-progress">
                    <svg viewBox="0 0 36 36" className="circular-progress">
                      <path
                        className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle-fill"
                        strokeDasharray={`${Math.min((monthlyCheckCount / b.days) * 100, 100)}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="benefit-days">{b.days}</span>
                  </div>
                  <div className="benefit-info">
                    <span className="benefit-reward">{b.reward || '미정'}</span>
                    {b.achieved && <span className="achieved-mark"></span>}
                  </div>
                </div>
              ))}
              {benefits?.reward_full && (
                <div className={`benefit-card full ${monthlyCheckCount >= daysInMonth ? 'achieved' : ''}`}>
                  <div className="benefit-progress">
                    <svg viewBox="0 0 36 36" className="circular-progress">
                      <path
                        className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle-fill"
                        strokeDasharray={`${Math.min((monthlyCheckCount / daysInMonth) * 100, 100)}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="benefit-days full-text">ALL</span>
                  </div>
                  <div className="benefit-info">
                    <span className="benefit-reward">{benefits.reward_full}</span>
                    {monthlyCheckCount >= daysInMonth && <span className="achieved-mark"></span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 출석 랭킹 (월별) */}
          <div className="ranking-section">
            <div className="section-header">
              <div className="header-line"></div>
              <h2>{month + 1}월 출석왕 TOP 10</h2>
              <div className="header-line"></div>
            </div>
            <div className="ranking-list">
              {ranking.length === 0 ? (
                <div className="empty-message">아직 출석 기록이 없습니다.</div>
              ) : (
                ranking.map((r, i) => (
                  <div key={i} className={`ranking-item rank-${i + 1}`}>
                    <span className={`rank-badge rank-badge-${i + 1}`}>
                      {i < 3 ? '' : i + 1}
                    </span>
                    <div className="rank-user">
                      <ProfileFrame user={r} size="sm">
                        <div className="rank-avatar">
                          {r.profile_image ? (
                            <img src={getImageUrl(r.profile_image)} alt="" style={{ transform: `scale(${r.profile_zoom || 1})` }} />
                          ) : (
                            <span>{getIconEmoji(r.default_icon)}</span>
                          )}
                        </div>
                      </ProfileFrame>
                      <StyledName user={r} showTitle={false} className="rank-name" />
                    </div>
                    <div className="rank-stats">
                      <span className="total">{r.month_checks}<small>일</small></span>
                      <span className="streak"><span className="streak-icon"></span>{r.current_streak}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 혜택 설정 모달 */}
      <Modal isOpen={showBenefitModal} onClose={() => setShowBenefitModal(false)} title={`${benefitForm.year}년 ${benefitForm.month}월 출석 혜택 설정`}>
        <form className="benefit-form" onSubmit={handleSaveBenefits}>
          <div className="form-group">
            <label>5일 출석 보상</label>
            <input
              type="text"
              placeholder="예: 메소 100만"
              value={benefitForm.reward_5}
              onChange={e => setBenefitForm({ ...benefitForm, reward_5: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>10일 출석 보상</label>
            <input
              type="text"
              placeholder="예: 메소 300만"
              value={benefitForm.reward_10}
              onChange={e => setBenefitForm({ ...benefitForm, reward_10: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>15일 출석 보상</label>
            <input
              type="text"
              placeholder="예: 메소 500만"
              value={benefitForm.reward_15}
              onChange={e => setBenefitForm({ ...benefitForm, reward_15: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>20일 출석 보상</label>
            <input
              type="text"
              placeholder="예: 주문의 흔적 100개"
              value={benefitForm.reward_20}
              onChange={e => setBenefitForm({ ...benefitForm, reward_20: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>개근 보상 (선택)</label>
            <input
              type="text"
              placeholder="예: 특별 칭호"
              value={benefitForm.reward_full}
              onChange={e => setBenefitForm({ ...benefitForm, reward_full: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowBenefitModal(false)}>취소</button>
            <button type="submit" className="primary">저장</button>
          </div>
        </form>
      </Modal>

      {/* 유저 상세 모달 */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content user-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedUser.character_name}님의 출석 현황</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="user-attendance-detail">
              <div className="detail-stats">
                <div className="stat-item">
                  <span className="stat-value">{selectedUser.month_count || 0}</span>
                  <span className="stat-label">이번 달</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUser.total_checks || 0}</span>
                  <span className="stat-label">누적</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUser.current_streak || 0}</span>
                  <span className="stat-label">연속</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedUser.max_streak || 0}</span>
                  <span className="stat-label">최고</span>
                </div>
              </div>
              <div className="detail-dates">
                <h4>출석한 날짜</h4>
                <div className="dates-list">
                  {(selectedUser.attendance_dates || []).map((date, i) => (
                    <span key={i} className="date-chip">{date.slice(5)}</span>
                  ))}
                  {(!selectedUser.attendance_dates || selectedUser.attendance_dates.length === 0) && (
                    <span className="no-dates">출석 기록이 없습니다.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

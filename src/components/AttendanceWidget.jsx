import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AttendanceWidget() {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverToday, setServerToday] = useState(null);

  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const res = await api.getAttendanceStats();
      if (res.data?.server_today) setServerToday(res.data.server_today);
      setChecked(!!res.data?.checked_today);
    } catch (e) {
      // 로그인 안된 상태면 무시
    }
  };

  const handleCheck = async () => {
    if (loading || checked) return;
    setLoading(true);
    try {
      await api.checkAttendance();
      setChecked(true);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="attendance-widget">
      <div className="attendance-header">
        <span>📅 출석체크</span>
        <span className="attendance-date">{serverToday ? `${parseInt(serverToday.split('-')[1])}/${parseInt(serverToday.split('-')[2])}` : ''}</span>
      </div>
      {checked ? (
        <div className="attendance-done">
          <span>✓</span>
          <p>출석 완료!</p>
        </div>
      ) : (
        <button
          className="attendance-btn"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? '처리중...' : '출석하기'}
        </button>
      )}
    </div>
  );
}

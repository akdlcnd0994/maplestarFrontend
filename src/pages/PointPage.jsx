import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getImageUrl } from '../services/api';
import { formatDateTime } from '../utils/format';
import StyledName, { ProfileFrame } from '../components/StyledName';
import { getIconEmoji } from '../components/UserAvatar';

const TYPE_LABELS = {
  earn: '획득',
  spend: '사용',
  admin_grant: '지급',
  admin_deduct: '차감',
  refund: '환불',
};

const TYPE_COLORS = {
  earn: '#2e7d32',
  spend: '#c62828',
  admin_grant: '#1565c0',
  admin_deduct: '#e65100',
  refund: '#6a1b9a',
};

export default function PointPage({ setPage }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const [tab, setTab] = useState('overview');
  const [balance, setBalance] = useState(null);
  const [daily, setDaily] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txFilter, setTxFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLoggedIn) {
        const [balRes, dailyRes] = await Promise.all([
          api.getPointBalance(),
          api.getPointDaily(),
        ]);
        setBalance(balRes.data);
        setDaily(dailyRes.data || []);
      }
      const rankRes = await api.getPointRanking(10);
      setRanking(rankRes.data || []);
    } catch (e) {
      setError('데이터를 불러오지 못했습니다.');
    }
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tab === 'history') loadTransactions();
    if (tab === 'ranking') loadRanking();
  }, [tab, txPage, txFilter]);

  const loadTransactions = async () => {
    if (!isLoggedIn) return;
    try {
      const params = { page: txPage, limit: 15 };
      if (txFilter) params.type = txFilter;
      const res = await api.getPointTransactions(params);
      setTransactions(res.data || []);
      setTxTotal(res.meta?.totalPages || 1);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRanking = async () => {
    try {
      const res = await api.getPointRanking(20);
      setRanking(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="page-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
          <h1>운동회 포인트</h1>
        </div>
        <div className="point-login-required">
          <p>포인트 시스템은 로그인 후 이용 가능합니다.</p>
          <button className="point-login-btn" onClick={() => setPage('login')}>로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>운동회 포인트</h1>
      </div>

      {loading && (
        <div className="loading">데이터를 불러오는 중...</div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={loadData}>다시 시도</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 잔액 카드 */}
          <div className="point-balance-card">
            <div className="point-balance-label">내 포인트</div>
            <div className="point-balance-amount">{balance?.balance?.toLocaleString() || 0}<span className="point-unit">P</span></div>
            <div className="point-balance-stats">
              <div className="point-stat">
                <span className="point-stat-label">총 획득</span>
                <span className="point-stat-value point-earned">+{balance?.totalEarned?.toLocaleString() || 0}P</span>
              </div>
              <div className="point-stat">
                <span className="point-stat-label">총 사용</span>
                <span className="point-stat-value point-spent">-{balance?.totalSpent?.toLocaleString() || 0}P</span>
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="point-tabs">
            <button className={`point-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>오늘 현황</button>
            <button className={`point-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>거래 내역</button>
            <button className={`point-tab ${tab === 'ranking' ? 'active' : ''}`} onClick={() => setTab('ranking')}>포인트 랭킹</button>
          </div>

          {/* 오늘 현황 */}
          {tab === 'overview' && (
            <div className="point-daily-grid">
              {daily.length === 0 && <div className="empty-message">오늘의 활동 현황이 없습니다.</div>}
              {daily.map(d => (
                <div key={d.activityType} className={`point-daily-item ${d.todayCount >= d.dailyLimit ? 'maxed' : ''}`}>
                  <div className="point-daily-name">{d.activityName}</div>
                  <div className="point-daily-progress">
                    <div className="point-daily-bar">
                      <div className="point-daily-fill" style={{ width: `${Math.min((d.todayCount / d.dailyLimit) * 100, 100)}%` }}></div>
                    </div>
                    <span className="point-daily-count">{d.todayCount}/{d.dailyLimit}</span>
                  </div>
                  <div className="point-daily-reward">+{d.pointsPerAction}P / 회</div>
                </div>
              ))}
            </div>
          )}

          {/* 거래 내역 */}
          {tab === 'history' && (
            <div className="point-history">
              <div className="point-history-filters">
                <button className={`point-filter ${txFilter === '' ? 'active' : ''}`} onClick={() => { setTxFilter(''); setTxPage(1); }}>전체</button>
                <button className={`point-filter ${txFilter === 'earn' ? 'active' : ''}`} onClick={() => { setTxFilter('earn'); setTxPage(1); }}>획득</button>
                <button className={`point-filter ${txFilter === 'spend' ? 'active' : ''}`} onClick={() => { setTxFilter('spend'); setTxPage(1); }}>사용</button>
              </div>
              <div className="point-transaction-list">
                {transactions.length === 0 && <div className="empty-message">거래 내역이 없습니다.</div>}
                {transactions.map(tx => (
                  <div key={tx.id} className="point-transaction-item">
                    <div className="point-tx-left">
                      <span className="point-tx-type" style={{ color: TYPE_COLORS[tx.type] || '#333' }}>
                        {TYPE_LABELS[tx.type] || tx.type}
                      </span>
                      <span className="point-tx-desc">{tx.description}</span>
                    </div>
                    <div className="point-tx-right">
                      <span className={`point-tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}P
                      </span>
                      <span className="point-tx-date">{formatDateTime(tx.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {txTotal > 1 && (
                <div className="point-pagination">
                  <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>이전</button>
                  <span>{txPage} / {txTotal}</span>
                  <button disabled={txPage >= txTotal} onClick={() => setTxPage(p => p + 1)}>다음</button>
                </div>
              )}
            </div>
          )}

          {/* 랭킹 */}
          {tab === 'ranking' && (
            <div className="point-ranking-list">
              {ranking.length === 0 && <div className="empty-message">아직 랭킹 데이터가 없습니다.</div>}
              {ranking.map((r, i) => (
                <div key={r.user_id} className={`point-ranking-item ${i < 3 ? 'top-' + (i + 1) : ''}`}>
                  <div className="point-rank-num">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                  <ProfileFrame user={r} size="sm">
                    <div className="point-rank-avatar">
                      {r.profile_image ? (
                        <img src={getImageUrl(r.profile_image)} alt="" style={{ transform: `scale(${r.profile_zoom || 1})` }} />
                      ) : (
                        <span>{getIconEmoji(r.default_icon)}</span>
                      )}
                    </div>
                  </ProfileFrame>
                  <div className="point-rank-user">
                    <StyledName user={r} />
                    {r.job && <span className="point-rank-job">{r.job}</span>}
                  </div>
                  <div className="point-rank-points">{r.total_earned?.toLocaleString()}P</div>
                </div>
              ))}
            </div>
          )}

          {/* 교환소 바로가기 */}
          <button className="point-shop-banner" onClick={() => setPage('shop')}>
            <div className="point-shop-banner-text">
              <span className="point-shop-banner-title">포인트 교환소</span>
              <span className="point-shop-banner-desc">포인트로 다양한 상품을 교환하세요</span>
            </div>
            <span className="point-shop-banner-arrow">→</span>
          </button>
        </>
      )}
    </div>
  );
}

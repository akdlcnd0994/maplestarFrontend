import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RoulettePage({ setPage }) {
  const { user, isLoggedIn, checkAuth } = useAuth();
  const [prizes, setPrizes] = useState([]);
  const [spinCost, setSpinCost] = useState(10);
  const [freeSpin, setFreeSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prizeRes = await api.getRoulettePrizes();
      const prizeData = prizeRes.data || prizeRes;
      setPrizes(prizeData.prizes || []);
      setSpinCost(prizeData.spinCost || 10);

      if (isLoggedIn) {
        const [freeRes, historyRes, balRes] = await Promise.all([
          api.getRouletteFreeSpin(),
          api.getRouletteHistory(),
          api.getPointBalance(),
        ]);
        const freeData = freeRes.data || freeRes;
        setFreeSpin(freeData.available || false);
        setHistory((historyRes.data || historyRes) || []);
        setBalance((balRes.data?.balance ?? balRes.balance) || 0);
      }
    } catch (e) {
      setError('데이터를 불러오지 못했습니다.');
    }
    setLoading(false);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  };

  const getRarityLabel = (prize) => {
    if (prize.rarity) return prize.rarity;
    if (prize.probability !== undefined) {
      if (prize.probability <= 1) return '전설';
      if (prize.probability <= 5) return '레어';
      if (prize.probability <= 15) return '희귀';
      return '일반';
    }
    return '';
  };

  const getRarityClass = (prize) => {
    const label = getRarityLabel(prize);
    if (label === '전설') return 'legendary';
    if (label === '레어') return 'rare';
    if (label === '희귀') return 'uncommon';
    return 'common';
  };

  const buildConicGradient = () => {
    if (prizes.length === 0) return 'conic-gradient(#444 0deg 360deg)';
    const segmentAngle = 360 / prizes.length;
    const segments = prizes.map((prize, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;
      const color = prize.color || `hsl(${(i * 360) / prizes.length}, 60%, 45%)`;
      return `${color} ${startAngle}deg ${endAngle}deg`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  };

  const handleSpin = async () => {
    if (spinning || !isLoggedIn) return;
    if (!freeSpin && balance < spinCost) {
      alert('포인트가 부족합니다.');
      return;
    }

    setSpinning(true);
    setResult(null);
    setShowResult(false);

    try {
      const res = await api.spinRoulette();
      const data = res.data || res;
      const prize = data.prize;

      // Find the index of the winning prize
      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      const segmentAngle = 360 / prizes.length;

      // Calculate target angle: we want the winning segment at the top (pointer position)
      // The pointer is at the top (0 degrees / 12 o'clock).
      // Each segment starts at (index * segmentAngle) in the conic gradient.
      // We need the center of the winning segment to be at the top after rotation.
      const segmentCenter = prizeIndex * segmentAngle + segmentAngle / 2;
      // To bring segmentCenter to the top (0 deg), we rotate by (360 - segmentCenter)
      // Add multiple full rotations for visual effect (5-8 full spins)
      const fullSpins = 5 + Math.floor(Math.random() * 3);
      const targetRotation = rotation + fullSpins * 360 + (360 - segmentCenter) - (rotation % 360);

      setRotation(targetRotation);

      // Wait for animation to complete (4 seconds CSS transition)
      setTimeout(() => {
        setResult({
          prize,
          isFree: data.isFree,
          rewardAmount: data.rewardAmount,
          newBalance: data.newBalance,
        });
        setBalance(data.newBalance ?? balance);
        setFreeSpin(false);
        setShowResult(true);
        setSpinning(false);

        // Refresh auth to update point balance in header
        checkAuth();

        // Reload history
        api.getRouletteHistory().then(histRes => {
          setHistory((histRes.data || histRes) || []);
        }).catch(() => {});

        // Check for new free spin
        api.getRouletteFreeSpin().then(freeRes => {
          const fd = freeRes.data || freeRes;
          setFreeSpin(fd.available || false);
        }).catch(() => {});
      }, 4200);

    } catch (e) {
      alert(e.message || '스핀에 실패했습니다.');
      setSpinning(false);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="roulette-page">
        <div className="roulette-header">
          <button className="back-btn" onClick={() => setPage('point')}>← 돌아가기</button>
          <h1>포인트 룰렛</h1>
        </div>
        <div className="login-required-message">
          <div className="lock-icon">■</div>
          <h2>로그인이 필요합니다</h2>
          <p>포인트 룰렛은 길드원만 이용할 수 있습니다.</p>
          <button className="login-btn" onClick={() => setPage('login')}>로그인하기</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="roulette-page">
        <div className="roulette-header">
          <button className="back-btn" onClick={() => setPage('point')}>← 돌아가기</button>
          <h1>포인트 룰렛</h1>
        </div>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roulette-page">
        <div className="roulette-header">
          <button className="back-btn" onClick={() => setPage('point')}>← 돌아가기</button>
          <h1>포인트 룰렛</h1>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={loadData}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="roulette-page">
      <div className="roulette-header">
        <button className="back-btn" onClick={() => setPage('point')}>← 돌아가기</button>
        <h1>포인트 룰렛</h1>
      </div>

      <div className="roulette-content">
        {/* Balance Display */}
        <div className="roulette-balance">
          <span className="roulette-balance-label">내 포인트</span>
          <span className="roulette-balance-amount">{balance.toLocaleString()}P</span>
        </div>

        {/* Wheel Section */}
        <div className="roulette-wheel-container">
          <div className="roulette-pointer">▼</div>
          <div
            className="roulette-wheel"
            style={{
              background: buildConicGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
            }}
          >
            {prizes.map((prize, i) => {
              const segmentAngle = 360 / prizes.length;
              const angle = i * segmentAngle + segmentAngle / 2;
              const radians = (angle - 90) * (Math.PI / 180);
              const labelRadius = 38;
              const x = 50 + labelRadius * Math.cos(radians);
              const y = 50 + labelRadius * Math.sin(radians);
              return (
                <div
                  key={prize.id || i}
                  className="roulette-segment-label"
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    fontSize: prizes.length > 8 ? '10px' : '12px',
                  }}
                >
                  {prize.icon || ''}
                </div>
              );
            })}
            <div className="roulette-wheel-center">
              <span>{spinning ? '...' : 'SPIN'}</span>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          className={`roulette-spin-btn ${freeSpin ? 'free' : ''}`}
          onClick={handleSpin}
          disabled={spinning}
        >
          {spinning
            ? '돌리는 중...'
            : freeSpin
              ? '무료 스핀!'
              : `${spinCost}P 스핀`
          }
        </button>

        {/* Prize List */}
        <div className="roulette-prize-list">
          <h3>상품 목록</h3>
          {prizes.map((prize, i) => (
            <div key={prize.id || i} className="roulette-prize-item">
              <div className="roulette-prize-icon" style={{ color: prize.color || '#ccc' }}>
                {prize.icon || '★'}
              </div>
              <div className="roulette-prize-info">
                <span className="roulette-prize-name">{prize.name}</span>
                {prize.value !== undefined && (
                  <span className="roulette-prize-value">
                    {prize.type === 'point' ? `+${prize.value}P` : prize.value}
                  </span>
                )}
              </div>
              <span className={`roulette-prize-rarity ${getRarityClass(prize)}`}>
                {getRarityLabel(prize)}
              </span>
            </div>
          ))}
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="roulette-history">
            <h3>최근 기록</h3>
            {history.map((item, i) => (
              <div key={item.id || i} className="roulette-history-item">
                <div className="roulette-history-left">
                  <span className="roulette-history-name">
                    {item.prize_name || '알 수 없음'}
                  </span>
                </div>
                <div className="roulette-history-right">
                  {item.prize_type === 'points' && (
                    <span className="roulette-history-reward">
                      +{item.prize_value}P
                    </span>
                  )}
                  {item.prize_type === 'hatch_bonus' && (
                    <span className="roulette-history-reward hatch">
                      +{item.prize_value}회
                    </span>
                  )}
                  {item.is_free ? (
                    <span className="roulette-history-free">무료</span>
                  ) : (
                    <span className="roulette-history-cost">-{item.spin_cost}P</span>
                  )}
                  <span className="roulette-history-time">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Overlay */}
      {showResult && result && (
        <div className="roulette-result-overlay" onClick={closeResult}>
          <div className="roulette-result-card" onClick={(e) => e.stopPropagation()}>
            <div
              className="roulette-result-icon"
              style={{ color: result.prize.color || '#ffd700' }}
            >
              {result.prize.icon || '★'}
            </div>
            <div className="roulette-result-name">{result.prize.name}</div>
            {result.rewardAmount !== undefined && (
              <div className="roulette-result-reward">
                +{result.rewardAmount}P 획득!
              </div>
            )}
            {result.isFree && (
              <div className="roulette-result-free-tag">무료 스핀</div>
            )}
            <div className="roulette-result-balance">
              잔여 포인트: {(result.newBalance ?? balance).toLocaleString()}P
            </div>
            <button className="roulette-result-close-btn" onClick={closeResult}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

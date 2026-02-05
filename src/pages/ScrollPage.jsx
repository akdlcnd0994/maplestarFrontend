import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// 노가다 목장갑 아이템
const WORK_GLOVE = {
  id: 1,
  name: '노가다 목장갑',
  slots: 5,
  atk: 0,
  catId: 'glove',
};

// 주문서 이미지 경로
const SCROLL_IMAGES = {
  10: '/scroll/10percent.png',
  50: '/scroll/50percent.png',
  60: '/scroll/60percent.png',
  100: '/scroll/100percent.png',
};

// 장갑 공격력 주문서
const GLOVE_SCROLLS = [
  { id: 'atk10', name: '공격력 주문서 10%', rate: 10, value: 3 },
  { id: 'atk50', name: '공격력 주문서 50%', rate: 50, value: 2 },
  { id: 'atk60', name: '공격력 주문서 60%', rate: 60, value: 2 },
  { id: 'atk100', name: '공격력 주문서 100%', rate: 100, value: 1 },
];

// 소리 재생 함수 (연타 지원)
const playSound = (src, volume = 0.5) => {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
};

export default function ScrollPage({ setPage }) {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState('glove'); // glove, potential, white, chaos
  const [showCompetition, setShowCompetition] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('simulatorVolume');
    return saved ? parseFloat(saved) : 0.3;
  });

  // 음량 변경 시 localStorage에 저장
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    localStorage.setItem('simulatorVolume', newVolume.toString());
  };

  // 경쟁 모드 화면 (로그인 필요)
  if (showCompetition) {
    if (!isLoggedIn) {
      return (
        <div className="page-content">
          <div className="page-header">
            <button className="back-btn" onClick={() => setShowCompetition(false)}>← 돌아가기</button>
            <h1>경쟁 모드</h1>
          </div>
          <div className="login-required-message">
            <div className="lock-icon">■</div>
            <h2>로그인이 필요합니다</h2>
            <p>경쟁 모드는 부화기 주문서를 사용하므로 로그인이 필요합니다.</p>
            <button className="login-btn" onClick={() => setPage('login')}>로그인하기</button>
          </div>
        </div>
      );
    }
    return <CompetitionMode onBack={() => setShowCompetition(false)} volume={volume} setVolume={handleVolumeChange} />;
  }

  return (
    <div className="page-content scroll-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>주문서 시뮬레이터</h1>
        <div className="volume-control">
          <span className="volume-icon">{volume === 0 ? '🔇' : '🔉'}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* 경쟁 모드 배너 */}
      <div className="competition-mode-banner" onClick={() => setShowCompetition(true)}>
        <div className="banner-content">
          <span className="ranked-badge">RANKED</span>
          <span className="banner-title">경쟁 모드</span>
          <span className="banner-desc">부화기 주문서로 랭킹 경쟁</span>
        </div>
        <span className="banner-arrow">→</span>
      </div>

      {/* 탭 메뉴 */}
      <div className="scroll-tabs">
        <button
          className={`scroll-tab ${activeTab === 'glove' ? 'active' : ''}`}
          onClick={() => setActiveTab('glove')}
        >
          노가다 목장갑
        </button>
        <button
          className={`scroll-tab ${activeTab === 'potential' ? 'active' : ''}`}
          onClick={() => setActiveTab('potential')}
        >
          잠재/각인
        </button>
        <button
          className={`scroll-tab ${activeTab === 'white' ? 'active' : ''}`}
          onClick={() => setActiveTab('white')}
        >
          백줌
        </button>
        <button
          className={`scroll-tab ${activeTab === 'chaos' ? 'active' : ''}`}
          onClick={() => setActiveTab('chaos')}
        >
          이노센트/혼줌
        </button>
      </div>

      {activeTab === 'glove' && <GloveSimulator volume={volume} />}
      {activeTab === 'potential' && <PotentialSimulator volume={volume} />}
      {activeTab === 'white' && <WhiteScrollSimulator volume={volume} />}
      {activeTab === 'chaos' && <ChaosScrollSimulator volume={volume} />}
    </div>
  );
}

// 노가다 목장갑 시뮬레이터 (기존)
function GloveSimulator({ volume = 0.5 }) {
  const { isLoggedIn } = useAuth();
  const [slots, setSlots] = useState(WORK_GLOVE.slots);
  const [usedSlots, setUsedSlots] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [addedStat, setAddedStat] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const res = await api.getScrollRankings();
      setRankings(res.data || []);
    } catch (e) {
      console.error('Failed to load rankings:', e);
    }
  };

  const applyScroll = (scroll) => {
    if (slots <= 0) return;

    const success = Math.random() * 100 < scroll.rate;

    if (success) {
      playSound('/sounds/success.mp3', volume);
      setSuccessCount(prev => prev + 1);
      setAddedStat(prev => prev + scroll.value);
      setHistory(prev => [...prev, { scroll: scroll.name, success: true, value: scroll.value }]);
      setLastResult({ success: true, value: scroll.value });
    } else {
      playSound('/sounds/fail.mp3', volume);
      setFailCount(prev => prev + 1);
      setHistory(prev => [...prev, { scroll: scroll.name, success: false, value: 0 }]);
      setLastResult({ success: false, value: 0 });
    }
    setSlots(prev => prev - 1);
    setUsedSlots(prev => prev + 1);
  };

  const resetSimulator = () => {
    setSlots(WORK_GLOVE.slots);
    setUsedSlots(0);
    setSuccessCount(0);
    setFailCount(0);
    setAddedStat(0);
    setHistory([]);
    setLastResult(null);
    setSaved(false);
  };

  const saveRecord = async () => {
    if (!isLoggedIn || successCount === 0 || saved) return;

    setIsSaving(true);
    try {
      await api.saveScrollRecord({
        item_id: WORK_GLOVE.id,
        item_name: WORK_GLOVE.name,
        success_count: successCount,
        fail_count: failCount,
        total_stat: addedStat,
        stat_type: 'atk',
      });
      setSaved(true);
      loadRankings();
    } catch (e) {
      console.error('Failed to save record:', e);
      alert('기록 저장에 실패했습니다.');
    }
    setIsSaving(false);
  };

  return (
    <div className="scroll-simulator-layout">
      {/* 왼쪽: 시뮬레이터 */}
      <div className="simulator-main">
        {/* 아이템 영역 */}
        <div className="item-display-area">
          <div className="item-box">
            <img src="/scroll/item.png" alt="노가다 목장갑" className="item-img" />
            {lastResult && (
              <img
                src={lastResult.success ? '/scroll/success-150.gif' : '/scroll/failure-150.gif'}
                alt={lastResult.success ? '성공' : '실패'}
                className="result-overlay"
                key={Date.now()}
              />
            )}
          </div>
          <div className="item-info-box">
            <h2>{WORK_GLOVE.name}</h2>
            <div className="stat-display">
              <span className="stat-name">공격력</span>
              <span className="stat-value">+{addedStat}</span>
            </div>
          </div>
        </div>

        {/* 슬롯 표시 */}
        <div className="slots-area">
          <div className="slots-grid">
            {[...Array(WORK_GLOVE.slots)].map((_, i) => (
              <div
                key={i}
                className={`slot-box ${i < usedSlots ? (history[i]?.success ? 'success' : 'fail') : ''}`}
              >
                {i < usedSlots ? (history[i]?.success ? '✓' : '✗') : ''}
              </div>
            ))}
          </div>
          <div className="slots-text">
            남은 슬롯: <strong>{slots}</strong> / {WORK_GLOVE.slots}
          </div>
        </div>

        {/* 결과 통계 */}
        <div className="result-stats-area">
          <div className="stat-item success">
            <span className="label">성공</span>
            <span className="value">{successCount}</span>
          </div>
          <div className="stat-item fail">
            <span className="label">실패</span>
            <span className="value">{failCount}</span>
          </div>
          <div className="stat-item total">
            <span className="label">공격력</span>
            <span className="value">+{addedStat}</span>
          </div>
        </div>

        {/* 주문서 버튼들 */}
        <div className="scroll-buttons-area">
          {GLOVE_SCROLLS.map(scroll => (
            <button
              key={scroll.id}
              className={`scroll-button ${slots <= 0 ? 'disabled' : ''}`}
              onClick={() => applyScroll(scroll)}
              disabled={slots <= 0}
            >
              <img src={SCROLL_IMAGES[scroll.rate]} alt={scroll.name} className="scroll-img" />
              <div className="scroll-text">
                <span className="scroll-name">{scroll.rate}% 주문서</span>
                <span className="scroll-value">+{scroll.value} 공격력</span>
              </div>
            </button>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="action-buttons">
          <button className="reset-button" onClick={resetSimulator}>
            <img src="/scroll/reset.png" alt="" className="reset-icon" />
            초기화
          </button>
          {slots === 0 && successCount > 0 && !saved && isLoggedIn && (
            <button className="save-button" onClick={saveRecord} disabled={isSaving}>
              {isSaving ? '저장 중...' : '기록 등록'}
            </button>
          )}
          {saved && <span className="saved-text">✓ 기록 저장됨</span>}
        </div>

        {/* 히스토리 */}
        {history.length > 0 && (
          <div className="history-area">
            <h4>기록</h4>
            <div className="history-items">
              {history.map((h, i) => (
                <span key={i} className={`history-badge ${h.success ? 'success' : 'fail'}`}>
                  {h.success ? `+${h.value}` : '✗'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 오른쪽: 랭킹 */}
      <div className="scroll-ranking-area">
        <h3>◆ 랭킹</h3>
        {rankings.length === 0 ? (
          <div className="no-ranking">
            <p>아직 기록이 없습니다</p>
          </div>
        ) : (
          <div className="ranking-list">
            {rankings.slice(0, 20).map((record, i) => (
              <div key={record.id} className={`ranking-row ${i < 3 ? `top-${i + 1}` : ''}`}>
                <span className="rank-num">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span className="rank-name">{record.character_name}</span>
                <span className="rank-score">+{record.total_stat}</span>
                <span className="rank-detail">{record.success_count}성공 {record.fail_count}실패</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 잠재/각인 시뮬레이터 (신규)
function PotentialSimulator({ volume = 0.5 }) {
  const [itemAlive, setItemAlive] = useState(true);
  const [ignoreDestroy, setIgnoreDestroy] = useState(false); // 파괴 무시 모드
  const [stats, setStats] = useState({
    potential60: { success: 0, fail: 0, destroy: 0, attempts: 0 },
    potential80: { success: 0, fail: 0, destroy: 0, attempts: 0 },
    silver: { success: 0, fail: 0, destroy: 0, attempts: 0 },
    gold: { success: 0, fail: 0, destroy: 0, attempts: 0 },
  });
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [showDestroyEffect, setShowDestroyEffect] = useState(false);

  // 결과 표시 함수 (GIF 애니메이션 보장 - 매번 고유 키 생성)
  const showResult = (result) => {
    setLastResult({ result, key: Date.now() });
  };

  // 에디셔널 잠재능력 부여 주문서 60%: 성공 60%, 실패 시 100% 파괴
  const applyPotential60 = () => {
    if (!itemAlive && !ignoreDestroy) return;
    const success = Math.random() * 100 < 60;

    if (success) {
      playSound('/sounds/success.mp3', volume);
      setStats(prev => ({
        ...prev,
        potential60: { ...prev.potential60, success: prev.potential60.success + 1, attempts: prev.potential60.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential60', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      playSound('/sounds/destroy.mp3', volume);
      setStats(prev => ({
        ...prev,
        potential60: { ...prev.potential60, fail: prev.potential60.fail + 1, destroy: prev.potential60.destroy + 1, attempts: prev.potential60.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential60', result: 'destroy' }]);
      showResult('destroy');
      if (!ignoreDestroy) {
        setItemAlive(false);
        setShowDestroyEffect(true);
        setTimeout(() => setShowDestroyEffect(false), 1500);
      }
    }
  };

  // 에디셔널 잠재능력 부여 주문서 80%: 성공 80%, 실패 시 100% 파괴
  const applyPotential80 = () => {
    if (!itemAlive && !ignoreDestroy) return;
    const success = Math.random() * 100 < 80;

    if (success) {
      playSound('/sounds/success.mp3', volume);
      setStats(prev => ({
        ...prev,
        potential80: { ...prev.potential80, success: prev.potential80.success + 1, attempts: prev.potential80.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential80', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      playSound('/sounds/destroy.mp3', volume);
      setStats(prev => ({
        ...prev,
        potential80: { ...prev.potential80, fail: prev.potential80.fail + 1, destroy: prev.potential80.destroy + 1, attempts: prev.potential80.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential80', result: 'destroy' }]);
      showResult('destroy');
      if (!ignoreDestroy) {
        setItemAlive(false);
        setShowDestroyEffect(true);
        setTimeout(() => setShowDestroyEffect(false), 1500);
      }
    }
  };

  // 은빛 에디셔널 각인의 인장: 성공 50%, 실패 시 50% 파괴
  const applySilverStamp = () => {
    if (!itemAlive && !ignoreDestroy) return;
    const success = Math.random() * 100 < 50;

    if (success) {
      playSound('/sounds/success.mp3', volume);
      setStats(prev => ({
        ...prev,
        silver: { ...prev.silver, success: prev.silver.success + 1, attempts: prev.silver.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'silver', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      const destroyed = Math.random() * 100 < 50;
      if (destroyed) {
        playSound('/sounds/destroy.mp3', volume);
        setStats(prev => ({
          ...prev,
          silver: { ...prev.silver, fail: prev.silver.fail + 1, destroy: prev.silver.destroy + 1, attempts: prev.silver.attempts + 1 }
        }));
        setHistory(prev => [...prev, { type: 'silver', result: 'destroy' }]);
        showResult('destroy');
        if (!ignoreDestroy) {
          setItemAlive(false);
          setShowDestroyEffect(true);
          setTimeout(() => setShowDestroyEffect(false), 1500);
        }
      } else {
        playSound('/sounds/fail.mp3', volume);
        setStats(prev => ({
          ...prev,
          silver: { ...prev.silver, fail: prev.silver.fail + 1, attempts: prev.silver.attempts + 1 }
        }));
        setHistory(prev => [...prev, { type: 'silver', result: 'fail' }]);
        showResult('fail');
      }
    }
  };

  // 금빛 에디셔널 각인의 인장: 성공 80%, 실패 시 20% 파괴
  const applyGoldStamp = () => {
    if (!itemAlive && !ignoreDestroy) return;
    const success = Math.random() * 100 < 80;

    if (success) {
      playSound('/sounds/success.mp3', volume);
      setStats(prev => ({
        ...prev,
        gold: { ...prev.gold, success: prev.gold.success + 1, attempts: prev.gold.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'gold', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      const destroyed = Math.random() * 100 < 20;
      if (destroyed) {
        playSound('/sounds/destroy.mp3', volume);
        setStats(prev => ({
          ...prev,
          gold: { ...prev.gold, fail: prev.gold.fail + 1, destroy: prev.gold.destroy + 1, attempts: prev.gold.attempts + 1 }
        }));
        setHistory(prev => [...prev, { type: 'gold', result: 'destroy' }]);
        showResult('destroy');
        if (!ignoreDestroy) {
          setItemAlive(false);
          setShowDestroyEffect(true);
          setTimeout(() => setShowDestroyEffect(false), 1500);
        }
      } else {
        playSound('/sounds/fail.mp3', volume);
        setStats(prev => ({
          ...prev,
          gold: { ...prev.gold, fail: prev.gold.fail + 1, attempts: prev.gold.attempts + 1 }
        }));
        setHistory(prev => [...prev, { type: 'gold', result: 'fail' }]);
        showResult('fail');
      }
    }
  };

  const resetSimulator = () => {
    setItemAlive(true);
    setStats({
      potential60: { success: 0, fail: 0, destroy: 0, attempts: 0 },
      potential80: { success: 0, fail: 0, destroy: 0, attempts: 0 },
      silver: { success: 0, fail: 0, destroy: 0, attempts: 0 },
      gold: { success: 0, fail: 0, destroy: 0, attempts: 0 },
    });
    setHistory([]);
    setLastResult(null);
    setShowDestroyEffect(false);
  };

  const totalAttempts = stats.potential60.attempts + stats.potential80.attempts + stats.silver.attempts + stats.gold.attempts;
  const totalSuccess = stats.potential60.success + stats.potential80.success + stats.silver.success + stats.gold.success;
  const totalDestroy = stats.potential60.destroy + stats.potential80.destroy + stats.silver.destroy + stats.gold.destroy;

  const getHistoryLabel = (type) => {
    switch(type) {
      case 'potential60': return '60';
      case 'potential80': return '80';
      case 'silver': return '은';
      case 'gold': return '금';
      default: return '';
    }
  };

  return (
    <div className="potential-simulator">
      <div className="potential-main">
        {/* 아이템 영역 */}
        <div className="potential-item-area">
          <div className={`potential-item-box ${!itemAlive && !ignoreDestroy ? 'destroyed' : ''} ${showDestroyEffect ? 'destroy-animation' : ''}`}>
            <img src="/scroll/item.png" alt="아이템" className="potential-item-img" />
            {!itemAlive && !ignoreDestroy && <div className="destroy-overlay">파괴</div>}
            {lastResult && (
              <img
                src={lastResult.result === 'success' ? '/scroll/success-150.gif' : '/scroll/failure-150.gif'}
                alt={lastResult.result === 'success' ? '성공' : '실패'}
                className="result-gif-overlay"
                key={`result-${lastResult.key}`}
              />
            )}
          </div>
          <div className="potential-item-label">
            {itemAlive || ignoreDestroy ? '장비 아이템' : '파괴됨'}
          </div>
        </div>

        {/* 연속 모드 체크박스 */}
        <div className="ignore-destroy-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={ignoreDestroy}
              onChange={(e) => {
                setIgnoreDestroy(e.target.checked);
                if (e.target.checked && !itemAlive) {
                  setItemAlive(true);
                }
              }}
            />
            <span className="checkbox-text">파괴 무시 (연속 시뮬레이션)</span>
          </label>
          <span className="checkbox-desc">체크 시 파괴되어도 계속 진행, 통계 유지</span>
        </div>

        {/* 에디셔널 잠재능력 부여 주문서 섹션 */}
        <div className="scroll-section">
          <div className="section-header">
            <div className="section-title">에디셔널 잠재능력 부여 주문서</div>
            <div className="section-warning">실패 시 100% 확률로 아이템 파괴</div>
          </div>
          <div className="scroll-btn-row">
            <button
              className={`potential-scroll-btn type-potential ${!itemAlive ? 'disabled' : ''}`}
              onClick={applyPotential60}
              disabled={!itemAlive}
            >
              <img src="/scroll/potential-scroll.png" alt="" className="scroll-btn-img" />
              <div className="btn-text-area">
                <span className="btn-title">에디셔널 잠재능력 부여 주문서 60%</span>
                <span className="btn-sub">성공 60% / 실패 시 파괴</span>
              </div>
            </button>
            <button
              className={`potential-scroll-btn type-potential ${!itemAlive ? 'disabled' : ''}`}
              onClick={applyPotential80}
              disabled={!itemAlive}
            >
              <img src="/scroll/potential-scroll.png" alt="" className="scroll-btn-img" />
              <div className="btn-text-area">
                <span className="btn-title">에디셔널 잠재능력 부여 주문서 80%</span>
                <span className="btn-sub">성공 80% / 실패 시 파괴</span>
              </div>
            </button>
          </div>
        </div>

        {/* 에디셔널 각인의 인장 섹션 */}
        <div className="scroll-section">
          <div className="section-header">
            <div className="section-title">에디셔널 각인의 인장</div>
          </div>
          <div className="scroll-btn-row">
            <button
              className={`potential-scroll-btn type-silver ${!itemAlive ? 'disabled' : ''}`}
              onClick={applySilverStamp}
              disabled={!itemAlive}
            >
              <img src="/scroll/stamp-silver.png" alt="" className="scroll-btn-img" />
              <div className="btn-text-area">
                <span className="btn-title">은빛 에디셔널 각인의 인장</span>
                <span className="btn-sub">성공 50% / 실패 시 50% 파괴</span>
              </div>
            </button>
            <button
              className={`potential-scroll-btn type-gold ${!itemAlive ? 'disabled' : ''}`}
              onClick={applyGoldStamp}
              disabled={!itemAlive}
            >
              <img src="/scroll/stamp-gold.png" alt="" className="scroll-btn-img" />
              <div className="btn-text-area">
                <span className="btn-title">금빛 에디셔널 각인의 인장</span>
                <span className="btn-sub">성공 80% / 실패 시 20% 파괴</span>
              </div>
            </button>
          </div>
        </div>

        {/* 결과 통계 */}
        <div className="potential-stats-area">
          <h4>통계</h4>
          <div className="stats-grid-4">
            <div className="stats-section mini">
              <div className="stats-title">부여 60%</div>
              <div className="stats-row"><span>시도</span><span>{stats.potential60.attempts}</span></div>
              <div className="stats-row"><span>성공</span><span className="success">{stats.potential60.success}</span></div>
              <div className="stats-row"><span>파괴</span><span className="danger">{stats.potential60.destroy}</span></div>
            </div>
            <div className="stats-section mini">
              <div className="stats-title">부여 80%</div>
              <div className="stats-row"><span>시도</span><span>{stats.potential80.attempts}</span></div>
              <div className="stats-row"><span>성공</span><span className="success">{stats.potential80.success}</span></div>
              <div className="stats-row"><span>파괴</span><span className="danger">{stats.potential80.destroy}</span></div>
            </div>
            <div className="stats-section mini">
              <div className="stats-title">은빛 인장</div>
              <div className="stats-row"><span>시도</span><span>{stats.silver.attempts}</span></div>
              <div className="stats-row"><span>성공</span><span className="success">{stats.silver.success}</span></div>
              <div className="stats-row"><span>실패</span><span className="warning">{stats.silver.fail - stats.silver.destroy}</span></div>
              <div className="stats-row"><span>파괴</span><span className="danger">{stats.silver.destroy}</span></div>
            </div>
            <div className="stats-section mini">
              <div className="stats-title">금빛 인장</div>
              <div className="stats-row"><span>시도</span><span>{stats.gold.attempts}</span></div>
              <div className="stats-row"><span>성공</span><span className="success">{stats.gold.success}</span></div>
              <div className="stats-row"><span>실패</span><span className="warning">{stats.gold.fail - stats.gold.destroy}</span></div>
              <div className="stats-row"><span>파괴</span><span className="danger">{stats.gold.destroy}</span></div>
            </div>
          </div>

          <div className="total-stats">
            <div className="total-row">
              <span>총 시도</span>
              <strong>{totalAttempts}회</strong>
            </div>
            <div className="total-row">
              <span>총 성공</span>
              <strong className="success">{totalSuccess}회</strong>
            </div>
            <div className="total-row">
              <span>총 파괴</span>
              <strong className="danger">{totalDestroy}회</strong>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="potential-actions">
          <button className="reset-button" onClick={resetSimulator}>
            {itemAlive ? '통계 초기화' : '다시 시작'}
          </button>
        </div>

        {/* 히스토리 */}
        {history.length > 0 && (
          <div className="potential-history">
            <h4>기록 (최근 30개)</h4>
            <div className="history-badges">
              {history.slice(-30).map((h, i) => (
                <span
                  key={i}
                  className={`history-badge ${h.type} ${h.result}`}
                >
                  {getHistoryLabel(h.type)}
                  {h.result === 'success' ? '✓' : h.result === 'fail' ? '✗' : '×'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// 백줌 시뮬레이터
// ========================================
function WhiteScrollSimulator({ volume = 0.5 }) {
  const [slots, setSlots] = useState([false, false, false, false, false]); // false = 실패 슬롯
  const [stats, setStats] = useState({
    success: 0,
    fail: 0,
    total: 0,
    white10: { success: 0, fail: 0, total: 0 },
    white20: { success: 0, fail: 0, total: 0 },
  });

  const recoveredCount = slots.filter(s => s).length;
  const allRecovered = recoveredCount === 5;

  const useWhiteScroll = (percent) => {
    if (allRecovered) return;

    const success = Math.random() * 100 < percent;
    const key = percent === 10 ? 'white10' : 'white20';

    setStats(prev => ({
      ...prev,
      success: prev.success + (success ? 1 : 0),
      fail: prev.fail + (success ? 0 : 1),
      total: prev.total + 1,
      [key]: {
        success: prev[key].success + (success ? 1 : 0),
        fail: prev[key].fail + (success ? 0 : 1),
        total: prev[key].total + 1,
      },
    }));

    if (success) {
      // 실패 슬롯 중 첫 번째를 복구
      setSlots(prev => {
        const newSlots = [...prev];
        const failIdx = newSlots.findIndex(s => !s);
        if (failIdx !== -1) {
          newSlots[failIdx] = true;
        }
        return newSlots;
      });
      playSound('/sounds/success.mp3', volume);
    } else {
      playSound('/sounds/fail.mp3', volume);
    }
  };

  const reset = () => {
    setSlots([false, false, false, false, false]);
    setStats({
      success: 0,
      fail: 0,
      total: 0,
      white10: { success: 0, fail: 0, total: 0 },
      white20: { success: 0, fail: 0, total: 0 },
    });
  };

  return (
    <div className="white-scroll-simulator">
      <div className="white-scroll-content">
        {/* 아이템 영역 */}
        <div className="white-item-area">
          <img src="/scroll/item.png" alt="아이템" className="white-item-img" />
          <div className="white-item-status">
            {allRecovered ? '모든 슬롯 복구 완료!' : `${5 - recoveredCount}개 슬롯 복구 필요`}
          </div>
        </div>

        {/* 슬롯 상태 */}
        <div className="white-slots">
          <div className="white-slot-icons">
            {slots.map((recovered, i) => (
              <span key={i} className={`white-slot ${recovered ? 'recovered' : 'failed'}`}>
                {recovered ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="white-slot-count">
            복구된 슬롯: <strong>{recoveredCount}</strong> / 5
          </div>
        </div>

        {/* 통계 */}
        <div className="white-stats">
          <div className="white-stat-item">
            <span className="label">성공</span>
            <span className="value success">{stats.success}</span>
          </div>
          <div className="white-stat-item">
            <span className="label">실패</span>
            <span className="value fail">{stats.fail}</span>
          </div>
          <div className="white-stat-item">
            <span className="label">시도</span>
            <span className="value">{stats.total}</span>
          </div>
        </div>

        {/* 주문서 버튼 */}
        <div className="white-scroll-buttons">
          <button
            className="white-scroll-btn"
            onClick={() => useWhiteScroll(10)}
            disabled={allRecovered}
          >
            <img src="/scroll/white-scroll.png" alt="백의 주문서 10%" />
            <div className="scroll-info">
              <span className="scroll-name">백의 주문서 10%</span>
              <span className="scroll-rate">성공률 10%</span>
            </div>
          </button>
          <button
            className="white-scroll-btn"
            onClick={() => useWhiteScroll(20)}
            disabled={allRecovered}
          >
            <img src="/scroll/white-scroll.png" alt="백의 주문서 20%" />
            <div className="scroll-info">
              <span className="scroll-name">백의 주문서 20%</span>
              <span className="scroll-rate">성공률 20%</span>
            </div>
          </button>
        </div>

        {/* 주문서별 통계 */}
        <div className="white-scroll-stats">
          <div className="white-scroll-stat-row">
            <span className="stat-label">10% 백줌</span>
            <span className="stat-detail">
              시도 <strong>{stats.white10.total}</strong>
            </span>
            <span className="stat-detail success">
              성공 <strong>{stats.white10.success}</strong>
            </span>
            <span className="stat-detail fail">
              실패 <strong>{stats.white10.fail}</strong>
            </span>
          </div>
          <div className="white-scroll-stat-row">
            <span className="stat-label">20% 백줌</span>
            <span className="stat-detail">
              시도 <strong>{stats.white20.total}</strong>
            </span>
            <span className="stat-detail success">
              성공 <strong>{stats.white20.success}</strong>
            </span>
            <span className="stat-detail fail">
              실패 <strong>{stats.white20.fail}</strong>
            </span>
          </div>
        </div>

        {/* 초기화 버튼 */}
        <button className="white-reset-btn" onClick={reset}>
          초기화 (5실패로 리셋)
        </button>
      </div>
    </div>
  );
}

// ========================================
// 이노센트/혼줌 시뮬레이터
// ========================================
const CHAOS_BASE_STATS = {
  atk: 5,
  matk: 5,
  str: 5,
  dex: 5,
  int: 5,
  luk: 5,
};

function ChaosScrollSimulator({ volume = 0.5 }) {
  const { isLoggedIn } = useAuth();
  const [upgradeCount, setUpgradeCount] = useState(5);
  const [stats, setStats] = useState({ ...CHAOS_BASE_STATS });
  const [statChanges, setStatChanges] = useState({ atk: 0, matk: 0, str: 0, dex: 0, int: 0, luk: 0 }); // 변화량 추적
  const [remainingSlots, setRemainingSlots] = useState(5);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [rankings, setRankings] = useState({ atk: [], matk: [] });
  const [rankingUpgrade, setRankingUpgrade] = useState(5);
  const [history, setHistory] = useState([]); // 사용 기록
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 인벤토리 (부화기에서 얻은 주문서)
  const [inventory, setInventory] = useState({
    innocent: 5,
    chaos: 5,
    amazingChaos: 1,
    white5: 5,
    white10: 3,
    white20: 3,
  });

  useEffect(() => {
    loadRankings(rankingUpgrade);
  }, [rankingUpgrade]);

  const loadRankings = async (upgrade) => {
    try {
      const [atkRes, matkRes] = await Promise.all([
        api.getChaosRankings({ limit: 5, statType: 'atk', upgradeCount: upgrade }),
        api.getChaosRankings({ limit: 5, statType: 'matk', upgradeCount: upgrade }),
      ]);
      setRankings({
        atk: atkRes.data || [],
        matk: matkRes.data || [],
      });
    } catch (e) {
      console.error('Failed to load chaos rankings:', e);
    }
  };

  const resetItem = () => {
    setStats({ ...CHAOS_BASE_STATS });
    setStatChanges({ atk: 0, matk: 0, str: 0, dex: 0, int: 0, luk: 0 });
    setRemainingSlots(upgradeCount);
    setSuccessCount(0);
    setFailCount(0);
    setHistory([]);
    setIsSaved(false);
    // 인벤토리도 초기화 (이노센트/혼줌은 업그레이드 횟수만큼, 놀줌은 1장 고정)
    setInventory({
      innocent: upgradeCount,
      chaos: upgradeCount,
      amazingChaos: 1,
      white5: 5,
      white10: 3,
      white20: 3,
    });
  };

  const changeUpgradeCount = (count) => {
    // 주문서를 1장이라도 사용했으면 확인 팝업
    if (history.length > 0) {
      if (!window.confirm('진행 중인 작업이 초기화됩니다. 계속하시겠습니까?')) {
        return;
      }
    }

    setUpgradeCount(count);
    setStats({ ...CHAOS_BASE_STATS });
    setStatChanges({ atk: 0, matk: 0, str: 0, dex: 0, int: 0, luk: 0 });
    setRemainingSlots(count);
    setSuccessCount(0);
    setFailCount(0);
    setHistory([]);
    setIsSaved(false);
    // 인벤토리도 초기화 (이노센트/혼줌은 업그레이드 횟수만큼, 놀줌은 1장 고정)
    setInventory({
      innocent: count,
      chaos: count,
      amazingChaos: 1,
      white5: 5,
      white10: 3,
      white20: 3,
    });
  };

  const useInnocent = () => {
    if (inventory.innocent <= 0) return;

    // 이노센트 사용 시 초기화 후 랜덤 스탯 변화
    // 공격력/마력: ±3, 나머지 스탯: ±5
    const changes = {
      atk: Math.floor(Math.random() * 7) - 3,   // -3 ~ +3
      matk: Math.floor(Math.random() * 7) - 3,  // -3 ~ +3
      str: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
      dex: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
      int: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
      luk: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
    };

    const newStats = {
      atk: Math.max(0, CHAOS_BASE_STATS.atk + changes.atk),
      matk: Math.max(0, CHAOS_BASE_STATS.matk + changes.matk),
      str: Math.max(0, CHAOS_BASE_STATS.str + changes.str),
      dex: Math.max(0, CHAOS_BASE_STATS.dex + changes.dex),
      int: Math.max(0, CHAOS_BASE_STATS.int + changes.int),
      luk: Math.max(0, CHAOS_BASE_STATS.luk + changes.luk),
    };

    // 이노센트 1장 사용, 혼줌/놀줌 초기값으로 복구
    setInventory(prev => ({
      ...prev,
      innocent: prev.innocent - 1,
      chaos: upgradeCount,
      amazingChaos: 1,
    }));

    setStats(newStats);
    setStatChanges(changes);
    setRemainingSlots(upgradeCount);
    setSuccessCount(0);
    setFailCount(0);
    setHistory(prev => [...prev, { type: 'innocent', result: 'success' }]);
    playSound('/sounds/success.mp3', volume);
  };

  const useChaos = (isAmazing = false) => {
    if (remainingSlots <= 0) return;
    const invKey = isAmazing ? 'amazingChaos' : 'chaos';
    if (inventory[invKey] <= 0) return;
    // 놀줌 사용 시 혼줌도 필요
    if (isAmazing && inventory.chaos <= 0) return;

    const success = Math.random() < 0.6; // 60% 성공률

    // 놀줌 사용 시 혼줌도 같이 1개 차감
    if (isAmazing) {
      setInventory(prev => ({ ...prev, amazingChaos: prev.amazingChaos - 1, chaos: prev.chaos - 1 }));
    } else {
      setInventory(prev => ({ ...prev, chaos: prev.chaos - 1 }));
    }

    if (success) {
      setSuccessCount(prev => prev + 1);
      setRemainingSlots(prev => prev - 1);

      // 스탯 변화 (-5 ~ +5 또는 놀줌은 0 ~ +5)
      // 단, 스탯이 0인 경우 변화 없음 (0으로 고정)
      const statKeys = ['atk', 'matk', 'str', 'dex', 'int', 'luk'];

      setStats(prev => {
        const newStats = { ...prev };
        statKeys.forEach(key => {
          // 스탯이 이미 0이면 변화 없음
          if (prev[key] === 0) return;
          const min = isAmazing ? 0 : -5;
          const max = 5;
          const change = Math.floor(Math.random() * (max - min + 1)) + min;
          newStats[key] = Math.max(0, prev[key] + change);
        });
        return newStats;
      });

      setHistory(prev => [...prev, { type: isAmazing ? 'amazingChaos' : 'chaos', result: 'success' }]);
      playSound('/sounds/success.mp3', volume);
    } else {
      setFailCount(prev => prev + 1);
      setRemainingSlots(prev => prev - 1);
      setHistory(prev => [...prev, { type: isAmazing ? 'amazingChaos' : 'chaos', result: 'fail' }]);
      playSound('/sounds/fail.mp3', volume);
    }
  };

  const useWhite = (percent) => {
    const key = percent === 5 ? 'white5' : percent === 10 ? 'white10' : 'white20';
    if (inventory[key] <= 0 || remainingSlots >= upgradeCount) return;

    const success = Math.random() * 100 < percent;
    setInventory(prev => ({ ...prev, [key]: prev[key] - 1 }));

    if (success) {
      setRemainingSlots(prev => prev + 1);
      // 백의 주문서 성공 시 혼돈의 주문서 1장 추가 지급
      setInventory(prev => ({ ...prev, chaos: prev.chaos + 1 }));
      setHistory(prev => [...prev, { type: `white${percent}`, result: 'success' }]);
      playSound('/sounds/success.mp3', volume);
    } else {
      setHistory(prev => [...prev, { type: `white${percent}`, result: 'fail' }]);
      playSound('/sounds/fail.mp3', volume);
    }
  };

  // 기록 등록
  const saveRecord = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const chaosHistory = history.filter(h => h.type === 'chaos' || h.type === 'amazingChaos');
      const chaosSuccess = chaosHistory.filter(h => h.result === 'success').length;
      const chaosFail = chaosHistory.filter(h => h.result === 'fail').length;
      const innocentUsed = history.filter(h => h.type === 'innocent').length;

      // 최소 1초 딜레이와 API 요청을 동시에 진행
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      await Promise.all([
        api.saveChaosRecord({
          atk: stats.atk,
          matk: stats.matk,
          str: stats.str,
          dex: stats.dex,
          int: stats.int,
          luk: stats.luk,
          total_stat: stats.atk + stats.matk + stats.str + stats.dex + stats.int + stats.luk,
          upgrade_count: upgradeCount,
          innocent_used: innocentUsed,
          chaos_success: chaosSuccess,
          chaos_fail: chaosFail,
        }),
        minDelay
      ]);

      setIsSaved(true);
      loadRankings(rankingUpgrade);
    } catch (e) {
      console.error('Failed to save record:', e);
      alert('기록 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 인벤토리 아이템 정의
  const inventoryItems = [
    { key: 'innocent', name: '이노센트 100%', img: '/scroll/innocent.png', action: useInnocent },
    { key: 'chaos', name: '혼돈의 주문서 60%', img: '/scroll/chaos.png', action: () => useChaos(false) },
    { key: 'amazingChaos', name: '놀라운 혼줌', img: '/scroll/chaos.png', action: () => useChaos(true) },
    { key: 'white5', name: '백의 주문서 5%', img: '/scroll/white-scroll.png', action: () => useWhite(5) },
    { key: 'white10', name: '백의 주문서 10%', img: '/scroll/white-scroll.png', action: () => useWhite(10) },
    { key: 'white20', name: '백의 주문서 20%', img: '/scroll/white-scroll.png', action: () => useWhite(20) },
  ];

  return (
    <div className="chaos-simulator">
      <div className="chaos-unified-container">
        {/* 좌측: 아이템 영역 */}
        <div className="chaos-main">
          {/* 업그레이드 횟수 선택 */}
          <div className="chaos-upgrade-select">
            <span>업그레이드 횟수:</span>
            <div className="upgrade-buttons">
              {[5, 7, 9, 12].map(count => (
                <button
                  key={count}
                  className={upgradeCount === count ? 'active' : ''}
                  onClick={() => changeUpgradeCount(count)}
                >
                  {count}회
                </button>
              ))}
            </div>
          </div>

          {/* 아이템 정보 - 메이플 스타일 윈도우 */}
          <div className="maple-item-window">
            <div className="item-window-header">
              <span className="item-window-title">혼돈의 장갑</span>
            </div>
            <div className="item-window-content">
              <div className="item-window-icon-center">
                <img src="/scroll/item.png" alt="아이템" />
              </div>
              <div className="item-window-stats">
                <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">장비분류: 장갑</span></div>
                {stats.atk > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">공격력: +{stats.atk !== CHAOS_BASE_STATS.atk ? `${stats.atk}(${CHAOS_BASE_STATS.atk}${stats.atk - CHAOS_BASE_STATS.atk >= 0 ? '+' : ''}${stats.atk - CHAOS_BASE_STATS.atk})` : stats.atk}</span></div>}
                {stats.matk > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">마력: +{stats.matk !== CHAOS_BASE_STATS.matk ? `${stats.matk}(${CHAOS_BASE_STATS.matk}${stats.matk - CHAOS_BASE_STATS.matk >= 0 ? '+' : ''}${stats.matk - CHAOS_BASE_STATS.matk})` : stats.matk}</span></div>}
                {stats.str > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">STR: +{stats.str !== CHAOS_BASE_STATS.str ? `${stats.str}(${CHAOS_BASE_STATS.str}${stats.str - CHAOS_BASE_STATS.str >= 0 ? '+' : ''}${stats.str - CHAOS_BASE_STATS.str})` : stats.str}</span></div>}
                {stats.dex > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">DEX: +{stats.dex !== CHAOS_BASE_STATS.dex ? `${stats.dex}(${CHAOS_BASE_STATS.dex}${stats.dex - CHAOS_BASE_STATS.dex >= 0 ? '+' : ''}${stats.dex - CHAOS_BASE_STATS.dex})` : stats.dex}</span></div>}
                {stats.int > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">INT: +{stats.int !== CHAOS_BASE_STATS.int ? `${stats.int}(${CHAOS_BASE_STATS.int}${stats.int - CHAOS_BASE_STATS.int >= 0 ? '+' : ''}${stats.int - CHAOS_BASE_STATS.int})` : stats.int}</span></div>}
                {stats.luk > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">LUK: +{stats.luk !== CHAOS_BASE_STATS.luk ? `${stats.luk}(${CHAOS_BASE_STATS.luk}${stats.luk - CHAOS_BASE_STATS.luk >= 0 ? '+' : ''}${stats.luk - CHAOS_BASE_STATS.luk})` : stats.luk}</span></div>}
                <div className="stat-line highlight"><span className="stat-dot">●</span><span className="stat-text">업그레이드 가능 횟수 : {remainingSlots}</span></div>
              </div>
            </div>
          </div>

          {/* 슬롯 표시 */}
          <div className="chaos-slots-area">
            <div className={`chaos-slots-grid ${upgradeCount === 12 ? 'two-rows' : ''}`}>
              {[...Array(upgradeCount)].map((_, i) => {
                // 혼줌 사용 기록에서 슬롯 상태 확인 (백의 주문서, 이노센트 제외)
                const slotHistory = history.filter(h => !h.type?.startsWith('white') && h.type !== 'innocent');
                const slotResult = slotHistory[i];
                if (slotResult) {
                  return (
                    <div key={i} className={`chaos-slot-box ${slotResult.result === 'success' ? 'success' : 'fail'}`}>
                      {slotResult.result === 'success' ? '✓' : '✗'}
                    </div>
                  );
                }
                return <div key={i} className="chaos-slot-box empty" />;
              })}
            </div>
          </div>

          {/* 성공/실패 통계 */}
          <div className="chaos-stats-compact">
            <span className="success">성공 {successCount}</span>
            <span className="fail">실패 {failCount}</span>
          </div>

          {/* 초기화 버튼 및 기록 등록 */}
          <div className="chaos-action-buttons">
            <button className="reset-button" onClick={resetItem}>초기화</button>
            {isSaved ? (
              <span className="saved-indicator">✓ 저장됨</span>
            ) : (
              successCount >= 1 && remainingSlots === 0 && (
                <button className="save-btn" onClick={saveRecord} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="saving-spinner"></span> 저장 중...</>
                  ) : (
                    '기록 등록'
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* 중앙: ITEM INVENTORY 스타일 인벤토리 */}
        <div className="chaos-inventory">
          <div className="inventory-bg">
            <div className="inventory-items-container">
              {inventoryItems.map((item, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const isTopRow = row === 0;
                const count = inventory[item.key] || 0;
                const isWhiteScroll = item.key.startsWith('white');
                const isWhiteUnavailable = isWhiteScroll && remainingSlots >= upgradeCount;
                return (
                  <div
                    key={item.key}
                    className={`inventory-item ${isTopRow ? 'top-row' : ''} ${count === 0 ? 'disabled' : ''} ${isWhiteUnavailable ? 'unavailable' : ''}`}
                    style={{
                      left: `${8 + col * 44}px`,
                      top: `${row * 43}px`
                    }}
                    onClick={() => count > 0 && !isWhiteUnavailable && item.action()}
                  >
                    <div className="item-icon">
                      <img src={item.img} alt={item.name} className={`drag-scroll-img ${item.key === 'amazingChaos' ? 'amazing-chaos-filter' : ''}`} />
                    </div>
                    {count > 0 && <span className="item-count">{count}</span>}
                    <div className="item-tooltip">
                      <span className="tooltip-name">{item.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측: 랭킹 */}
        <div className="chaos-ranking-area">
          {/* 랭킹 조회 필터 */}
          <div className="chaos-ranking-filter">
            <span>랭킹 조회:</span>
            <div className="filter-buttons">
              {[5, 7, 9, 12].map(count => (
                <button
                  key={count}
                  className={rankingUpgrade === count ? 'active' : ''}
                  onClick={() => setRankingUpgrade(count)}
                >
                  {count}작
                </button>
              ))}
            </div>
          </div>

          {/* 공격력 랭킹 */}
          <div className="chaos-ranking-section">
            <h3>◆ 공격력 랭킹 ({rankingUpgrade}작)</h3>
            <div className="ranking-list">
              {rankings.atk.length === 0 ? (
                <div className="no-data">기록 없음</div>
              ) : (
                rankings.atk.map((r, i) => (
                  <div key={i} className={`ranking-row ${i < 3 ? `top-${i + 1}` : ''}`}>
                    <span className="rank-num">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <span className="rank-name">{r.character_name}</span>
                    <span className="rank-score">공+{r.atk}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 마력 랭킹 */}
          <div className="chaos-ranking-section">
            <h3>◆ 마력 랭킹 ({rankingUpgrade}작)</h3>
            <div className="ranking-list">
              {rankings.matk.length === 0 ? (
                <div className="no-data">기록 없음</div>
              ) : (
                rankings.matk.map((r, i) => (
                  <div key={i} className={`ranking-row ${i < 3 ? `top-${i + 1}` : ''}`}>
                    <span className="rank-num">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <span className="rank-name">{r.character_name}</span>
                    <span className="rank-score">마+{r.matk}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 사용 기록 - 항상 표시하여 레이아웃 고정 */}
      <div className="chaos-history-section">
        <h4>기록</h4>
        <div className="chaos-history-badges">
          {history.length === 0 ? (
            <span className="chaos-history-empty">주문서 사용 시 기록이 표시됩니다</span>
          ) : (
            history.map((h, i) => (
              <span
                key={i}
                className={`chaos-history-badge ${h.type} ${h.result}`}
              >
                {h.type === 'innocent' && '이노'}
                {h.type === 'chaos' && (h.result === 'success' ? <span style={{color: '#fff'}}>혼✓</span> : '혼✗')}
                {h.type === 'amazingChaos' && (h.result === 'success' ? <span style={{color: '#fff'}}>놀✓</span> : '놀✗')}
                {h.type === 'white5' && (h.result === 'success' ? '백5✓' : '백5✗')}
                {h.type === 'white10' && (h.result === 'success' ? '백10✓' : '백10✗')}
                {h.type === 'white20' && (h.result === 'success' ? '백20✓' : '백20✗')}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// 경쟁 모드
// ========================================
function CompetitionMode({ onBack, volume = 0.5, setVolume }) {
  const [stats, setStats] = useState({ ...CHAOS_BASE_STATS });
  const [statChanges, setStatChanges] = useState({ atk: 0, matk: 0, str: 0, dex: 0, int: 0, luk: 0 });
  const [remainingSlots, setRemainingSlots] = useState(5);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [inventory, setInventory] = useState({});
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]); // 슬롯 사용 기록
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, rankRes] = await Promise.all([
        api.getScrollInventory(),
        api.getCompetitionGloveRankings(10),
      ]);
      setInventory(invRes.data || {});
      setRankings(rankRes.data || []);
    } catch (e) {
      console.error('Failed to load competition data:', e);
    }
    setIsLoading(false);
  };

  const resetItem = () => {
    setStats({ ...CHAOS_BASE_STATS });
    setStatChanges({ atk: 0, matk: 0, str: 0, dex: 0, int: 0, luk: 0 });
    setRemainingSlots(5);
    setSuccessCount(0);
    setFailCount(0);
    setHistory([]);
    setIsSaved(false);
  };

  const useScroll = async (scrollType, rate, statChange) => {
    const invKey = scrollType;
    if (!inventory[invKey] || inventory[invKey] <= 0) return;
    if (remainingSlots <= 0 && scrollType !== 'innocent' && !scrollType.startsWith('white')) return;

    // 이노센트 스크롤 - ChaosScrollSimulator와 동일한 방식
    if (scrollType === 'innocent') {
      try {
        await api.useScroll(scrollType, 1);
        setInventory(prev => ({ ...prev, [invKey]: (prev[invKey] || 0) - 1 }));

        // 이노센트 사용 시 초기화 후 랜덤 스탯 변화
        // 공격력/마력: ±3, 나머지 스탯: ±5
        const changes = {
          atk: Math.floor(Math.random() * 7) - 3,   // -3 ~ +3
          matk: Math.floor(Math.random() * 7) - 3,  // -3 ~ +3
          str: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
          dex: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
          int: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
          luk: Math.floor(Math.random() * 11) - 5,  // -5 ~ +5
        };

        const newStats = {
          atk: Math.max(0, CHAOS_BASE_STATS.atk + changes.atk),
          matk: Math.max(0, CHAOS_BASE_STATS.matk + changes.matk),
          str: Math.max(0, CHAOS_BASE_STATS.str + changes.str),
          dex: Math.max(0, CHAOS_BASE_STATS.dex + changes.dex),
          int: Math.max(0, CHAOS_BASE_STATS.int + changes.int),
          luk: Math.max(0, CHAOS_BASE_STATS.luk + changes.luk),
        };

        setStats(newStats);
        setStatChanges(changes);
        setRemainingSlots(5);
        setSuccessCount(0);
        setFailCount(0);
        setHistory([]);
        playSound('/sounds/success.mp3', volume);
      } catch (e) {
        console.error('Failed to use scroll:', e);
      }
      return;
    }

    // 백의 주문서 - 기존 시뮬레이터와 동일
    if (scrollType.startsWith('white')) {
      if (remainingSlots >= 5) return; // 이미 모든 슬롯 복구됨
      const success = Math.random() * 100 < rate;
      try {
        await api.useScroll(scrollType, 1);
        setInventory(prev => ({ ...prev, [invKey]: (prev[invKey] || 0) - 1 }));
        if (success) {
          setRemainingSlots(prev => prev + 1);
          playSound('/sounds/success.mp3', volume);
        } else {
          playSound('/sounds/fail.mp3', volume);
        }
      } catch (e) {
        console.error('Failed to use scroll:', e);
      }
      return;
    }

    // 혼돈의 주문서 - ChaosScrollSimulator와 동일한 방식
    if (scrollType === 'chaos60') {
      const success = Math.random() * 100 < 60; // 60% 성공률
      try {
        await api.useScroll(scrollType, 1);
        setInventory(prev => ({ ...prev, [invKey]: (prev[invKey] || 0) - 1 }));

        if (success) {
          setSuccessCount(prev => prev + 1);
          setRemainingSlots(prev => prev - 1);

          // 스탯 변화 (-5 ~ +5)
          // 스탯 변화 (-5 ~ +5)
          // 단, 스탯이 0인 경우 변화 없음 (0으로 고정)
          const statKeys = ['atk', 'matk', 'str', 'dex', 'int', 'luk'];

          setStats(prev => {
            const newStats = { ...prev };
            statKeys.forEach(key => {
              // 스탯이 이미 0이면 변화 없음
              if (prev[key] === 0) return;
              const change = Math.floor(Math.random() * 11) - 5; // -5 ~ +5
              newStats[key] = Math.max(0, prev[key] + change);
            });
            return newStats;
          });

          setHistory(prev => [...prev, { type: 'chaos', result: 'success' }]);
          playSound('/sounds/success.mp3', volume);
        } else {
          setFailCount(prev => prev + 1);
          setRemainingSlots(prev => prev - 1);
          setHistory(prev => [...prev, { type: 'chaos', result: 'fail' }]);
          playSound('/sounds/fail.mp3', volume);
        }
      } catch (e) {
        console.error('Failed to use scroll:', e);
      }
      return;
    }

    // 장갑 공격력 주문서 (장공 10%, 60%, 100%) - GloveSimulator와 동일한 방식
    const success = Math.random() * 100 < rate;
    try {
      await api.useScroll(scrollType, 1);
      setInventory(prev => ({ ...prev, [invKey]: (prev[invKey] || 0) - 1 }));

      if (success) {
        setSuccessCount(prev => prev + 1);
        setRemainingSlots(prev => prev - 1);
        // 공격력만 증가 (장공 10%: +3, 60%: +2, 100%: +1)
        if (statChange) {
          setStats(prev => ({
            ...prev,
            atk: prev.atk + statChange,
          }));
          setStatChanges(prev => ({
            ...prev,
            atk: prev.atk + statChange,
          }));
        }
        setHistory(prev => [...prev, { type: 'glove', result: 'success' }]);
        playSound('/sounds/success.mp3', volume);
      } else {
        setFailCount(prev => prev + 1);
        setRemainingSlots(prev => prev - 1);
        setHistory(prev => [...prev, { type: 'glove', result: 'fail' }]);
        playSound('/sounds/fail.mp3', volume);
      }
    } catch (e) {
      console.error('Failed to use scroll:', e);
    }
  };

  const saveRecord = async () => {
    if (remainingSlots > 0 || isSaving || isSaved) return;

    setIsSaving(true);
    try {
      // 최소 1초 딜레이와 API 요청을 동시에 진행
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      await Promise.all([
        api.saveCompetitionGloveRecord({
          finalAttack: stats.atk,
          upgradeCount: 5,
          scroll10Used: successCount,
          scroll60Used: 0,
          scroll100Used: 0,
        }),
        minDelay
      ]);
      setIsSaved(true);
      loadData(); // 랭킹 새로고침
    } catch (e) {
      console.error('Failed to save record:', e);
      alert('기록 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 인벤토리 아이템 정의 (백엔드 키와 일치해야 함)
  const inventoryItems = [
    { key: 'innocent', name: '이노센트', img: '/scroll/innocent.png', rate: 100, stat: 0 },
    { key: 'chaos60', name: '혼줌60%', img: '/scroll/chaos.png', rate: 60, stat: 0 },
    { key: 'glove10', name: '장공10%', img: '/scroll/10percent.png', rate: 10, stat: 3 },
    { key: 'glove60', name: '장공60%', img: '/scroll/60percent.png', rate: 60, stat: 2 },
    { key: 'glove100', name: '장공100%', img: '/scroll/100percent.png', rate: 100, stat: 1 },
    { key: 'white5', name: '백줌5%', img: '/scroll/white-scroll.png', rate: 5, stat: 0 },
    { key: 'white10', name: '백줌10%', img: '/scroll/white-scroll.png', rate: 10, stat: 0 },
    { key: 'white20', name: '백줌20%', img: '/scroll/white-scroll.png', rate: 20, stat: 0 },
  ];

  return (
    <div className="page-content scroll-page competition-mode">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← 시뮬레이터</button>
        <h1>경쟁 모드 <span className="competition-badge-inline">RANKED</span></h1>
        <div className="sound-volume-control">
          <span className="volume-icon">{volume === 0 ? '🔇' : '🔉'}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      <div className="chaos-simulator competition">
        <div className="chaos-unified-container">
          {/* 좌측: 아이템 영역 */}
          <div className="chaos-main">
            <div className="competition-mode-indicator">
              <span className="mode-badge">경쟁 모드</span>
              <span className="mode-info">5회 고정 · 부화기 주문서만 사용 · 공격력 랭킹</span>
            </div>

            <div className="maple-item-window">
              <div className="item-window-header">
                <span className="item-window-title">경쟁용 장갑</span>
              </div>
              <div className="item-window-content">
                <div className="item-window-icon-center">
                  <img src="/scroll/item.png" alt="아이템" />
                </div>
                <div className="item-window-stats">
                  <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">장비분류: 장갑</span></div>
                  {stats.atk > 0 && <div className="stat-line highlight"><span className="stat-dot">●</span><span className="stat-text">공격력: +{stats.atk !== CHAOS_BASE_STATS.atk ? `${stats.atk}(${CHAOS_BASE_STATS.atk}${stats.atk - CHAOS_BASE_STATS.atk >= 0 ? '+' : ''}${stats.atk - CHAOS_BASE_STATS.atk})` : stats.atk}</span></div>}
                  {stats.matk > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">마력: +{stats.matk !== CHAOS_BASE_STATS.matk ? `${stats.matk}(${CHAOS_BASE_STATS.matk}${stats.matk - CHAOS_BASE_STATS.matk >= 0 ? '+' : ''}${stats.matk - CHAOS_BASE_STATS.matk})` : stats.matk}</span></div>}
                  {stats.str > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">STR: +{stats.str !== CHAOS_BASE_STATS.str ? `${stats.str}(${CHAOS_BASE_STATS.str}${stats.str - CHAOS_BASE_STATS.str >= 0 ? '+' : ''}${stats.str - CHAOS_BASE_STATS.str})` : stats.str}</span></div>}
                  {stats.dex > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">DEX: +{stats.dex !== CHAOS_BASE_STATS.dex ? `${stats.dex}(${CHAOS_BASE_STATS.dex}${stats.dex - CHAOS_BASE_STATS.dex >= 0 ? '+' : ''}${stats.dex - CHAOS_BASE_STATS.dex})` : stats.dex}</span></div>}
                  {stats.int > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">INT: +{stats.int !== CHAOS_BASE_STATS.int ? `${stats.int}(${CHAOS_BASE_STATS.int}${stats.int - CHAOS_BASE_STATS.int >= 0 ? '+' : ''}${stats.int - CHAOS_BASE_STATS.int})` : stats.int}</span></div>}
                  {stats.luk > 0 && <div className="stat-line"><span className="stat-dot">●</span><span className="stat-text">LUK: +{stats.luk !== CHAOS_BASE_STATS.luk ? `${stats.luk}(${CHAOS_BASE_STATS.luk}${stats.luk - CHAOS_BASE_STATS.luk >= 0 ? '+' : ''}${stats.luk - CHAOS_BASE_STATS.luk})` : stats.luk}</span></div>}
                  <div className="stat-line highlight"><span className="stat-dot">●</span><span className="stat-text">업그레이드 가능 횟수 : {remainingSlots}</span></div>
                </div>
              </div>
            </div>

            {/* 슬롯 표시 - 이노센트/혼줌과 동일한 방식 */}
            <div className="chaos-slots-area">
              <div className="chaos-slots-grid">
                {[...Array(5)].map((_, i) => {
                  // 슬롯 사용 기록에서 결과 확인 (백의 주문서 제외)
                  const slotHistory = history.filter(h => !h.type?.startsWith('white'));
                  const slotResult = slotHistory[i];
                  if (slotResult) {
                    return (
                      <div key={i} className={`chaos-slot-box ${slotResult.result === 'success' ? 'success' : 'fail'}`}>
                        {slotResult.result === 'success' ? '✓' : '✗'}
                      </div>
                    );
                  }
                  return <div key={i} className="chaos-slot-box empty" />;
                })}
              </div>
            </div>

            <div className="chaos-stats-compact">
              <span className="success">성공 {successCount}</span>
              <span className="fail">실패 {failCount}</span>
            </div>

            <div className="chaos-action-buttons">
              <button className="reset-button" onClick={resetItem}>초기화</button>
              {isSaved ? (
                <span className="saved-indicator">✓ 저장됨</span>
              ) : (
                remainingSlots === 0 && successCount >= 1 && (
                  <button className="save-btn" onClick={saveRecord} disabled={isSaving}>
                    {isSaving ? (
                      <><span className="saving-spinner"></span> 저장 중...</>
                    ) : (
                      '기록 등록'
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 중앙: 인벤토리 (부화기 스타일) */}
          <div className="chaos-inventory">
            <div className="inventory-bg">
              <div className="inventory-items-container">
                {isLoading ? (
                  <div className="loading">로딩 중...</div>
                ) : (
                  inventoryItems.map((item, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    const isTopRow = row === 0;
                    const count = inventory[item.key] || 0;
                    return (
                      <div
                        key={item.key}
                        className={`inventory-item ${isTopRow ? 'top-row' : ''} ${count === 0 ? 'disabled' : ''}`}
                        style={{
                          left: `${8 + col * 44}px`,
                          top: `${row * 43}px`
                        }}
                        onClick={() => count > 0 && useScroll(item.key, item.rate, item.stat)}
                      >
                        <div className="item-icon">
                          <img src={item.img} alt={item.name} className="drag-scroll-img" />
                        </div>
                        {count > 0 && <span className="item-count">{count}</span>}
                        <div className="item-tooltip">
                          <span className="tooltip-name">{item.name}</span>
                          <span className="tooltip-rate">{item.rate}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 우측: 랭킹 */}
          <div className="chaos-ranking-area">
            <div className="chaos-ranking-section competition-ranking">
              <h3>◆ 경쟁 랭킹 (공격력)</h3>
              <div className="ranking-list">
                {rankings.length === 0 ? (
                  <div className="no-data">기록 없음</div>
                ) : (
                  rankings.map((r, i) => (
                    <div key={i} className={`ranking-row ${i < 3 ? `top-${i + 1}` : ''}`}>
                      <span className="rank-num">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                      <span className="rank-name">{r.character_name}</span>
                      <span className="rank-score">공+{r.final_attack}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

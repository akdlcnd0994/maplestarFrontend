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
const playSound = (src) => {
  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

export default function ScrollPage({ setPage }) {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState('glove'); // glove, potential

  if (!isLoggedIn) {
    return (
      <div className="page-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
          <h1>주문서 시뮬레이터</h1>
        </div>
        <div className="login-required-message">
          <div className="lock-icon">■</div>
          <h2>로그인이 필요합니다</h2>
          <p>주문서 시뮬레이터는 길드원만 이용할 수 있습니다.</p>
          <button className="login-btn" onClick={() => setPage('login')}>로그인하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content scroll-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>주문서 시뮬레이터</h1>
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
      </div>

      {activeTab === 'glove' && <GloveSimulator />}
      {activeTab === 'potential' && <PotentialSimulator />}
    </div>
  );
}

// 노가다 목장갑 시뮬레이터 (기존)
function GloveSimulator() {
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
      playSound('/sounds/success.mp3');
      setSuccessCount(prev => prev + 1);
      setAddedStat(prev => prev + scroll.value);
      setHistory(prev => [...prev, { scroll: scroll.name, success: true, value: scroll.value }]);
      setLastResult({ success: true, value: scroll.value });
    } else {
      playSound('/sounds/fail.mp3');
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
          {slots === 0 && successCount > 0 && !saved && (
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
function PotentialSimulator() {
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
      playSound('/sounds/success.mp3');
      setStats(prev => ({
        ...prev,
        potential60: { ...prev.potential60, success: prev.potential60.success + 1, attempts: prev.potential60.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential60', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      playSound('/sounds/destroy.mp3');
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
      playSound('/sounds/success.mp3');
      setStats(prev => ({
        ...prev,
        potential80: { ...prev.potential80, success: prev.potential80.success + 1, attempts: prev.potential80.attempts + 1 }
      }));
      setHistory(prev => [...prev, { type: 'potential80', result: 'success' }]);
      showResult('success');
      if (!itemAlive && ignoreDestroy) setItemAlive(true);
    } else {
      playSound('/sounds/destroy.mp3');
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
      playSound('/sounds/success.mp3');
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
        playSound('/sounds/destroy.mp3');
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
        playSound('/sounds/fail.mp3');
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
      playSound('/sounds/success.mp3');
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
        playSound('/sounds/destroy.mp3');
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
        playSound('/sounds/fail.mp3');
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

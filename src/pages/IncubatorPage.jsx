import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// 소리 재생 함수 (연타 지원)
const playSound = (src, volume = 0.5) => {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
};

// 주문서 이미지 매핑 (퍼센트별)
const getScrollImage = (percent) => {
  if (percent === 10) return '/scroll/10percent.png';
  if (percent === 50) return '/scroll/50percent.png';
  if (percent === 60) return '/scroll/60percent.png';
  if (percent === 100) return '/scroll/100percent.png';
  return '/scroll/60percent.png';
};

// 특수 아이템 이미지 매핑 (아이템 이름 기반)
const ITEM_IMAGES = {
  '전설의 용사 뱃지': '/incubator/items/전설의용사뱃지.png',
  '태초의 정수': '/incubator/items/태초의 정수.png',
  '[마스터리북]메이플용사 30': '/incubator/items/메이플용사 30.png',
  '프로텍트 주문서': '/incubator/items/프로텍트 주문서.png',
  '이노센트 주문서 100%': '/incubator/items/이노센트 주문서.png',
  '스페셜 잠재능력 부여 주문서': '/incubator/items/잠재능력 부여주문서(다른퍼센트도모두동일).png',
  '고급 잠재능력 부여 주문서': '/incubator/items/잠재능력 부여주문서(다른퍼센트도모두동일).png',
  '잠재능력 부여 주문서': '/incubator/items/잠재능력 부여주문서(다른퍼센트도모두동일).png',
  '혼돈의 주문서 60%': '/incubator/items/혼돈의 주문서.png',
  '금빛 각인의 인장': '/incubator/items/금빛각인의인장.png',
  '은빛 각인의 인장': '/incubator/items/은빛각인의인장.png',
  '황금 망치': '/incubator/items/황금망치(퍼센트다동일).png',
  '황금 망치 50%': '/incubator/items/황금망치(퍼센트다동일).png',
  '백의 주문서 20%': '/incubator/items/백의주문서(퍼센트는전부동일).png',
  '백의 주문서 10%': '/incubator/items/백의주문서(퍼센트는전부동일).png',
  '백의 주문서 5%': '/incubator/items/백의주문서(퍼센트는전부동일).png',
  '불가사의한 레시피 두루마리': '/incubator/items/불가사이한 레시피 두루마리.png',
  '달님별님 쿠션': '/incubator/items/달님별님쿠션.png',
  '갈색 모래토끼 쿠션': '/incubator/items/갈색모래토끼.png',
  '핑크 비치파라솔': '/incubator/items/핑크 비치 파라솔.png',
  '네이비 벨벳쇼파': '/incubator/items/네이비 벨벳소파.png',
  '레드 디자인체어': '/incubator/items/레드 디자인 체어.png',
  '부비 고양이 의자': '/incubator/items/부비 고양이 의자.png',
  '냠냠팬더 의자': '/incubator/items/팬더의자.png',
  '드래곤의 알': '/incubator/items/드래곤의 알.png',
  '꿈꾸는 화가 의자': '/incubator/items/꿈꾸는 화가 의자.png',
  '와글친구 의자': '/incubator/items/와글친구의자.png',
  '엔틱 축음기 의자': '/incubator/items/엔틱축음기의자.png',
  '경험치 2배 쿠폰': '/incubator/items/경험치 2배 쿠폰.png',
  '드롭률 30% 쿠폰': '/incubator/items/드롭률 30퍼 쿠폰.png',
  '신비의 마스터리북': '/incubator/items/메이플용사 30.png', // 마스터리북 이미지 공유
};

// 아이템 아이콘 가져오기
const getItemIcon = (item) => {
  // 특수 아이템 이미지 확인
  if (ITEM_IMAGES[item.name]) {
    return <img src={ITEM_IMAGES[item.name]} alt={item.name} className="item-img-real" />;
  }
  // 퍼센트가 있는 주문서는 퍼센트별 이미지 사용
  if (item.type === 'scroll' && item.percent) {
    return <img src={getScrollImage(item.percent)} alt={item.name} className="item-img-real" />;
  }
  // 기본 주문서 이미지
  if (item.type === 'scroll') {
    return <img src="/scroll/60percent.png" alt={item.name} className="item-img-real" />;
  }
  // 폴백: 타입별 이모지
  const icons = {
    chair: '🪑',
    special: '✨',
    book: '📕',
    coupon: '🎫',
  };
  return <span className="item-emoji">{icons[item.type] || '📦'}</span>;
};

export default function IncubatorPage() {
  const { isLoggedIn } = useAuth();
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('simulatorVolume');
    return saved ? parseFloat(saved) : 0.3;
  });

  // 음량 변경 시 localStorage에 저장
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    localStorage.setItem('simulatorVolume', newVolume.toString());
  };

  const [state, setState] = useState('ready'); // ready, hatching, result
  const [resultItem, setResultItem] = useState(null);
  const [resultItems, setResultItems] = useState([]); // 다중 부화 결과
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // 슬라이드 인덱스
  const [dailyCount, setDailyCount] = useState(0);
  const [bonusHatches, setBonusHatches] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [legendaryCount, setLegendaryCount] = useState(0);
  const [inventoryPage, setInventoryPage] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitionBoost, setCompetitionBoost] = useState(false); // 경쟁모드 부스트

  const BASE_DAILY_LIMIT = 3000;
  const totalLimit = BASE_DAILY_LIMIT + bonusHatches;
  const ITEMS_PER_PAGE = 24; // 6줄 x 4칸

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, [isLoggedIn]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 아이템 목록 로드
      const itemsRes = await api.getIncubatorItems();
      setItems(itemsRes.data || []);

      // 로그인 상태면 인벤토리와 일일 통계도 로드
      if (isLoggedIn) {
        const [inventoryRes, statsRes] = await Promise.all([
          api.getIncubatorInventory(),
          api.getIncubatorDailyStats()
        ]);

        setInventory(inventoryRes.data || []);
        setDailyCount(statsRes.data?.totalHatches || 0);
        setLegendaryCount(statsRes.data?.legendaryCount || 0);
        setBonusHatches(statsRes.data?.bonusHatches || 0);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hatch = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (state === 'hatching') return;

    if (dailyCount >= totalLimit) {
      alert('오늘 부화 횟수를 모두 사용했습니다.');
      return;
    }

    setState('hatching');
    setResultItems([]);

    try {
      // 최소 1초 딜레이와 API 요청을 동시에 진행
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      const [res] = await Promise.all([api.hatchIncubator(1, competitionBoost), minDelay]);
      const { lastItem, legendaryFound, dailyTotal } = res.data;

      playSound('/sounds/success.mp3', volume);
      setResultItem(lastItem);
      setDailyCount(dailyTotal);
      setState('result');

      // 인벤토리 새로고침
      const inventoryRes = await api.getIncubatorInventory();
      setInventory(inventoryRes.data || []);

      // 전설의 용사 뱃지 당첨시 팝업
      if (legendaryFound > 0) {
        setLegendaryCount(c => c + legendaryFound);
        setTimeout(() => {
          alert('축하합니다! 전설의 용사 뱃지 당첨!');
        }, 100);
      }
    } catch (err) {
      console.error('Hatch failed:', err);
      alert(err.message || '부화 중 오류가 발생했습니다.');
      setState('ready');
    }
  };

  const hatchMultiple = async (count) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (state === 'hatching') return;

    const remaining = totalLimit - dailyCount;
    if (remaining <= 0) {
      alert('오늘 부화 횟수를 모두 사용했습니다.');
      return;
    }

    setState('hatching');
    setResultItems([]);
    setCurrentSlideIndex(0);

    try {
      // 최소 1초 딜레이와 API 요청을 동시에 진행
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      const [res] = await Promise.all([api.hatchIncubator(count, competitionBoost), minDelay]);
      const { lastItem, allItems, legendaryFound, dailyTotal } = res.data;

      playSound('/sounds/success.mp3', volume);
      setResultItem(lastItem);
      setResultItems(allItems || [lastItem]);
      setDailyCount(dailyTotal);
      setState('result');

      // 슬라이드 애니메이션 시작
      if (allItems && allItems.length > 1) {
        let idx = 0;
        const slideInterval = setInterval(() => {
          idx++;
          if (idx >= allItems.length) {
            clearInterval(slideInterval);
          } else {
            setCurrentSlideIndex(idx);
          }
        }, 400); // 0.4초마다 다음 아이템
      }

      // 인벤토리 새로고침
      const inventoryRes = await api.getIncubatorInventory();
      setInventory(inventoryRes.data || []);

      if (legendaryFound > 0) {
        setLegendaryCount(c => c + legendaryFound);
        setTimeout(() => {
          alert(`축하합니다! 전설의 용사 뱃지 ${legendaryFound}개 당첨!`);
        }, 100);
      }
    } catch (err) {
      console.error(`Hatch${count} failed:`, err);
      alert(err.message || '부화 중 오류가 발생했습니다.');
      setState('ready');
    }
  };

  // 인벤토리를 확률 순서로 정렬
  const sortedInventory = inventory
    .map(inv => ({
      item: {
        id: inv.item_id,
        name: inv.name,
        rate: inv.rate,
        type: inv.type,
        percent: inv.percent
      },
      count: inv.count
    }))
    .sort((a, b) => a.item.rate - b.item.rate);

  if (loading) {
    return (
      <div className="incubator-page">
        <div className="incubator-wrapper">
          <div className="incubator-loading">
            <div className="loading-spinner"></div>
            <span>부화기 준비 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="incubator-page">
      <div className="incubator-volume-box">
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
      <div className="incubator-wrapper">
        <div className="incubator-header">
          <h1>루시아의 전용뱃은 절대안뜨는 부화기</h1>
          <p className="incubator-subtitle">본섭과 확률 동일</p>
          <div className="daily-count-area">
            <span className="daily-count">오늘 부화: {dailyCount} / {totalLimit}</span>
            {bonusHatches > 0 && <span className="bonus-indicator">+{bonusHatches} 보너스</span>}
          </div>
          {!isLoggedIn && (
            <p className="login-notice">로그인하면 기록이 저장됩니다!</p>
          )}
        </div>

        <div className="incubator-main">
        <div className="incubator-machine">
          <div className="competition-boost-toggle">
            <label className="boost-checkbox-label">
              <input
                type="checkbox"
                checked={competitionBoost}
                onChange={(e) => setCompetitionBoost(e.target.checked)}
                disabled={!isLoggedIn}
              />
              <span className="boost-checkbox-text">경쟁모드 부스트</span>
              <span className="boost-info">(경쟁용 주문서 확률 2배 적용)</span>
            </label>
          </div>
          <div className="hatch-buttons">
            <button className="hatch-btn" onClick={hatch} disabled={!isLoggedIn || state === 'hatching'}>
              1개 부화
            </button>
            <button className="hatch-btn hatch-3" onClick={() => hatchMultiple(3)} disabled={!isLoggedIn || state === 'hatching'}>
              3개 부화
            </button>
            <button className="hatch-btn hatch-5" onClick={() => hatchMultiple(5)} disabled={!isLoggedIn || state === 'hatching'}>
              5개 부화
            </button>
          </div>
          <div className="incubator-bg" onClick={isLoggedIn ? hatch : undefined}>
            {/* 결과 아이템 표시 */}
            {state === 'result' && resultItem && (
              <>
                <div className="result-item">
                  {getItemIcon(resultItem)}
                </div>
                <div className="result-item-name">
                  {resultItem.name}
                </div>
              </>
            )}

            {/* 부화 중 애니메이션 */}
            {state === 'hatching' && (
              <div className="hatching-overlay">
                <div className="hatching-effect"></div>
              </div>
            )}
          </div>

          {/* 다중 부화 슬라이드 결과 */}
          {state === 'result' && resultItems.length > 1 && (
            <div className="hatch-slide-results">
              {resultItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`slide-item ${idx <= currentSlideIndex ? 'visible' : ''} ${idx === currentSlideIndex ? 'current' : ''}`}
                >
                  <div className="slide-item-icon">
                    {getItemIcon(item)}
                  </div>
                  <span className="slide-item-name">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="incubator-inventory">
          <div className="inventory-bg">
            <div className="inventory-items-container">
              {sortedInventory
                .slice(inventoryPage * ITEMS_PER_PAGE, (inventoryPage + 1) * ITEMS_PER_PAGE)
                .map(({ item, count }, index) => {
                  const row = Math.floor(index / 4);
                  const isTopRow = row === 0;
                  return (
                    <div
                      key={item.id}
                      className={`inventory-item ${isTopRow ? 'top-row' : ''}`}
                      style={{
                        left: `${8 + (index % 4) * 44}px`,
                        top: `${row * 43}px`
                      }}
                    >
                      <div className="item-icon">
                        {getItemIcon(item)}
                      </div>
                      {count > 1 && <span className="item-count">{count}</span>}
                      <div className="item-tooltip">
                        <span className="tooltip-name">{item.name}</span>
                        <span className="tooltip-rate">{item.rate}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
            {sortedInventory.length > ITEMS_PER_PAGE && (
              <div className="inventory-pagination">
                <button
                  onClick={(e) => { e.stopPropagation(); setInventoryPage(p => Math.max(0, p - 1)); }}
                  disabled={inventoryPage === 0}
                >
                  ◀
                </button>
                <span>{inventoryPage + 1} / {Math.ceil(sortedInventory.length / ITEMS_PER_PAGE)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setInventoryPage(p => Math.min(Math.ceil(sortedInventory.length / ITEMS_PER_PAGE) - 1, p + 1)); }}
                  disabled={inventoryPage >= Math.ceil(sortedInventory.length / ITEMS_PER_PAGE) - 1}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

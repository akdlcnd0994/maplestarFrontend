import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getImageUrl } from '../services/api';
import { getIconEmoji } from '../components/UserAvatar';

export default function GamesPage({ setPage }) {
  const { isLoggedIn, user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [rankings, setRankings] = useState({});
  const [myScores, setMyScores] = useState({});
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    loadRankings();
    if (isLoggedIn) {
      loadMyScores();
    }
  }, [isLoggedIn]);

  const loadRankings = async () => {
    try {
      const res = await api.getAllGameRankings();
      setRankings(res.data || {});
    } catch (e) {
      console.error('Failed to load rankings:', e);
    }
  };

  const loadMyScores = async () => {
    try {
      const res = await api.getMyGameScores();
      setMyScores(res.data || {});
    } catch (e) {
      console.error('Failed to load my scores:', e);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="page-content">
        <div className="page-header">
          <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
          <h1>미니게임</h1>
        </div>
        <div className="login-required-message">
          <div className="lock-icon">■</div>
          <h2>로그인이 필요합니다</h2>
          <p>미니게임은 길드원만 이용할 수 있습니다.</p>
          <button className="login-btn" onClick={() => setPage('login')}>로그인하기</button>
        </div>
      </div>
    );
  }

  const games = [
    { id: 'aimtrainer', name: '에임 트레이너', icon: '◉', desc: '타겟을 빠르게 클릭하세요', unit: '개', best: 'high' },
    { id: 'colortest', name: '색 구별 테스트', icon: '▩', desc: '다른 색을 찾아내세요', unit: '레벨', best: 'high' },
    { id: 'pattern', name: '패턴 기억', icon: '◈', desc: '패턴을 기억하고 따라하세요', unit: '레벨', best: 'high' },
    { id: 'reaction', name: '반응속도 테스트', icon: '▽', desc: '번개처럼 빠르게!', unit: 'ms', best: 'low' },
    { id: 'memory', name: '카드 기억력', icon: '◇', desc: '기억력을 테스트하세요', unit: '점', best: 'high' },
    { id: 'number', name: '숫자 맞추기', icon: '◎', desc: '최소 횟수로 맞춰보세요', unit: '회', best: 'low' },
    { id: 'game2048', name: '2048', icon: '▦', desc: '숫자를 합쳐 2048을 만드세요', unit: '점', best: 'high' },
    { id: 'snake', name: 'Snake', icon: '▬', desc: '뱀을 키워보세요', unit: '점', best: 'high' },
    { id: 'flappy', name: '장애물 피하기', icon: '△', desc: '장애물을 피해 날아가세요', unit: '점', best: 'high' },
    { id: 'typing', name: '타자 게임', icon: '▣', desc: '얼마나 빠르게 칠 수 있나요?', unit: '개', best: 'high' },
  ];

  const utilityGames = [
    { id: 'ladder', name: '사다리 게임', desc: '누가 당첨될까요?', color: '#e07020' },
    { id: 'roulette', name: '룰렛', desc: '행운의 룰렛을 돌려보세요', color: '#9b59b6' },
    { id: 'teammaker', name: '팀 나누기', desc: '공정하게 팀을 구성해요', color: '#27ae60' },
  ];

  const getMyBest = (gameId) => {
    return myScores[gameId]?.score;
  };

  const getMyRank = (gameId) => {
    return myScores[gameId]?.rank;
  };

  return (
    <div className="page-content games-page-v2">
      <div className="page-header">
        <button className="back-btn" onClick={() => selectedGame ? setSelectedGame(null) : setPage('main')}>
          ← {selectedGame ? '게임 목록' : '돌아가기'}
        </button>
        <h1>{selectedGame ? (games.find(g => g.id === selectedGame)?.name || utilityGames.find(g => g.id === selectedGame)?.name) : '미니게임'}</h1>
        {!selectedGame && (
          <button className="ranking-toggle-btn" onClick={() => setShowRankings(!showRankings)}>
            {showRankings ? '◀ 게임 목록' : '랭킹 보기 ▶'}
          </button>
        )}
      </div>

      {!selectedGame ? (
        showRankings ? (
          <RankingsView rankings={rankings} games={games} />
        ) : (
          <>
          {/* 히어로 섹션 */}
          <div className="games-hero-v2">
            <div className="hero-bg-pattern"></div>
            <div className="hero-content">
              <div className="hero-badge">GUILD ARCADE</div>
              <h2 className="hero-title">
                <span className="title-line">길드원들과 함께</span>
                <span className="title-highlight">실력을 겨루세요</span>
              </h2>
              <div className="hero-stats">
                <div className="stat-box">
                  <span className="stat-num">{Object.values(rankings).reduce((acc, arr) => acc + (arr?.length || 0), 0)}</span>
                  <span className="stat-label">총 기록</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-box">
                  <span className="stat-num">{games.length}</span>
                  <span className="stat-label">경쟁 게임</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-box">
                  <span className="stat-num">{utilityGames.length}</span>
                  <span className="stat-label">유틸리티</span>
                </div>
              </div>
            </div>
          </div>

          {/* 경쟁 게임 섹션 */}
          <div className="games-section-v2">
            <div className="section-title-v2">
              <div className="title-icon">⚔</div>
              <div className="title-text">
                <h3>경쟁 게임</h3>
                <p>랭킹에 도전하고 길드 최고가 되어보세요</p>
              </div>
            </div>

            <div className="games-grid-v2">
              {games.map((game, idx) => (
                <div
                  key={game.id}
                  className={`game-card-v2 game-card-${game.id}`}
                  onClick={() => setSelectedGame(game.id)}
                >
                  <div className="card-glow"></div>
                  <div className="card-content">
                    <div className="card-header">
                      <div className="game-icon-v2">
                        <div className="icon-shape"></div>
                      </div>
                      <div className="game-meta">
                        <h4>{game.name}</h4>
                        <p>{game.desc}</p>
                      </div>
                    </div>

                    {getMyBest(game.id) && (
                      <div className="my-record-v2">
                        <div className="record-label">내 기록</div>
                        <div className="record-value">{getMyBest(game.id)}<span>{game.unit}</span></div>
                        <div className="record-rank">#{getMyRank(game.id)}</div>
                      </div>
                    )}

                    <div className="card-footer">
                      {rankings[game.id]?.length > 0 ? (
                        <div className="top-player">
                          <div className="crown-badge">1st</div>
                          <span className="player-name">{rankings[game.id][0].character_name}</span>
                          <span className="player-score">{rankings[game.id][0].score}{game.unit}</span>
                        </div>
                      ) : (
                        <div className="no-record">
                          첫 번째 기록에 도전하세요!
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-action">
                    <span>플레이</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 유틸리티 게임 섹션 */}
          <div className="utility-section-v2">
            <div className="section-title-v2">
              <div className="title-icon">🎲</div>
              <div className="title-text">
                <h3>유틸리티</h3>
                <p>길드 모임과 이벤트에서 활용해보세요</p>
              </div>
            </div>

            <div className="utility-grid-v2">
              {utilityGames.map(game => (
                <div
                  key={game.id}
                  className={`utility-card-v2 utility-${game.id}`}
                  style={{ '--card-accent': game.color }}
                  onClick={() => setSelectedGame(game.id)}
                >
                  <div className="utility-icon-v2">
                    <div className="icon-inner"></div>
                  </div>
                  <div className="utility-info-v2">
                    <h4>{game.name}</h4>
                    <p>{game.desc}</p>
                  </div>
                  <div className="utility-arrow-v2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
        )
      ) : (
        <div className="game-container">
          {selectedGame === 'reaction' && <ReactionGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'memory' && <MemoryGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'typing' && <TypingGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'number' && <NumberGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'game2048' && <Game2048 user={user} onScoreUpdate={loadMyScores} onBack={() => setSelectedGame(null)} />}
          {selectedGame === 'aimtrainer' && <AimTrainerGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'colortest' && <ColorTestGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'snake' && <SnakeGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'flappy' && <FlappyGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'pattern' && <PatternGame user={user} onScoreUpdate={loadMyScores} />}
          {selectedGame === 'ladder' && <LadderGame />}
          {selectedGame === 'roulette' && <RouletteGame />}
          {selectedGame === 'teammaker' && <TeamMakerGame />}
        </div>
      )}
    </div>
  );
}

// 전체 랭킹 보기
function RankingsView({ rankings, games }) {
  const [selectedGameRanking, setSelectedGameRanking] = useState('reaction');
  const [fullRankings, setFullRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFullRankings(selectedGameRanking);
  }, [selectedGameRanking]);

  const loadFullRankings = async (gameType) => {
    setLoading(true);
    try {
      const res = await api.getGameRankings(gameType, 50);
      setFullRankings(res.data || []);
    } catch (e) {
      console.error('Failed to load rankings:', e);
    }
    setLoading(false);
  };

  const game = games.find(g => g.id === selectedGameRanking);

  return (
    <div className="rankings-view">
      <div className="ranking-tabs">
        {games.map(g => (
          <button
            key={g.id}
            className={`ranking-tab ${selectedGameRanking === g.id ? 'active' : ''}`}
            onClick={() => setSelectedGameRanking(g.id)}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      <div className="rankings-list">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : fullRankings.length === 0 ? (
          <div className="empty-message">아직 기록이 없습니다. 첫 번째 도전자가 되어보세요!</div>
        ) : (
          fullRankings.map((entry, i) => (
            <div key={i} className={`ranking-item ${i < 3 ? `top-${i + 1}` : ''}`}>
              <div className="ranking-position">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="ranking-avatar">
                {entry.user?.profile_image ? (
                  <img
                    src={getImageUrl(entry.user.profile_image)}
                    alt=""
                    style={{ transform: `scale(${entry.user.profile_zoom || 1})` }}
                  />
                ) : (
                  <span>{getIconEmoji(entry.user?.default_icon)}</span>
                )}
              </div>
              <div className="ranking-info">
                <span className="ranking-name">{entry.user?.character_name}</span>
              </div>
              <div className="ranking-score">
                {entry.score}{game?.unit}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 반응속도 게임
function ReactionGame({ user, onScoreUpdate }) {
  const [state, setState] = useState('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [rank, setRank] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    loadMyBest();
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const loadMyBest = async () => {
    try {
      const res = await api.getMyGameScores();
      if (res.data?.reaction) {
        setBestTime(res.data.reaction.score);
        setRank(res.data.reaction.rank);
      }
    } catch (e) {}
  };

  const startGame = () => {
    setState('ready');
    const delay = Math.random() * 4000 + 2000;
    timeoutRef.current = setTimeout(() => {
      setState('go');
      setStartTime(performance.now());
    }, delay);
  };

  const handleClick = async () => {
    if (state === 'waiting' || state === 'result' || state === 'early') {
      startGame();
    } else if (state === 'ready') {
      clearTimeout(timeoutRef.current);
      setState('early');
    } else if (state === 'go') {
      const time = Math.round(performance.now() - startTime);
      setReactionTime(time);
      setAttempts(prev => [...prev, time]);
      setState('result');

      // 서버에 점수 제출
      if (!bestTime || time < bestTime) {
        try {
          const res = await api.submitGameScore('reaction', time);
          if (res.data?.isNewRecord) {
            setBestTime(time);
            setRank(res.data.rank);
            onScoreUpdate?.();
          }
        } catch (e) {
          console.error('Failed to submit score:', e);
        }
      }
    }
  };

  const getAverage = () => {
    if (attempts.length === 0) return null;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  };

  return (
    <div className="reaction-game">
      <div className="game-stats-bar">
        {bestTime && (
          <div className="stat-item best">
            <span className="stat-label">최고 기록</span>
            <span className="stat-value">{bestTime}ms</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
        {getAverage() && (
          <div className="stat-item">
            <span className="stat-label">평균 ({attempts.length}회)</span>
            <span className="stat-value">{getAverage()}ms</span>
          </div>
        )}
      </div>

      <div
        className={`reaction-box ${state}`}
        onClick={handleClick}
      >
        {state === 'waiting' && (
          <>
            <div className="reaction-icon">◎</div>
            <div className="reaction-text">클릭하여 시작</div>
            <div className="reaction-sub">초록색으로 바뀌면 최대한 빨리 클릭!</div>
          </>
        )}
        {state === 'ready' && (
          <>
            <div className="reaction-icon">■</div>
            <div className="reaction-text">기다리세요...</div>
            <div className="reaction-sub">아직 클릭하지 마세요!</div>
          </>
        )}
        {state === 'go' && (
          <>
            <div className="reaction-icon">✓</div>
            <div className="reaction-text">지금!</div>
          </>
        )}
        {state === 'early' && (
          <>
            <div className="reaction-icon">△</div>
            <div className="reaction-text">너무 빨라요!</div>
            <div className="reaction-sub">클릭하여 다시 시도</div>
          </>
        )}
        {state === 'result' && (
          <>
            <div className="reaction-time">{reactionTime}ms</div>
            <div className="reaction-rating">
              {reactionTime < 180 ? '✓ 번개급!' :
               reactionTime < 220 ? '🔥 엄청 빠름!' :
               reactionTime < 280 ? '😊 좋아요!' :
               reactionTime < 350 ? '○ 평균' : '▽ 더 빠르게!'}
            </div>
            <div className="reaction-sub">클릭하여 다시 시도</div>
          </>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="attempts-history">
          <h4>시도 기록</h4>
          <div className="attempts-list">
            {attempts.slice(-10).map((t, i) => (
              <span key={i} className={`attempt ${t === Math.min(...attempts) ? 'best' : ''}`}>
                {t}ms
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 카드 기억력 게임
function MemoryGame({ user, onScoreUpdate }) {
  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉', '🥭', '🍍'];
  const [difficulty, setDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadMyBest();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadMyBest = async () => {
    try {
      const res = await api.getMyGameScores();
      if (res.data?.memory) {
        setBestScore(res.data.memory.score);
        setRank(res.data.memory.rank);
      }
    } catch (e) {}
  };

  const startGame = (level) => {
    setDifficulty(level);
    const pairCount = level === 'easy' ? 6 : level === 'medium' ? 8 : 12;
    const selectedEmojis = emojis.slice(0, pairCount);
    const shuffled = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameComplete(false);
    setStartTime(Date.now());
    setElapsedTime(0);

    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - Date.now()) / 1000));
    }, 100);
  };

  const handleCardClick = async (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);

        if (newMatched.length === cards.length) {
          clearInterval(timerRef.current);
          const finalTime = Math.floor((Date.now() - startTime) / 1000);
          setElapsedTime(finalTime);
          setGameComplete(true);

          // 점수 계산: 카드 수 * 100 - (이동 횟수 * 5) - (시간 * 2)
          const baseScore = cards.length * 50;
          const movesPenalty = (moves + 1) * 5;
          const timePenalty = finalTime * 2;
          const finalScore = Math.max(baseScore - movesPenalty - timePenalty, 10);

          // 서버에 점수 제출
          try {
            const res = await api.submitGameScore('memory', finalScore, {
              difficulty,
              moves: moves + 1,
              time: finalTime
            });
            if (res.data?.isNewRecord) {
              setBestScore(finalScore);
              setRank(res.data.rank);
              onScoreUpdate?.();
            }
          } catch (e) {
            console.error('Failed to submit score:', e);
          }
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  if (!difficulty) {
    return (
      <div className="memory-game">
        <div className="game-stats-bar">
          {bestScore && (
            <div className="stat-item best">
              <span className="stat-label">최고 점수</span>
              <span className="stat-value">{bestScore}점</span>
              {rank && <span className="stat-rank">#{rank}</span>}
            </div>
          )}
        </div>

        <div className="difficulty-select">
          <h3>난이도 선택</h3>
          <div className="difficulty-buttons">
            <button onClick={() => startGame('easy')} className="diff-btn easy">
              <span className="diff-icon">○</span>
              <span className="diff-name">쉬움</span>
              <span className="diff-desc">6쌍 (12장)</span>
            </button>
            <button onClick={() => startGame('medium')} className="diff-btn medium">
              <span className="diff-icon">◎</span>
              <span className="diff-name">보통</span>
              <span className="diff-desc">8쌍 (16장)</span>
            </button>
            <button onClick={() => startGame('hard')} className="diff-btn hard">
              <span className="diff-icon">◇</span>
              <span className="diff-name">어려움</span>
              <span className="diff-desc">12쌍 (24장)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentScore = gameComplete
    ? Math.max(cards.length * 50 - moves * 5 - elapsedTime * 2, 10)
    : null;

  return (
    <div className="memory-game">
      <div className="game-stats-bar">
        <div className="stat-item">
          <span className="stat-label">이동</span>
          <span className="stat-value">{moves}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">매칭</span>
          <span className="stat-value">{matched.length / 2}/{cards.length / 2}</span>
        </div>
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">{bestScore}점</span>
          </div>
        )}
      </div>

      {gameComplete && (
        <div className="game-complete-banner">
          <h3>🎉 완료!</h3>
          <p>{moves}번 이동, {elapsedTime}초</p>
          <p className="final-score">점수: {currentScore}점</p>
          {currentScore === bestScore && <p className="new-record">★ 새 기록!</p>}
        </div>
      )}

      <div className={`memory-grid ${difficulty}`}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`memory-card ${flipped.includes(index) || matched.includes(index) ? 'flipped' : ''} ${matched.includes(index) ? 'matched' : ''}`}
            onClick={() => handleCardClick(index)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="restart-btn" onClick={() => setDifficulty(null)}>
        {gameComplete ? '다시 하기' : '난이도 변경'}
      </button>
    </div>
  );
}

// 타자 게임
function TypingGame({ user, onScoreUpdate }) {
  const words = [
    '메이플스토리', '길드', '보스레이드', '사냥터', '퀘스트', '아이템', '장비강화',
    '메소', '경험치', '레벨업', '스킬', '버프', '포션', '던전', '파티원',
    '몬스터', '캐릭터', '인벤토리', '창고', '거래소', '펫', '코디', '의자',
    '헤네시스', '커닝시티', '엘리니아', '페리온', '빅토리아', '오르비스'
  ];

  const [state, setState] = useState('ready');
  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctChars, setCorrectChars] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);
  const [wordKey, setWordKey] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadMyBest();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadMyBest = async () => {
    try {
      const res = await api.getMyGameScores();
      if (res.data?.typing) {
        setBestScore(res.data.typing.score);
        setRank(res.data.typing.rank);
      }
    } catch (e) {}
  };

  const startGame = () => {
    setState('playing');
    setScore(0);
    setCorrectChars(0);
    setTimeLeft(30);
    setInput('');
    setWordKey(0);
    nextWord();
    inputRef.current?.focus();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
  };

  const handleInput = (e) => {
    const value = e.target.value;

    if (value === currentWord) {
      // 단어 맞춤 - IME 리셋을 위해 blur 후 처리
      e.target.blur();
      setScore(s => s + 1);
      setCorrectChars(c => c + currentWord.length);
      setInput('');
      setWordKey(k => k + 1);
      nextWord();
      // 다음 프레임에서 포커스
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setInput(value);
    }
  };

  const endGame = async () => {
    setState('result');
    clearInterval(timerRef.current);

    try {
      const res = await api.submitGameScore('typing', score, { words: score });
      if (res.data?.isNewRecord) {
        setBestScore(score);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  return (
    <div className="typing-game">
      <div className="game-stats-bar">
        {state === 'playing' && (
          <>
            <div className="stat-item time">
              <span className="stat-label">남은 시간</span>
              <span className="stat-value">{timeLeft}초</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">맞춘 단어</span>
              <span className="stat-value">{score}개</span>
            </div>
          </>
        )}
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고 기록</span>
            <span className="stat-value">{bestScore}개</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="typing-ready">
          <div className="typing-icon">▣</div>
          <h3>타자 게임</h3>
          <p style={{ color: '#e07020', fontWeight: 600 }}>현재 오류 수정 중입니다.</p>
          <p style={{ fontSize: '13px', color: '#888' }}>업데이트 후 이용 가능합니다.</p>
          <button className="start-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>점검 중</button>
        </div>
      )}

      {state === 'playing' && (
        <div className="typing-area">
          <div className="current-word">{currentWord}</div>
          <input
            key={wordKey}
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            placeholder="여기에 입력하세요"
            autoFocus
          />
          <div className="typing-hint">
            {input && currentWord.startsWith(input) ? '✓ 정확해요!' : input ? '✗ 틀렸어요' : ''}
          </div>
        </div>
      )}

      {state === 'result' && (
        <div className="typing-result">
          <h3>게임 종료!</h3>
          <div className="result-stats">
            <div className="result-item">
              <span className="result-label">맞춘 단어</span>
              <span className="result-value">{score}개</span>
            </div>
          </div>
          {score === bestScore && <div className="new-record">★ 새 기록!</div>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

// 숫자 맞추기 게임
function NumberGame({ user, onScoreUpdate }) {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [bestAttempts, setBestAttempts] = useState(null);
  const [rank, setRank] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMyBest();
    inputRef.current?.focus();
  }, []);

  const loadMyBest = async () => {
    try {
      const res = await api.getMyGameScores();
      if (res.data?.number) {
        setBestAttempts(res.data.number.score);
        setRank(res.data.number.rank);
      }
    } catch (e) {}
  };

  const handleGuess = async () => {
    const num = parseInt(guess);
    if (isNaN(num) || num < 1 || num > 100) {
      setMessage('1~100 사이의 숫자를 입력해주세요!');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (num === target) {
      setMessage(`🎉 정답! ${newAttempts}번 만에 맞췄습니다!`);
      setGameOver(true);

      try {
        const res = await api.submitGameScore('number', newAttempts);
        if (res.data?.isNewRecord) {
          setBestAttempts(newAttempts);
          setRank(res.data.rank);
          onScoreUpdate?.();
        }
      } catch (e) {
        console.error('Failed to submit score:', e);
      }
    } else {
      const hint = num < target ? 'UP' : 'DOWN';
      const diff = Math.abs(target - num);
      const hintText = diff <= 5 ? '🔥 아주 가까워요!' :
                       diff <= 15 ? '👍 가까워요!' :
                       diff <= 30 ? '◎ 조금 멀어요' : '△ 많이 멀어요';
      setMessage(`${hint}! ${hintText}`);
      setHistory([...history, { num, hint }]);
    }
    setGuess('');
    inputRef.current?.focus();
  };

  const resetGame = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess('');
    setMessage('');
    setAttempts(0);
    setGameOver(false);
    setHistory([]);
    inputRef.current?.focus();
  };

  return (
    <div className="number-game">
      <div className="game-stats-bar">
        <div className="stat-item">
          <span className="stat-label">시도</span>
          <span className="stat-value">{attempts}회</span>
        </div>
        {bestAttempts && (
          <div className="stat-item best">
            <span className="stat-label">최소 기록</span>
            <span className="stat-value">{bestAttempts}회</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      <div className="number-game-area">
        <div className="number-icon">◆</div>
        <p className="number-desc">1부터 100 사이의 숫자를 맞춰보세요!</p>

        {message && (
          <div className={`number-message ${gameOver ? 'success' : ''}`}>
            {message}
          </div>
        )}

        {!gameOver ? (
          <div className="number-input-area">
            <input
              ref={inputRef}
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="숫자 입력"
              min="1"
              max="100"
            />
            <button onClick={handleGuess}>확인</button>
          </div>
        ) : (
          <button className="restart-btn" onClick={resetGame}>다시 하기</button>
        )}

        {history.length > 0 && (
          <div className="guess-history">
            <h4>추측 기록</h4>
            <div className="history-list">
              {history.map((h, i) => (
                <span key={i} className={`history-item ${h.hint.toLowerCase()}`}>
                  {h.num} {h.hint === 'UP' ? '↑' : '↓'}
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
// 사다리 게임
// ========================================
function LadderGame() {
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState(['', '', '', '']);
  const [results, setResults] = useState(['', '', '', '']);
  const [ladderLines, setLadderLines] = useState([]);
  const [paths, setPaths] = useState([]);
  const [gameState, setGameState] = useState('setup'); // setup, ready, done
  const [currentPlayer, setCurrentPlayer] = useState(-1);
  const [revealedPaths, setRevealedPaths] = useState([]);
  const ROWS = 10; // 사다리 행 개수

  // 플레이어 수 변경
  const handleCountChange = (count) => {
    setPlayerCount(count);
    setPlayers(Array(count).fill('').map((_, i) => players[i] || ''));
    setResults(Array(count).fill('').map((_, i) => results[i] || ''));
    setGameState('setup');
    setRevealedPaths([]);
  };

  // 사다리 생성
  const generateLadder = () => {
    // ladderLines[row][col] = true면 col과 col+1 사이에 가로선 있음
    const lines = [];
    for (let row = 0; row < ROWS; row++) {
      const rowLines = [];
      for (let col = 0; col < playerCount - 1; col++) {
        // 왼쪽에 이미 라인이 있으면 건너뜀 (연속 가로선 방지)
        if (col > 0 && rowLines[col - 1]) {
          rowLines.push(false);
        } else {
          rowLines.push(Math.random() < 0.4);
        }
      }
      lines.push(rowLines);
    }
    setLadderLines(lines);

    // 각 플레이어의 경로 계산
    const calculatedPaths = [];
    for (let startCol = 0; startCol < playerCount; startCol++) {
      const pathPoints = [];
      let col = startCol;

      // 시작점 (사다리 위)
      pathPoints.push({ x: col, y: 0 });

      for (let row = 0; row < ROWS; row++) {
        // 현재 행의 중간 지점까지 내려감
        const yMid = row + 0.5;

        // 왼쪽으로 가로선이 있는지 확인 (col-1과 col 사이)
        if (col > 0 && lines[row][col - 1]) {
          // 왼쪽으로 이동
          pathPoints.push({ x: col, y: yMid });
          col--;
          pathPoints.push({ x: col, y: yMid });
        }
        // 오른쪽으로 가로선이 있는지 확인 (col과 col+1 사이)
        else if (col < playerCount - 1 && lines[row][col]) {
          // 오른쪽으로 이동
          pathPoints.push({ x: col, y: yMid });
          col++;
          pathPoints.push({ x: col, y: yMid });
        }
      }

      // 끝점 (사다리 아래)
      pathPoints.push({ x: col, y: ROWS });

      calculatedPaths.push({
        start: startCol,
        end: col,
        path: pathPoints
      });
    }
    setPaths(calculatedPaths);
    setGameState('ready');
  };

  // 게임 시작
  const startGame = () => {
    const filledPlayers = players.filter(p => p.trim());
    const filledResults = results.filter(r => r.trim());

    if (filledPlayers.length < 2) {
      alert('최소 2명의 이름을 입력해주세요!');
      return;
    }
    if (filledResults.length < 2) {
      alert('최소 2개의 결과를 입력해주세요!');
      return;
    }

    generateLadder();
  };

  // 플레이어 클릭 (경로 보기)
  const revealPath = (playerIndex) => {
    if (gameState !== 'ready') return;
    if (revealedPaths.includes(playerIndex)) return;

    setCurrentPlayer(playerIndex);
    setRevealedPaths([...revealedPaths, playerIndex]);

    setTimeout(() => {
      setCurrentPlayer(-1);
      if (revealedPaths.length + 1 === playerCount) {
        setGameState('done');
      }
    }, 1500);
  };

  // 전체 공개
  const revealAll = () => {
    setRevealedPaths(Array.from({ length: playerCount }, (_, i) => i));
    setGameState('done');
  };

  // 리셋
  const resetGame = () => {
    setGameState('setup');
    setLadderLines([]);
    setPaths([]);
    setRevealedPaths([]);
    setCurrentPlayer(-1);
  };

  // SVG 경로 문자열 생성
  const generatePathD = (pathPoints, totalWidth, totalHeight) => {
    if (!pathPoints || pathPoints.length === 0) return '';

    return pathPoints.map((point, i) => {
      // x: 0 ~ playerCount-1 → 0 ~ totalWidth
      // y: 0 ~ ROWS → 0 ~ totalHeight
      const x = (point.x / (playerCount - 1)) * totalWidth;
      const y = (point.y / ROWS) * totalHeight;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="ladder-game">
      {gameState === 'setup' && (
        <div className="ladder-setup">
          <div className="setup-section">
            <h3>참가자 수</h3>
            <div className="player-count-selector">
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  className={playerCount === n ? 'active' : ''}
                  onClick={() => handleCountChange(n)}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          <div className="setup-columns">
            <div className="setup-section">
              <h3>참가자 이름</h3>
              <div className="input-list">
                {players.map((player, i) => (
                  <input
                    key={i}
                    type="text"
                    value={player}
                    onChange={(e) => {
                      const newPlayers = [...players];
                      newPlayers[i] = e.target.value;
                      setPlayers(newPlayers);
                    }}
                    placeholder={`참가자 ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="setup-section">
              <h3>결과 (당첨/벌칙 등)</h3>
              <div className="input-list">
                {results.map((result, i) => (
                  <input
                    key={i}
                    type="text"
                    value={result}
                    onChange={(e) => {
                      const newResults = [...results];
                      newResults[i] = e.target.value;
                      setResults(newResults);
                    }}
                    placeholder={`결과 ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button className="start-ladder-btn" onClick={startGame}>
            사다리 만들기
          </button>
        </div>
      )}

      {(gameState === 'ready' || gameState === 'done') && (
        <div className="ladder-play">
          <div className="ladder-header-row">
            {players.map((player, i) => (
              <div
                key={i}
                className={`ladder-player ${revealedPaths.includes(i) ? 'revealed' : ''} ${currentPlayer === i ? 'animating' : ''}`}
                onClick={() => revealPath(i)}
                style={{ width: `${100 / playerCount}%` }}
              >
                <div className="player-name">{player || `참가자 ${i + 1}`}</div>
                <div className="player-marker">▼</div>
              </div>
            ))}
          </div>

          <div className="ladder-board">
            {/* 세로선 */}
            {Array.from({ length: playerCount }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="ladder-vertical"
                style={{ left: `${(i / (playerCount - 1)) * 100}%` }}
              />
            ))}

            {/* 가로선 */}
            {ladderLines.map((row, rowIndex) =>
              row.map((hasLine, colIndex) =>
                hasLine && (
                  <div
                    key={`h-${rowIndex}-${colIndex}`}
                    className="ladder-horizontal"
                    style={{
                      left: `${(colIndex / (playerCount - 1)) * 100}%`,
                      top: `${((rowIndex + 0.5) / ROWS) * 100}%`,
                      width: `${100 / (playerCount - 1)}%`
                    }}
                  />
                )
              )
            )}

            {/* 경로 표시 (SVG) */}
            <svg className="ladder-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {revealedPaths.map(playerIndex => {
                const pathData = paths.find(p => p.start === playerIndex);
                if (!pathData) return null;
                const color = `hsl(${(playerIndex * 360) / playerCount}, 70%, 50%)`;
                return (
                  <path
                    key={`path-${playerIndex}`}
                    d={generatePathD(pathData.path, 100, 100)}
                    stroke={color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={currentPlayer === playerIndex ? 'path-animating' : ''}
                  />
                );
              })}
            </svg>
          </div>

          <div className="ladder-footer-row">
            {results.map((result, i) => {
              const winner = paths.find(p => p.end === i && revealedPaths.includes(p.start));
              return (
                <div
                  key={i}
                  className={`ladder-result ${winner ? 'matched' : ''}`}
                  style={{ width: `${100 / playerCount}%` }}
                >
                  <div className="result-marker">▲</div>
                  <div className="result-text">{result || `결과 ${i + 1}`}</div>
                  {winner && (
                    <div className="result-winner">
                      {players[winner.start] || `참가자 ${winner.start + 1}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ladder-actions">
            {gameState === 'ready' && (
              <button className="reveal-all-btn" onClick={revealAll}>전체 공개</button>
            )}
            <button className="reset-btn" onClick={resetGame}>다시 만들기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// 룰렛 게임 (SVG 기반)
// ========================================
function RouletteGame() {
  const [items, setItems] = useState(['당첨!', '꽝', '커피', '점심', '꽝', '간식']);
  const [newItem, setNewItem] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];

  const size = 400; // SVG 크기
  const center = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = 45; // 중앙 원 반지름

  const addItem = () => {
    if (newItem.trim() && items.length < 12) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index) => {
    if (items.length > 2) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const spin = () => {
    if (isSpinning || items.length < 2) return;

    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);

    const spins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + extraDegrees;

    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const segmentAngle = 360 / items.length;
      // 포인터가 12시 방향에 있으므로 270도(= -90도)에서 시작
      const adjustedRotation = (360 - normalizedRotation + 270) % 360;
      const winningIndex = Math.floor(adjustedRotation / segmentAngle) % items.length;

      setResult(items[winningIndex]);
      setIsSpinning(false);
      setShowConfetti(true);

      setTimeout(() => setShowConfetti(false), 3000);
    }, 4000);
  };

  const reset = () => {
    setRotation(0);
    setResult(null);
    setShowConfetti(false);
  };

  // SVG 파이 세그먼트 경로 생성
  const createSegmentPath = (index, total) => {
    const anglePerSegment = (2 * Math.PI) / total;
    const startAngle = anglePerSegment * index - Math.PI / 2; // 12시 방향에서 시작
    const endAngle = startAngle + anglePerSegment;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = anglePerSegment > Math.PI ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // 텍스트 위치 및 각도 계산
  const getTextPosition = (index, total) => {
    const anglePerSegment = (2 * Math.PI) / total;
    const midAngle = anglePerSegment * index + anglePerSegment / 2 - Math.PI / 2;
    const textRadius = radius * 0.65; // 텍스트 위치 (반지름의 65% 지점)

    const x = center + textRadius * Math.cos(midAngle);
    const y = center + textRadius * Math.sin(midAngle);

    // 텍스트 회전 각도 (도 단위)
    let rotationDeg = (midAngle * 180) / Math.PI + 90;

    return { x, y, rotation: rotationDeg };
  };

  return (
    <div className="roulette-game">
      <div className="roulette-container-svg">
        <div className="roulette-pointer-svg">▼</div>

        <svg
          className={`roulette-wheel-svg ${isSpinning ? 'spinning' : ''}`}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* 세그먼트들 */}
          {items.map((item, i) => (
            <path
              key={i}
              d={createSegmentPath(i, items.length)}
              fill={colors[i % colors.length]}
              stroke="#fff"
              strokeWidth="2"
            />
          ))}

          {/* 텍스트들 */}
          {items.map((item, i) => {
            const pos = getTextPosition(i, items.length);
            const fontSize = items.length <= 4 ? 18 : items.length <= 6 ? 16 : items.length <= 8 ? 14 : 12;
            return (
              <text
                key={`text-${i}`}
                x={pos.x}
                y={pos.y}
                fill="#fff"
                fontSize={fontSize}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {item.length > 6 ? item.slice(0, 6) + '..' : item}
              </text>
            );
          })}

          {/* 중앙 원 */}
          <circle cx={center} cy={center} r={innerRadius} fill="#4a3728" stroke="#c9956c" strokeWidth="4" />
          <text x={center} y={center} fill="#c9956c" fontSize="13" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
            SPIN
          </text>
        </svg>

        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  '--x': Math.random(),
                  '--delay': Math.random() * 0.5,
                  '--color': colors[i % colors.length]
                }}
              />
            ))}
          </div>
        )}
      </div>

      {result && (
        <div className="roulette-result">
          <div className="result-label">결과</div>
          <div className="result-value">{result}</div>
        </div>
      )}

      <div className="roulette-controls">
        <button
          className="spin-btn"
          onClick={spin}
          disabled={isSpinning || items.length < 2}
        >
          {isSpinning ? '돌아가는 중...' : '돌리기!'}
        </button>

        {rotation > 0 && (
          <button className="reset-btn" onClick={reset}>리셋</button>
        )}
      </div>

      <div className="roulette-items">
        <h3>항목 편집</h3>
        <div className="item-input">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="새 항목 추가"
            maxLength={10}
          />
          <button onClick={addItem} disabled={items.length >= 12}>추가</button>
        </div>

        <div className="item-list">
          {items.map((item, i) => (
            <div key={i} className="item-tag" style={{ '--tag-color': colors[i % colors.length] }}>
              <span>{item}</span>
              <button onClick={() => removeItem(i)} disabled={items.length <= 2}>×</button>
            </div>
          ))}
        </div>
        <p className="item-hint">최소 2개, 최대 12개까지 추가 가능</p>
      </div>
    </div>
  );
}

// ========================================
// 랜덤 팀 짜기
// ========================================
function TeamMakerGame() {
  const [members, setMembers] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [balanceOption, setBalanceOption] = useState('random'); // random, balanced

  const getMemberList = () => {
    return members
      .split(/[\n,]/)
      .map(m => m.trim())
      .filter(m => m.length > 0);
  };

  const shuffleTeams = () => {
    const memberList = getMemberList();
    if (memberList.length < 2) {
      alert('최소 2명의 멤버를 입력해주세요!');
      return;
    }
    if (memberList.length < teamCount) {
      alert('팀 수보다 멤버가 많아야 합니다!');
      return;
    }

    setIsShuffling(true);
    setTeams([]);

    // 셔플 애니메이션
    let shuffleCount = 0;
    const shuffleInterval = setInterval(() => {
      const shuffled = [...memberList].sort(() => Math.random() - 0.5);
      const tempTeams = Array.from({ length: teamCount }, () => []);

      shuffled.forEach((member, i) => {
        tempTeams[i % teamCount].push(member);
      });

      setTeams(tempTeams);
      shuffleCount++;

      if (shuffleCount >= 15) {
        clearInterval(shuffleInterval);
        setIsShuffling(false);
      }
    }, 100);
  };

  const copyTeams = () => {
    const text = teams.map((team, i) =>
      `[${i + 1}팀]\n${team.join('\n')}`
    ).join('\n\n');

    navigator.clipboard.writeText(text);
    alert('팀 구성이 복사되었습니다!');
  };

  const resetTeams = () => {
    setTeams([]);
  };

  const memberList = getMemberList();
  const teamColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  return (
    <div className="teammaker-game">
      <div className="teammaker-input-section">
        <div className="input-group">
          <label>멤버 입력</label>
          <textarea
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            placeholder="멤버 이름을 입력하세요&#10;(줄바꿈 또는 쉼표로 구분)&#10;&#10;예시:&#10;홍길동&#10;김철수&#10;이영희"
            rows={8}
          />
          <div className="member-count">
            입력된 멤버: <strong>{memberList.length}</strong>명
          </div>
        </div>

        <div className="settings-group">
          <div className="setting-item">
            <label>팀 수</label>
            <div className="team-count-selector">
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  className={teamCount === n ? 'active' : ''}
                  onClick={() => setTeamCount(n)}
                >
                  {n}팀
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <label>배분 방식</label>
            <div className="balance-selector">
              <button
                className={balanceOption === 'random' ? 'active' : ''}
                onClick={() => setBalanceOption('random')}
              >
                완전 랜덤
              </button>
              <button
                className={balanceOption === 'balanced' ? 'active' : ''}
                onClick={() => setBalanceOption('balanced')}
              >
                균등 배분
              </button>
            </div>
          </div>

          <button
            className="shuffle-btn"
            onClick={shuffleTeams}
            disabled={isShuffling || memberList.length < 2}
          >
            {isShuffling ? '섞는 중...' : '팀 짜기!'}
          </button>
        </div>
      </div>

      {teams.length > 0 && (
        <div className="teammaker-result">
          <div className="result-header">
            <h3>팀 구성 결과</h3>
            <div className="result-actions">
              <button onClick={copyTeams}>📋 복사</button>
              <button onClick={shuffleTeams} disabled={isShuffling}>🔄 다시 섞기</button>
              <button onClick={resetTeams}>✕ 초기화</button>
            </div>
          </div>

          <div className="teams-grid" style={{ '--team-count': teamCount }}>
            {teams.map((team, i) => (
              <div
                key={i}
                className={`team-card ${isShuffling ? 'shuffling' : ''}`}
                style={{ '--team-color': teamColors[i % teamColors.length] }}
              >
                <div className="team-header">
                  <span className="team-number">{i + 1}</span>
                  <span className="team-label">팀</span>
                  <span className="team-count">{team.length}명</span>
                </div>
                <div className="team-members">
                  {team.map((member, j) => (
                    <div key={j} className="team-member">
                      {member}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// 2048 게임
// ========================================
function Game2048({ user, onScoreUpdate, onBack }) {
  const [grid, setGrid] = useState(() => initializeGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const gameRef = useRef(null);

  function initializeGrid() {
    const newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }

  function addRandomTile(grid) {
    const empty = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) empty.push({ i, j });
      }
    }
    if (empty.length > 0) {
      const { i, j } = empty[Math.floor(Math.random() * empty.length)];
      grid[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function moveLeft(grid) {
    let moved = false;
    let addedScore = 0;
    const newGrid = grid.map(row => {
      const filtered = row.filter(x => x !== 0);
      const merged = [];
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          addedScore += filtered[i] * 2;
          i++;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      if (JSON.stringify(merged) !== JSON.stringify(row)) moved = true;
      return merged;
    });
    return { grid: newGrid, moved, addedScore };
  }

  function rotateGrid(grid, times) {
    let result = grid;
    for (let t = 0; t < times; t++) {
      result = result[0].map((_, i) => result.map(row => row[i]).reverse());
    }
    return result;
  }

  function move(direction) {
    if (gameOver) return;

    let rotations = { left: 0, up: 1, right: 2, down: 3 };
    let rotated = rotateGrid(grid, rotations[direction]);
    const { grid: movedGrid, moved, addedScore } = moveLeft(rotated);
    let finalGrid = rotateGrid(movedGrid, (4 - rotations[direction]) % 4);

    if (moved) {
      addRandomTile(finalGrid);
      const newScore = score + addedScore;
      setGrid(finalGrid);
      setScore(newScore);

      // Check for 2048
      if (!won && finalGrid.some(row => row.some(cell => cell >= 2048))) {
        setWon(true);
      }

      // Check game over
      if (isGameOver(finalGrid)) {
        setGameOver(true);
        submitScore(newScore);
      }
    }
  }

  function isGameOver(grid) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) return false;
        if (j < 3 && grid[i][j] === grid[i][j + 1]) return false;
        if (i < 3 && grid[i][j] === grid[i + 1][j]) return false;
      }
    }
    return true;
  }

  const submitScore = async (finalScore) => {
    try {
      const res = await api.submitGameScore('game2048', finalScore);
      if (res.data?.isNewRecord) {
        setBestScore(finalScore);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.game2048) {
          setBestScore(res.data.game2048.score);
          setRank(res.data.game2048.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    gameRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const dir = e.key.replace('Arrow', '').toLowerCase();
      move(dir);
    }
  };

  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    gameRef.current?.focus();
  };

  const getTileColor = (value) => {
    const colors = {
      0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
      16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
      256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
    };
    return colors[value] || '#3c3a32';
  };

  const getTextColor = (value) => value <= 4 ? '#776e65' : '#f9f6f2';

  return (
    <div className="game-2048" ref={gameRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="game-stats-bar">
        <div className="stat-item">
          <span className="stat-label">점수</span>
          <span className="stat-value">{score}</span>
        </div>
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">{bestScore}</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      <div className="game-2048-board-wrapper">
        <div className="game-2048-board">
          {grid.map((row, i) => (
            <div key={i} className="game-2048-row">
              {row.map((cell, j) => (
                <div
                  key={j}
                  className={`game-2048-tile ${cell > 0 ? 'has-value' : ''}`}
                  style={{
                    backgroundColor: getTileColor(cell),
                    color: getTextColor(cell),
                    fontSize: cell >= 1024 ? '24px' : cell >= 128 ? '28px' : '32px'
                  }}
                >
                  {cell > 0 ? cell : ''}
                </div>
              ))}
            </div>
          ))}
        </div>

        {(gameOver || won) && (
          <div className="game-2048-overlay">
            <div className="overlay-content">
              <h3>{won ? '🎉 2048 달성!' : '게임 오버!'}</h3>
              <p>최종 점수: {score}</p>
              {score === bestScore && <p className="new-record">★ 새 기록!</p>}
              <div className="overlay-buttons">
                <button className="restart-btn" onClick={resetGame}>다시 하기</button>
                <button className="back-btn" onClick={onBack}>게임 목록</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="game-2048-controls">
        <p className="control-hint">방향키로 이동 (←↑↓→)</p>
        <div className="mobile-controls">
          <button onClick={() => move('up')}>↑</button>
          <div className="mobile-controls-row">
            <button onClick={() => move('left')}>←</button>
            <button onClick={() => move('down')}>↓</button>
            <button onClick={() => move('right')}>→</button>
          </div>
        </div>
        <button className="restart-btn" onClick={resetGame}>다시 시작</button>
      </div>
    </div>
  );
}

// ========================================
// 에임 트레이너
// ========================================
function AimTrainerGame({ user, onScoreUpdate }) {
  const [state, setState] = useState('ready'); // ready, playing, result
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);
  const gameAreaRef = useRef(null);
  const timerRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const scoreRef = useRef(0);

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.aimtrainer) {
          setBestScore(res.data.aimtrainer.score);
          setRank(res.data.aimtrainer.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(spawnIntervalRef.current);
    };
  }, []);

  const spawnTarget = useCallback(() => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();

    // 점수에 따라 타겟 크기 감소 (35 → 최소 18)
    const currentScore = scoreRef.current;
    const size = Math.max(18, 35 - Math.floor(currentScore / 5) * 2);

    const maxX = rect.width - size;
    const maxY = rect.height - size;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    const id = Date.now() + Math.random();

    setTargets(prev => [...prev, { id, x, y, size }]);

    // 점수에 따라 사라지는 시간 감소 (700ms → 최소 350ms)
    const disappearTime = Math.max(350, 700 - currentScore * 10);
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== id));
    }, disappearTime);
  }, []);

  const startGame = () => {
    setState('playing');
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(30);
    setTargets([]);

    // 빠른 스폰 간격 (300ms, 점수 올라가면 더 빨라짐)
    const spawn = () => {
      spawnTarget();
      // 점수에 따라 스폰 속도 증가 (300ms → 최소 150ms)
      const nextSpawn = Math.max(150, 300 - scoreRef.current * 5);
      spawnIntervalRef.current = setTimeout(spawn, nextSpawn);
    };
    spawn();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearTimeout(spawnIntervalRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = async () => {
    setState('result');
    const finalScore = scoreRef.current;
    try {
      const res = await api.submitGameScore('aimtrainer', finalScore);
      if (res.data?.isNewRecord) {
        setBestScore(finalScore);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  const hitTarget = (id) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    scoreRef.current += 1;
    setScore(scoreRef.current);
  };

  return (
    <div className="aim-trainer-game">
      <div className="game-stats-bar">
        {state === 'playing' && (
          <>
            <div className="stat-item time">
              <span className="stat-label">남은 시간</span>
              <span className="stat-value">{timeLeft}초</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">점수</span>
              <span className="stat-value">{score}</span>
            </div>
          </>
        )}
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">{bestScore}개</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="aim-ready">
          <div className="aim-icon">◉</div>
          <h3>에임 트레이너</h3>
          <p>30초 동안 나타나는 타겟을 최대한 많이 클릭하세요!</p>
          <button className="start-btn" onClick={startGame}>시작</button>
        </div>
      )}

      {state === 'playing' && (
        <div className="aim-area" ref={gameAreaRef}>
          {targets.map(target => (
            <div
              key={target.id}
              className="aim-target"
              style={{
                left: target.x,
                top: target.y,
                width: target.size,
                height: target.size
              }}
              onClick={() => hitTarget(target.id)}
            >
              <div className="target-inner"></div>
            </div>
          ))}
        </div>
      )}

      {state === 'result' && (
        <div className="aim-result">
          <h3>게임 종료!</h3>
          <div className="result-score">{score}개</div>
          {score === bestScore && <p className="new-record">★ 새 기록!</p>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

// ========================================
// 색 구별 테스트
// ========================================
function ColorTestGame({ user, onScoreUpdate }) {
  const [state, setState] = useState('ready');
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(2);
  const [differentIndex, setDifferentIndex] = useState(0);
  const [baseColor, setBaseColor] = useState({ h: 0, s: 70, l: 50 });
  const [bestLevel, setBestLevel] = useState(null);
  const [rank, setRank] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef(null);

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.colortest) {
          setBestLevel(res.data.colortest.score);
          setRank(res.data.colortest.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    return () => clearInterval(timerRef.current);
  }, []);

  const startGame = () => {
    setState('playing');
    setLevel(1);
    generateLevel(1);
  };

  const generateLevel = (lvl) => {
    // Grid size increases with level
    const size = Math.min(2 + Math.floor(lvl / 3), 8);
    setGridSize(size);

    // Color difference decreases with level
    const diff = Math.max(30 - lvl * 2, 3);

    // Random base color
    const h = Math.floor(Math.random() * 360);
    const s = 50 + Math.floor(Math.random() * 30);
    const l = 40 + Math.floor(Math.random() * 20);
    setBaseColor({ h, s, l, diff });

    // Random different tile
    setDifferentIndex(Math.floor(Math.random() * (size * size)));

    // Reset timer
    setTimeLeft(Math.max(10 - Math.floor(lvl / 5), 3));
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          gameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClick = (index) => {
    if (index === differentIndex) {
      // Correct!
      const newLevel = level + 1;
      setLevel(newLevel);
      generateLevel(newLevel);
    } else {
      // Wrong!
      gameOver();
    }
  };

  const gameOver = async () => {
    clearInterval(timerRef.current);
    setState('result');
    try {
      const res = await api.submitGameScore('colortest', level);
      if (res.data?.isNewRecord) {
        setBestLevel(level);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  const getColor = (isDifferent) => {
    const { h, s, l, diff } = baseColor;
    if (isDifferent) {
      return `hsl(${h}, ${s}%, ${l + diff}%)`;
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  return (
    <div className="color-test-game">
      <div className="game-stats-bar">
        {state === 'playing' && (
          <>
            <div className="stat-item">
              <span className="stat-label">레벨</span>
              <span className="stat-value">{level}</span>
            </div>
            <div className="stat-item time">
              <span className="stat-label">시간</span>
              <span className="stat-value">{timeLeft}초</span>
            </div>
          </>
        )}
        {bestLevel && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">레벨 {bestLevel}</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="color-ready">
          <div className="color-icon">▩</div>
          <h3>색 구별 테스트</h3>
          <p>다른 색의 타일을 찾아 클릭하세요!</p>
          <p className="sub-text">레벨이 올라갈수록 색 차이가 줄어듭니다</p>
          <button className="start-btn" onClick={startGame}>시작</button>
        </div>
      )}

      {state === 'playing' && (
        <div
          className="color-grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => (
            <div
              key={i}
              className="color-tile"
              style={{ backgroundColor: getColor(i === differentIndex) }}
              onClick={() => handleClick(i)}
            />
          ))}
        </div>
      )}

      {state === 'result' && (
        <div className="color-result">
          <h3>게임 오버!</h3>
          <div className="result-score">레벨 {level}</div>
          {level === bestLevel && <p className="new-record">★ 새 기록!</p>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

// ========================================
// Snake 게임
// ========================================
function SnakeGame({ user, onScoreUpdate }) {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const INITIAL_SPEED = 150;

  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [state, setState] = useState('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const directionRef = useRef(direction);
  const gameLoopRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.snake) {
          setBestScore(res.data.snake.score);
          setRank(res.data.snake.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    return () => clearInterval(gameLoopRef.current);
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const spawnFood = (snakeBody) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakeBody.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  };

  const startGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(spawnFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setState('playing');
    gameRef.current?.focus();

    gameLoopRef.current = setInterval(() => {
      moveSnake();
    }, INITIAL_SPEED);
  };

  const moveSnake = () => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const dir = directionRef.current;
      const newHead = {
        x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        clearInterval(gameLoopRef.current);
        setTimeout(() => gameOver(prevSnake.length - 1), 0);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      setFood(prevFood => {
        if (newHead.x === prevFood.x && newHead.y === prevFood.y) {
          setScore(s => s + 10);
          return spawnFood(newSnake);
        }
        newSnake.pop(); // Remove tail if no food eaten
        return prevFood;
      });

      return newSnake;
    });
  };

  const gameOver = async (finalScore) => {
    setState('result');
    try {
      const res = await api.submitGameScore('snake', finalScore);
      if (res.data?.isNewRecord) {
        setBestScore(finalScore);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  const handleKeyDown = (e) => {
    if (state !== 'playing') return;
    const { x, y } = directionRef.current;

    switch (e.key) {
      case 'ArrowUp':
        if (y !== 1) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (y !== -1) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (x !== 1) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (x !== -1) setDirection({ x: 1, y: 0 });
        break;
    }
    e.preventDefault();
  };

  const handleMobileControl = (dir) => {
    if (state !== 'playing') return;
    const { x, y } = directionRef.current;
    if (dir === 'up' && y !== 1) setDirection({ x: 0, y: -1 });
    if (dir === 'down' && y !== -1) setDirection({ x: 0, y: 1 });
    if (dir === 'left' && x !== 1) setDirection({ x: -1, y: 0 });
    if (dir === 'right' && x !== -1) setDirection({ x: 1, y: 0 });
  };

  return (
    <div className="snake-game" ref={gameRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="game-stats-bar">
        <div className="stat-item">
          <span className="stat-label">점수</span>
          <span className="stat-value">{score}</span>
        </div>
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">{bestScore}</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="snake-ready">
          <div className="snake-icon">▬</div>
          <h3>Snake</h3>
          <p>방향키로 뱀을 조종하세요!</p>
          <button className="start-btn" onClick={startGame}>시작</button>
        </div>
      )}

      {(state === 'playing' || state === 'result') && (
        <>
          <div
            className="snake-board"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE
            }}
          >
            {snake.map((seg, i) => (
              <div
                key={i}
                className={`snake-segment ${i === 0 ? 'head' : ''}`}
                style={{
                  left: seg.x * CELL_SIZE,
                  top: seg.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2
                }}
              />
            ))}
            <div
              className="snake-food"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2
              }}
            />
          </div>

          <div className="mobile-controls">
            <button onClick={() => handleMobileControl('up')}>↑</button>
            <div className="mobile-controls-row">
              <button onClick={() => handleMobileControl('left')}>←</button>
              <button onClick={() => handleMobileControl('down')}>↓</button>
              <button onClick={() => handleMobileControl('right')}>→</button>
            </div>
          </div>
        </>
      )}

      {state === 'result' && (
        <div className="snake-result-overlay">
          <h3>게임 오버!</h3>
          <p>점수: {score}</p>
          {score === bestScore && <p className="new-record">★ 새 기록!</p>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

// ========================================
// 장애물 피하기 (Flappy style)
// ========================================
function FlappyGame({ user, onScoreUpdate }) {
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 60;
  const GAP_HEIGHT = 150;
  const GRAVITY = 0.5;
  const JUMP_FORCE = -8;

  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [state, setState] = useState('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [rank, setRank] = useState(null);

  const birdYRef = useRef(birdY);
  const birdVelocityRef = useRef(birdVelocity);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const gameLoopRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.flappy) {
          setBestScore(res.data.flappy.score);
          setRank(res.data.flappy.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const startGame = () => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    birdYRef.current = GAME_HEIGHT / 2;
    birdVelocityRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setState('playing');
    gameRef.current?.focus();

    let lastPipeTime = 0;
    const gameLoop = (timestamp) => {
      // Update bird
      birdVelocityRef.current += GRAVITY;
      birdYRef.current += birdVelocityRef.current;
      setBirdY(birdYRef.current);
      setBirdVelocity(birdVelocityRef.current);

      // Spawn pipes
      if (timestamp - lastPipeTime > 2000) {
        const gapY = 100 + Math.random() * (GAME_HEIGHT - GAP_HEIGHT - 200);
        pipesRef.current = [...pipesRef.current, { x: GAME_WIDTH, gapY, passed: false }];
        lastPipeTime = timestamp;
      }

      // Update pipes
      pipesRef.current = pipesRef.current
        .map(pipe => ({ ...pipe, x: pipe.x - 3 }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);
      setPipes([...pipesRef.current]);

      // Check collisions
      const birdTop = birdYRef.current;
      const birdBottom = birdYRef.current + BIRD_SIZE;
      const birdLeft = 50;
      const birdRight = 50 + BIRD_SIZE;

      // Floor/ceiling collision
      if (birdTop < 0 || birdBottom > GAME_HEIGHT) {
        gameOver();
        return;
      }

      // Pipe collision
      for (const pipe of pipesRef.current) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < pipe.gapY || birdBottom > pipe.gapY + GAP_HEIGHT) {
            gameOver();
            return;
          }
        }

        // Score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
          pipe.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const gameOver = async () => {
    cancelAnimationFrame(gameLoopRef.current);
    setState('result');
    const finalScore = scoreRef.current;
    try {
      const res = await api.submitGameScore('flappy', finalScore);
      if (res.data?.isNewRecord) {
        setBestScore(finalScore);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  const jump = () => {
    if (state === 'playing') {
      birdVelocityRef.current = JUMP_FORCE;
      setBirdVelocity(JUMP_FORCE);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  };

  return (
    <div className="flappy-game" ref={gameRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="game-stats-bar">
        <div className="stat-item">
          <span className="stat-label">점수</span>
          <span className="stat-value">{score}</span>
        </div>
        {bestScore && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">{bestScore}</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="flappy-ready">
          <div className="flappy-icon">△</div>
          <h3>장애물 피하기</h3>
          <p>스페이스바 또는 클릭으로 점프!</p>
          <button className="start-btn" onClick={startGame}>시작</button>
        </div>
      )}

      {(state === 'playing' || state === 'result') && (
        <div
          className="flappy-area"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={jump}
        >
          <div
            className="flappy-bird"
            style={{
              top: birdY,
              left: 50,
              width: BIRD_SIZE,
              height: BIRD_SIZE
            }}
          />
          {pipes.map((pipe, i) => (
            <div key={i}>
              <div
                className="flappy-pipe top"
                style={{
                  left: pipe.x,
                  width: PIPE_WIDTH,
                  height: pipe.gapY
                }}
              />
              <div
                className="flappy-pipe bottom"
                style={{
                  left: pipe.x,
                  width: PIPE_WIDTH,
                  top: pipe.gapY + GAP_HEIGHT,
                  height: GAME_HEIGHT - pipe.gapY - GAP_HEIGHT
                }}
              />
            </div>
          ))}
        </div>
      )}

      {state === 'result' && (
        <div className="flappy-result-overlay">
          <h3>게임 오버!</h3>
          <p>점수: {score}</p>
          {score === bestScore && <p className="new-record">★ 새 기록!</p>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

// ========================================
// 패턴 기억 게임 (Simon Says)
// ========================================
function PatternGame({ user, onScoreUpdate }) {
  const [pattern, setPattern] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [state, setState] = useState('ready'); // ready, showing, input, result
  const [level, setLevel] = useState(0);
  const [activeButton, setActiveButton] = useState(null);
  const [bestLevel, setBestLevel] = useState(null);
  const [rank, setRank] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const gameOverRef = useRef(null);

  const colors = ['red', 'blue', 'green', 'yellow'];

  useEffect(() => {
    const loadMyBest = async () => {
      try {
        const res = await api.getMyGameScores();
        if (res.data?.pattern) {
          setBestLevel(res.data.pattern.score);
          setRank(res.data.pattern.rank);
        }
      } catch (e) {}
    };
    loadMyBest();
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    setPattern([]);
    setUserInput([]);
    setLevel(0);
    nextRound([]);
  };

  const nextRound = (currentPattern) => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    const newPattern = [...currentPattern, newColor];
    setPattern(newPattern);
    setLevel(newPattern.length);
    setUserInput([]);
    setState('showing');
    showPattern(newPattern);
  };

  const showPattern = async (patternToShow) => {
    const patternLength = patternToShow.length;
    // 레벨이 올라갈수록 속도 증가 (간격: 400ms → 150ms, 표시: 300ms → 120ms)
    const interval = Math.max(150, 400 - patternLength * 25);
    const showTime = Math.max(120, 300 - patternLength * 18);

    for (let i = 0; i < patternToShow.length; i++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      setActiveButton(patternToShow[i]);
      await new Promise(resolve => setTimeout(resolve, showTime));
      setActiveButton(null);
    }
    setState('input');

    // 입력 시간 제한 시작 (레벨당 1.5초 + 기본 2초, 최대 10초)
    const inputTime = Math.min(10, 2 + patternLength * 1.5);
    setTimeLeft(Math.ceil(inputTime));
    gameOverRef.current = () => gameOver();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          gameOverRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleButtonClick = async (color) => {
    if (state !== 'input') return;

    setActiveButton(color);
    setTimeout(() => setActiveButton(null), 200);

    const newInput = [...userInput, color];
    setUserInput(newInput);

    // Check if correct
    if (color !== pattern[newInput.length - 1]) {
      // Wrong!
      gameOver();
      return;
    }

    // Check if pattern complete
    if (newInput.length === pattern.length) {
      clearInterval(timerRef.current);
      setState('showing');
      await new Promise(resolve => setTimeout(resolve, 600));
      nextRound(pattern);
    }
  };

  const gameOver = async () => {
    clearInterval(timerRef.current);
    setState('result');
    const finalLevel = level;
    try {
      const res = await api.submitGameScore('pattern', finalLevel);
      if (res.data?.isNewRecord) {
        setBestLevel(finalLevel);
        setRank(res.data.rank);
        onScoreUpdate?.();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  };

  return (
    <div className="pattern-game">
      <div className="game-stats-bar">
        {state !== 'ready' && (
          <div className="stat-item">
            <span className="stat-label">레벨</span>
            <span className="stat-value">{level}</span>
          </div>
        )}
        {bestLevel && (
          <div className="stat-item best">
            <span className="stat-label">최고</span>
            <span className="stat-value">레벨 {bestLevel}</span>
            {rank && <span className="stat-rank">#{rank}</span>}
          </div>
        )}
      </div>

      {state === 'ready' && (
        <div className="pattern-ready">
          <div className="pattern-icon">◈</div>
          <h3>패턴 기억</h3>
          <p>빛나는 순서를 기억하고 따라하세요!</p>
          <button className="start-btn" onClick={startGame}>시작</button>
        </div>
      )}

      {state !== 'ready' && state !== 'result' && (
        <>
          <div className="pattern-status">
            {state === 'showing' ? '패턴을 기억하세요...' : `입력: ${userInput.length}/${pattern.length} (${timeLeft}초)`}
          </div>
          <div className="pattern-buttons">
            {colors.map(color => (
              <button
                key={color}
                className={`pattern-btn ${color} ${activeButton === color ? 'active' : ''}`}
                onClick={() => handleButtonClick(color)}
                disabled={state !== 'input'}
              />
            ))}
          </div>
        </>
      )}

      {state === 'result' && (
        <div className="pattern-result">
          <h3>게임 오버!</h3>
          <div className="result-score">레벨 {level}</div>
          {level === bestLevel && <p className="new-record">★ 새 기록!</p>}
          <button className="restart-btn" onClick={startGame}>다시 하기</button>
        </div>
      )}
    </div>
  );
}

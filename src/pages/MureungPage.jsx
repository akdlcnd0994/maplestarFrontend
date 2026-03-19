import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const MUREUNG_JOBS = [
  { group: 110, name: '히어로' },
  { group: 120, name: '팔라딘' },
  { group: 130, name: '다크나이트' },
  { group: 210, name: '위자드(불,독)' },
  { group: 220, name: '위자드(썬,콜)' },
  { group: 230, name: '비숍' },
  { group: 310, name: '보우마스터' },
  { group: 320, name: '신궁' },
  { group: 410, name: '나이트로드' },
  { group: 420, name: '섀도어' },
  { group: 430, name: '듀얼블레이더' },
  { group: 510, name: '바이퍼' },
  { group: 520, name: '캡틴' },
  { group: 530, name: '캐논슈터' },
  { group: 2110, name: '아란' },
  { group: 2210, name: '에반' },
  { group: 2310, name: '메르세데스' },
  { group: 3110, name: '데몬슬레이어' },
  { group: 3210, name: '배틀메이지' },
  { group: 3310, name: '와일드헌터' },
  { group: 3510, name: '메카닉' },
  { group: 4110, name: '하야토' },
  { group: 4210, name: '칸나' },
  { group: 2410, name: '팬텀' },
];

// 점수 포맷팅: 억/만 단위 (예: 4,444,945,495 → "44억 4494만")
function formatScore(score) {
  const n = Number(score);
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  if (man > 0) return `${man}만`;
  return n.toLocaleString();
}

function RoundBadge({ round }) {
  if (!round) return null;
  return (
    <div className="mureung-round-badge">
      <span className="mureung-round-boss">{round.boss_name || '무릉도장'}</span>
      <span className="mureung-round-date">
        {round.round_start} ~ {round.round_end}
      </span>
    </div>
  );
}

function Avatar({ src, name, size = 40 }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="mureung-avatar-placeholder" style={{ width: size, height: size }}>
        {name?.[0] || '?'}
      </div>
    );
  }
  return (
    <div className="mureung-avatar-wrap" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={name}
        className="mureung-avatar"
        onError={() => setError(true)}
      />
    </div>
  );
}

function RankingTable({ rankings, showJob = true, showJobRank = false, showPrevRank = false, showRound = false }) {
  if (!rankings || rankings.length === 0) {
    return <div className="mureung-empty">데이터가 없습니다.</div>;
  }
  return (
    <div className="mureung-table-wrap">
      <table className="mureung-table">
        <thead>
          <tr>
            <th>순위</th>
            <th>캐릭터</th>
            {showJob && <th>직업</th>}
            <th style={{ textAlign: 'right' }}>점수</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, idx) => (
            <tr key={`${r.username}-${idx}`} className={idx < 3 ? `mureung-top${idx + 1}` : ''}>
              <td className="mureung-rank-cell">
                {idx === 0 && <span className="mureung-medal">🥇</span>}
                {idx === 1 && <span className="mureung-medal">🥈</span>}
                {idx === 2 && <span className="mureung-medal">🥉</span>}
                {idx >= 3 && <span className="mureung-rank-num">{r.rank || idx + 1}</span>}
              </td>
              <td>
                <div className="mureung-char-cell">
                  <Avatar src={r.avatar_img} name={r.username} size={120} />
                  <div className="mureung-char-info">
                    <span className="mureung-username">{r.username}</span>
                    {(r.userlevel || r.userguild) && (
                      <span className="mureung-char-sub">
                        {r.userlevel ? `Lv.${r.userlevel}` : ''}
                        {r.userlevel && r.userguild ? ' · ' : ''}
                        {r.userguild || ''}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              {showJob && (
                <td className="mureung-job-cell">
                  {r.job_name}
                  {showJobRank && r.job_rank != null && (
                    <span className="mureung-job-rank">({r.job_rank}위)</span>
                  )}
                </td>
              )}
              <td className="mureung-score-cell">
                <div className="mureung-score-wrap">
                  <span>{formatScore(r.score)}</span>
                  {showPrevRank && r.prev_job_rank != null && (
                    <span className="mureung-prev-rank">전회차 직업 {r.prev_job_rank}위</span>
                  )}
                  {showRound && r.round_start && (
                    <span className="mureung-round-info">
                      {r.boss_name && <span className="mureung-round-boss-tag">{r.boss_name}</span>}
                      <span>{r.round_start} ~ {r.round_end}</span>
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 종합랭킹 탭 ────────────────────────────────────────────
function OverallTab() {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getMureungRounds()
      .then((res) => {
        const list = (res.data || []).filter((r) => !r.is_current);
        setRounds(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    api.getMureungOverall(selectedRound || null)
      .then((res) => setData(res.data))
      .catch(() => setErr('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedRound]);

  return (
    <div className="mureung-tab-content">
      <div className="mureung-filters">
        <select
          className="mureung-select"
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
        >
          <option value="">현재 회차</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.round_start} ~ {r.round_end}{r.boss_name ? ` (${r.boss_name})` : ''}
            </option>
          ))}
        </select>
      </div>
      <RoundBadge round={data?.round} />
      {!loading && !err && !data?.round && (
        <div className="mureung-empty">스크래핑된 데이터가 없습니다.</div>
      )}
      {loading ? (
        <div className="mureung-loading">불러오는 중...</div>
      ) : err ? (
        <div className="mureung-error">{err}</div>
      ) : (
        <RankingTable rankings={data?.rankings} showJob={true} showJobRank={true} showPrevRank={selectedRound === ''} />
      )}
    </div>
  );
}

// ─── 직업랭킹 탭 ────────────────────────────────────────────
function JobTab() {
  const [selectedJob, setSelectedJob] = useState(MUREUNG_JOBS[0].group);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getMureungRounds()
      .then((res) => {
        // is_current=1 회차는 "현재 회차" 옵션과 중복이므로 제외
        const list = (res.data || []).filter((r) => !r.is_current);
        setRounds(list);
      })
      .catch(() => {});
  }, []);

  const loadJob = useCallback(() => {
    setLoading(true);
    setErr(null);
    api.getMureungJob(selectedJob, selectedRound || null)
      .then((res) => setData(res.data))
      .catch(() => setErr('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedJob, selectedRound]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  return (
    <div className="mureung-tab-content">
      <div className="mureung-filters">
        <select
          className="mureung-select"
          value={selectedJob}
          onChange={(e) => setSelectedJob(Number(e.target.value))}
        >
          {MUREUNG_JOBS.map((j) => (
            <option key={j.group} value={j.group}>{j.name}</option>
          ))}
        </select>
        <select
          className="mureung-select"
          value={selectedRound}
          onChange={(e) => setSelectedRound(e.target.value)}
        >
          <option value="">현재 회차</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.round_start} ~ {r.round_end}{r.boss_name ? ` (${r.boss_name})` : ''}
            </option>
          ))}
        </select>
      </div>
      {data?.round && <RoundBadge round={data.round} />}
      {loading ? (
        <div className="mureung-loading">불러오는 중...</div>
      ) : err ? (
        <div className="mureung-error">{err}</div>
      ) : (
        <RankingTable rankings={data?.rankings} showJob={false} showPrevRank={true} />
      )}
    </div>
  );
}

// ─── 역대기록 탭 ────────────────────────────────────────────
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.getMureungHistory()
      .then((res) => setHistory(res.data || []))
      .catch(() => setErr('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mureung-tab-content">
      <p className="mureung-history-desc">전 회차 통합 최고 점수 TOP 10</p>
      {loading ? (
        <div className="mureung-loading">불러오는 중...</div>
      ) : err ? (
        <div className="mureung-error">{err}</div>
      ) : (
        <RankingTable rankings={history} showJob={true} showRound={true} />
      )}
    </div>
  );
}

// ─── 길드랭킹 탭 ────────────────────────────────────────────
function GuildTab() {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [expandedGuild, setExpandedGuild] = useState(null);
  const [sortBy, setSortBy] = useState('medal'); // 'medal' | 'total'

  useEffect(() => {
    api.getMureungRounds()
      .then((res) => {
        const list = (res.data || []).filter((r) => !r.is_current);
        setRounds(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setErr(null);
    api.getMureungGuildRanking(selectedRound || null)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setErr('데이터를 불러오지 못했습니다.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRound]);

  const sortedRankings = data?.rankings
    ? sortBy === 'total'
      ? [...data.rankings].sort((a, b) => b.total_score - a.total_score)
      : data.rankings
    : [];

  // 상위30 멤버를 길드별로 그룹핑
  const membersByGuild = (data?.medal_members || []).reduce((acc, m) => {
    if (!acc[m.guild]) acc[m.guild] = [];
    acc[m.guild].push(m);
    return acc;
  }, {});

  const MEDAL_LABEL = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="mureung-tab-content">
      <div className="mureung-filters">
        <select
          className="mureung-select"
          value={selectedRound}
          onChange={(e) => { setSelectedRound(e.target.value); setExpandedGuild(null); }}
        >
          <option value="">현재 회차</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.round_start} ~ {r.round_end}{r.boss_name ? ` (${r.boss_name})` : ''}
            </option>
          ))}
        </select>
        <div className="mureung-sort-tabs">
          <button
            type="button"
            className={`mureung-sort-tab${sortBy === 'medal' ? ' active' : ''}`}
            onClick={() => setSortBy('medal')}
          >금은동 기준</button>
          <button
            type="button"
            className={`mureung-sort-tab${sortBy === 'total' ? ' active' : ''}`}
            onClick={() => setSortBy('total')}
          >총합 기준</button>
        </div>
      </div>
      <RoundBadge round={data?.round} />
      {loading ? (
        <div className="mureung-loading">불러오는 중...</div>
      ) : err ? (
        <div className="mureung-error">{err}</div>
      ) : !data?.rankings?.length ? (
        <div className="mureung-empty">데이터가 없습니다.</div>
      ) : (
        <div className="mureung-table-wrap">
          <table className="mureung-table mureung-guild-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>길드</th>
                <th style={{ textAlign: 'center' }}>🥇</th>
                <th style={{ textAlign: 'center' }}>🥈</th>
                <th style={{ textAlign: 'center' }}>🥉</th>
                <th style={{ textAlign: 'right' }}>길드원 총합(상위30)</th>
              </tr>
            </thead>
            <tbody>
              {sortedRankings.map((g, idx) => {
                const isExpanded = expandedGuild === g.guild;
                const members = membersByGuild[g.guild] || [];
                const rowClass = idx < 3 ? `mureung-top${idx + 1}` : '';
                return (
                  <Fragment key={g.guild}>
                    <tr
                      className={`${rowClass} mureung-guild-row mureung-guild-row-clickable`}
                      onClick={() => setExpandedGuild(isExpanded ? null : g.guild)}
                    >
                      <td className="mureung-rank-cell">
                        {(() => {
                          const rank = sortBy === 'total' ? idx + 1 : g.guild_rank;
                          if (rank === 1) return <span className="mureung-medal">🥇</span>;
                          if (rank === 2) return <span className="mureung-medal">🥈</span>;
                          if (rank === 3) return <span className="mureung-medal">🥉</span>;
                          return <span className="mureung-rank-num">{rank}</span>;
                        })()}
                      </td>
                      <td className="mureung-guild-name-cell">
                        <span className="mureung-guild-name">{g.guild === '-' ? '(길드없음)' : g.guild}</span>
                        <span className="mureung-guild-toggle">{isExpanded ? '▲' : '▼'}</span>
                      </td>
                      <td className="mureung-medal-count">{g.gold || 0}</td>
                      <td className="mureung-medal-count">{g.silver || 0}</td>
                      <td className="mureung-medal-count">{g.bronze || 0}</td>
                      <td className="mureung-score-cell">{formatScore(g.total_score)}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${g.guild}-detail`} className="mureung-guild-detail-row">
                        <td colSpan={6}>
                          <div className="mureung-guild-members">
                            {members.map((m, mi) => (
                              <div key={`${m.username}-${mi}`} className="mureung-guild-member-item">
                                <Avatar src={m.avatar_img} name={m.username} size={60} />
                                <div className="mureung-guild-member-info">
                                  <span className="mureung-guild-member-medal">
                                    {MEDAL_LABEL[m.rank] ?? `${mi + 1}위`}
                                  </span>
                                  <span className="mureung-username">{m.username}</span>
                                  <span className="mureung-char-sub">{m.job_name}</span>
                                  <span className="mureung-score-cell">{formatScore(m.score)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── 관리자 패널 ────────────────────────────────────────────
function AdminPanel() {
  const [scraping, setScraping] = useState(false);
  const [scrapingHistory, setScrapingHistory] = useState(false);
  const [warmingCache, setWarmingCache] = useState(false);
  const [result, setResult] = useState(null);

  const handleScrape = async () => {
    if (!confirm('무릉도장 스크래핑을 시작합니다. (시간이 걸릴 수 있습니다)')) return;
    setScraping(true);
    setResult(null);
    try {
      const res = await api.scrapeMureung();
      setResult({ success: true, message: res.data?.message || '완료' });
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
    setScraping(false);
  };

  const handleScrapeAllHistory = async () => {
    if (!confirm('자쿰(2025.10.20)부터 역대 모든 회차를 스크래핑합니다.\n로컬 환경에서만 실행하세요. (수분 소요)')) return;
    setScrapingHistory(true);
    setResult(null);
    try {
      const res = await api.scrapeMureungAllHistory();
      setResult({ success: true, message: res.data?.message || '역대 기록 스크래핑 완료' });
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
    setScrapingHistory(false);
  };

  const handleWarmCache = async () => {
    if (!confirm('과거 회차 서버 캐시 워밍을 시작합니다.\n이미 캐싱된 회차는 스킵됩니다.\n\n백그라운드에서 실행되며 즉시 완료됩니다.')) return;
    setWarmingCache(true);
    setResult(null);
    try {
      const res = await api.warmMureungCache();
      setResult({ success: true, message: res.data?.message || '캐시 워밍 시작됨 (백그라운드 실행 중)' });
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
    setWarmingCache(false);
  };

  const isLoading = scraping || scrapingHistory || warmingCache;

  return (
    <div className="mureung-admin-panel">
      <h4>관리자</h4>
      <div className="mureung-admin-buttons">
        <button className="btn-primary" onClick={handleScrape} disabled={isLoading}>
          {scraping ? '스크래핑 중...' : '현재 회차 스크래핑'}
        </button>
        <button className="btn-secondary" onClick={handleScrapeAllHistory} disabled={isLoading}>
          {scrapingHistory ? '역대 기록 스크래핑 중...' : '역대 기록 전체 스크래핑'}
        </button>
        <button className="btn-secondary" onClick={handleWarmCache} disabled={isLoading}>
          {warmingCache ? '캐시 워밍 중...' : '과거 회차 캐시 워밍'}
        </button>
      </div>
      {result && (
        <p className={result.success ? 'mureung-result-ok' : 'mureung-result-err'}>
          {result.message}
        </p>
      )}
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function MureungPage({ initialTab = 'overall' }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'overall', label: '종합랭킹' },
    { id: 'job', label: '직업랭킹' },
    { id: 'guild', label: '길드랭킹' },
    { id: 'history', label: '역대기록' },
  ];

  return (
    <div className="mureung-page">
      <div className="page-header">
        <h2>무릉도장 랭킹</h2>
      </div>

      <div className="mureung-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`mureung-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overall' && <OverallTab />}
      {tab === 'job' && <JobTab />}
      {tab === 'guild' && <GuildTab />}
      {tab === 'history' && <HistoryTab />}

      {user?.role === 'master' && <AdminPanel />}
    </div>
  );
}

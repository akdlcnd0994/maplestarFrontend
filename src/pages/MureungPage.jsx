import { useState, useEffect, useCallback } from 'react';
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
    <img
      src={src}
      alt={name}
      className="mureung-avatar"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

function RankingTable({ rankings, showJob = true, showJobRank = false, showPrevRank = false }) {
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
                  <Avatar src={r.avatar_img} name={r.username} size={100} />
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getMureungOverall()
      .then((res) => setData(res.data))
      .catch(() => setErr('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mureung-loading">불러오는 중...</div>;
  if (err) return <div className="mureung-error">{err}</div>;

  return (
    <div className="mureung-tab-content">
      <RoundBadge round={data?.round} />
      {!data?.round && (
        <div className="mureung-empty">스크래핑된 데이터가 없습니다.</div>
      )}
      <RankingTable rankings={data?.rankings} showJob={true} showJobRank={true} showPrevRank={true} />
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
        <RankingTable rankings={history} showJob={true} />
      )}
    </div>
  );
}

// ─── 관리자 패널 ────────────────────────────────────────────
function AdminPanel() {
  const [scraping, setScraping] = useState(false);
  const [scrapingHistory, setScrapingHistory] = useState(false);
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

  return (
    <div className="mureung-admin-panel">
      <h4>관리자</h4>
      <div className="mureung-admin-buttons">
        <button className="btn-primary" onClick={handleScrape} disabled={scraping || scrapingHistory}>
          {scraping ? '스크래핑 중...' : '현재 회차 스크래핑'}
        </button>
        <button className="btn-secondary" onClick={handleScrapeAllHistory} disabled={scraping || scrapingHistory}>
          {scrapingHistory ? '역대 기록 스크래핑 중...' : '역대 기록 전체 스크래핑'}
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
      {tab === 'history' && <HistoryTab />}

      {user?.role === 'master' && <AdminPanel />}
    </div>
  );
}

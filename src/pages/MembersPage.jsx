import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getIconEmoji } from '../components/UserAvatar';
import { formatDate } from '../utils/format';
import StyledName from '../components/StyledName';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts';

// 레벨 변화 커스텀 툴팁
function LevelTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ color: '#888', marginBottom: 2 }}>{d.userdate} {d.usertime}시</div>
      <div style={{ fontWeight: 700, color: '#2563eb' }}>Lv.{d.userlevel}</div>
      <div style={{ color: '#666' }}>{d.userrank ? `${d.userrank}위` : ''}</div>
    </div>
  );
}

// 레벨 변화 차트 컴포넌트
function LevelChart({ data, loading }) {
  if (loading) {
    return (
      <div className="level-chart-section">
        <div className="level-chart-title">레벨 변화</div>
        <div className="level-chart-empty">불러오는 중...</div>
      </div>
    );
  }

  if (!data || data.length < 2) {
    return (
      <div className="level-chart-section">
        <div className="level-chart-title">레벨 변화</div>
        <div className="level-chart-empty">랭킹 데이터 없음</div>
      </div>
    );
  }

  // 레벨업 지점 (이전 데이터보다 레벨이 오른 포인트)
  const levelUpPoints = data.filter((d, i) => i > 0 && d.userlevel > data[i - 1].userlevel);

  // y축 범위 (여유 있게)
  const levels = data.map(d => d.userlevel);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const range = maxLevel - minLevel;
  const yMin = range === 0 ? minLevel - 1 : minLevel - Math.max(1, Math.floor(range * 0.1));
  const yMax = range === 0 ? maxLevel + 1 : maxLevel + Math.max(1, Math.ceil(range * 0.1));

  // x축 라벨: 너무 많으면 간격 줄임
  const tickInterval = data.length > 20 ? Math.floor(data.length / 10) : 0;

  return (
    <div className="level-chart-section">
      <div className="level-chart-title">레벨 변화 (30일)</div>
      <div className="level-chart-container">
        <ResponsiveContainer width="100%" height={560}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#999' }}
              angle={-45}
              textAnchor="end"
              interval={tickInterval}
              height={60}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: '#999' }}
              tickCount={5}
              allowDecimals={false}
            />
            <Tooltip content={<LevelTooltip />} />
            <Line
              type="monotone"
              dataKey="userlevel"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#2563eb' }}
            />
            {levelUpPoints.map((point, idx) => (
              <ReferenceDot
                key={idx}
                x={point.label}
                y={point.userlevel}
                r={5}
                fill="#16a34a"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {levelUpPoints.length > 0 && (
        <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
          ● 레벨업 {levelUpPoints.length}회 (30일 내)
        </div>
      )}
    </div>
  );
}

export default function MembersPage({ setPage, selectedMember, setSelectedMember }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [allianceFilter, setAllianceFilter] = useState('all');
  const [members, setMembers] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, honorary: 0 });
  const [showDetail, setShowDetail] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [levelHistory, setLevelHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState(null); // null = 본캐 기준

  const isMaster = user?.role === 'master';

  const roles = {
    master: { label: '길마', color: '#daa520' },
    submaster: { label: '부마', color: '#e07020' },
    member: { label: '길드원', color: '#6b4c35' },
    honorary: { label: '명예길드원', color: '#8b5cf6' },
  };

  useEffect(() => {
    loadMembers();
    loadAlliances();
  }, []);

  const loadAlliances = async () => {
    try {
      const res = await api.getAlliances();
      setAlliances(res.data || []);
    } catch (e) {
      console.error('Failed to load alliances:', e);
    }
  };

  // 메인페이지에서 선택된 멤버가 있으면 바로 표시
  useEffect(() => {
    if (selectedMember) {
      setShowDetail(selectedMember);
      setSelectedMember?.(null);
    }
  }, [selectedMember]);

  // 모달 열릴 때 본캐 히스토리 로드 + selectedAlt 초기화
  useEffect(() => {
    if (showDetail) {
      setSelectedAlt(null);
      loadLevelHistory(showDetail.character_name);
    } else {
      setSelectedAlt(null);
      setLevelHistory([]);
    }
  }, [showDetail]);

  const loadLevelHistory = async (username) => {
    if (!username) return;
    setHistoryLoading(true);
    setLevelHistory([]);
    try {
      const res = await api.request(`/ranking/history/${encodeURIComponent(username)}?days=30`);
      const data = res.data || [];
      // 차트용 데이터 변환
      const chartData = data.map(row => ({
        ...row,
        label: `${row.userdate.slice(5)} ${row.usertime}시`,
      }));
      setLevelHistory(chartData);
    } catch (e) {
      console.error('히스토리 로드 실패:', e);
    }
    setHistoryLoading(false);
  };

  const handleAltClick = (alt) => {
    setSelectedAlt(alt);
    loadLevelHistory(alt.username);
  };

  const handleBackToMain = () => {
    setSelectedAlt(null);
    loadLevelHistory(showDetail.character_name);
  };

  const loadMembers = async () => {
    try {
      const res = await api.getMembers();
      const data = res.data || [];
      setMembers(data);
      setStats({
        total: data.length,
        online: data.filter(m => m.is_online).length,
        honorary: data.filter(m => m.role === 'honorary').length,
      });
    } catch (e) {
      console.error('Failed to load members:', e);
    }
    setLoading(false);
  };

  const getFiltered = () => {
    let result = members;

    // 역할 필터
    switch (filter) {
      case 'online':
        result = result.filter(m => m.is_online);
        break;
      case 'master':
        result = result.filter(m => m.role === 'master');
        break;
      case 'submaster':
        result = result.filter(m => m.role === 'submaster');
        break;
      case 'honorary':
        result = result.filter(m => m.role === 'honorary');
        break;
    }

    // 길드 필터
    if (allianceFilter !== 'all') {
      result = result.filter(m => m.alliance_id === parseInt(allianceFilter));
    }

    return result;
  };

  const filtered = getFiltered();

  const handleRoleChange = async (memberId, newRole) => {
    if (!isMaster) return;
    setUpdatingRole(true);
    try {
      await api.updateMemberRole(memberId, newRole);
      // 목록 갱신
      await loadMembers();
      // 상세 모달 업데이트
      if (showDetail && showDetail.id === memberId) {
        setShowDetail(prev => ({ ...prev, role: newRole }));
      }
    } catch (e) {
      alert(e.message);
    }
    setUpdatingRole(false);
  };

  return (
    <div className="page-content members-page premium">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>길드원</h1>
      </div>

      <div className="members-stats premium">
        <div className="stat-card">
          <div className="stat-icon total-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-name">전체 인원</span>
          </div>
        </div>
        <div className="stat-card online">
          <div className="stat-icon online-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.online}</span>
            <span className="stat-name">접속중</span>
          </div>
        </div>
        <div className="stat-card honorary">
          <div className="stat-icon honorary-icon"></div>
          <div className="stat-content">
            <span className="stat-value">{stats.honorary}</span>
            <span className="stat-name">명예길드원</span>
          </div>
        </div>
      </div>

      <div className="members-filter-section premium">
        <div className="members-filter premium">
          {[
            { key: 'all', label: '전체' },
            { key: 'online', label: '접속중' },
            { key: 'master', label: '길마' },
            { key: 'submaster', label: '부마' },
            { key: 'honorary', label: '명예길드원' },
          ].map(f => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="alliance-filter premium">
          <select
            value={allianceFilter}
            onChange={(e) => setAllianceFilter(e.target.value)}
            className="alliance-select"
          >
            <option value="all">모든 길드</option>
            {alliances.map(a => (
              <option key={a.id} value={a.id}>
                {a.emblem} {a.name} {a.is_main ? '(우리길드)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="members-list premium">
          {filtered.length === 0 ? (
            <div className="empty-message">표시할 길드원이 없습니다.</div>
          ) : (
            filtered.map((m, i) => {
              const roleInfo = roles[m.role] || roles.member;
              return (
                <div
                  key={i}
                  className={`member-row premium ${m.is_online ? 'online' : ''} role-${m.role || 'member'}`}
                  onClick={() => setShowDetail(m)}
                >
                  <div className="member-avatar-box">
                    <div className={`avatar-placeholder${m.avatar_img ? ' game-avatar' : ''}`}>
                      {m.avatar_img ? (
                        <img src={m.avatar_img} alt="" className="ranking-avatar" />
                      ) : m.profile_image ? (
                        <img src={getImageUrl(m.profile_image)} alt="" style={{ transform: `scale(${m.profile_zoom || 1})` }} />
                      ) : (
                        <span>{getIconEmoji(m.default_icon)}</span>
                      )}
                    </div>
                    <div className={`online-indicator ${m.is_online ? 'on' : ''}`}></div>
                  </div>
                  <div className="member-main">
                    <div className="member-info-col">
                      <div className="member-name-row">
                        <StyledName user={m} showTitle={false} className="member-name" />
                        <span className={`member-role role-${m.role || 'member'}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      {m.alliance_name && (
                        <span className={`member-guild ${m.is_main_guild ? 'main' : 'alliance'}`}>
                          {m.alliance_emblem} {m.alliance_name}
                        </span>
                      )}
                      {m.alt_characters?.length > 0 && (
                        <div className="member-alts">
                          {m.alt_characters.slice(0, 3).map((alt, idx) => (
                            <span key={idx} className="alt-tag">
                              {alt.username} <span className="alt-detail">Lv.{alt.userlevel} {alt.userjob}</span>
                            </span>
                          ))}
                          {m.alt_characters.length > 3 && (
                            <span className="alt-tag more">+{m.alt_characters.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="member-sub">
                    <span className="member-job">{m.ranking_job || m.job || '-'}</span>
                    <span className="member-level">Lv.{m.ranking_level || m.level || 0}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 회원 상세 모달 */}
      {showDetail && (
        <div className="modal-overlay premium" onClick={() => setShowDetail(null)}>
          <div className="modal-content member-detail-modal premium" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowDetail(null)}></button>
            <div className="member-detail-body premium">
              {/* 좌측: 프로필 정보 */}
              <div className="member-detail-left">
                {/* 부캐 보는 중일 때 본캐 복귀 버튼 */}
                {selectedAlt && (
                  <button className="alt-back-btn" onClick={handleBackToMain}>
                    ← {showDetail.character_name}
                  </button>
                )}

                <div className="member-detail-avatar premium">
                  <div className={`avatar-large${(selectedAlt?.avatar_img || showDetail.avatar_img) ? ' game-avatar' : ''}`}>
                    {selectedAlt ? (
                      selectedAlt.avatar_img
                        ? <img src={selectedAlt.avatar_img} alt="" className="ranking-avatar" />
                        : <span>{getIconEmoji(showDetail.default_icon)}</span>
                    ) : showDetail.avatar_img ? (
                      <img src={showDetail.avatar_img} alt="" className="ranking-avatar" />
                    ) : showDetail.profile_image ? (
                      <img src={getImageUrl(showDetail.profile_image)} alt="" style={{ transform: `scale(${showDetail.profile_zoom || 1})` }} />
                    ) : (
                      <span>{getIconEmoji(showDetail.default_icon)}</span>
                    )}
                  </div>
                  {!selectedAlt && (
                    <div className={`online-badge ${showDetail.is_online ? 'online' : ''}`}>
                      <span className="badge-dot"></span>
                      <span>{showDetail.is_online ? '접속중' : '오프라인'}</span>
                    </div>
                  )}
                </div>

                <div className="member-detail-name">
                  <h2>
                    {selectedAlt
                      ? <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{selectedAlt.username}</span>
                      : <StyledName user={showDetail} />
                    }
                  </h2>
                  <div className="member-detail-badges">
                    <span className={`role-tag role-${showDetail.role || 'member'}`}>
                      {roles[showDetail.role]?.label || '길드원'}
                    </span>
                    {showDetail.alliance_name && (
                      <span className={`guild-tag ${showDetail.is_main_guild ? 'main' : 'alliance'}`}>
                        {showDetail.alliance_emblem} {showDetail.alliance_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="member-detail-stats">
                  <div className="detail-stat">
                    <span className="stat-label">직업</span>
                    <span className="stat-value">
                      {selectedAlt ? selectedAlt.userjob : (showDetail.ranking_job || showDetail.job || '-')}
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-label">레벨</span>
                    <span className="stat-value">
                      Lv.{selectedAlt ? selectedAlt.userlevel : (showDetail.ranking_level || showDetail.level || 0)}
                    </span>
                  </div>
                  {(selectedAlt ? selectedAlt.userrank : showDetail.ranking_rank) && (
                    <div className="detail-stat">
                      <span className="stat-label">랭킹</span>
                      <span className="stat-value">
                        {(selectedAlt ? selectedAlt.userrank : showDetail.ranking_rank)}위
                      </span>
                    </div>
                  )}
                  {!selectedAlt && showDetail.discord && (
                    <div className="detail-stat full">
                      <span className="stat-label">Discord</span>
                      <span className="stat-value">{showDetail.discord}</span>
                    </div>
                  )}
                  {!selectedAlt && (
                    <div className="detail-stat full">
                      <span className="stat-label">가입일</span>
                      <span className="stat-value">{formatDate(showDetail.created_at) || '-'}</span>
                    </div>
                  )}
                </div>

                {/* 같은 계정 캐릭터 목록 - 본캐 + 부캐 모두 표시 */}
                {showDetail.alt_characters?.length > 0 && (
                  <div className="member-detail-alts">
                    <span className="alts-section-label">같은 계정 캐릭터</span>
                    <div className="alts-list">
                      {/* 본캐 항목 */}
                      {showDetail.character_name && (
                        <div
                          className={`alt-item clickable${!selectedAlt ? ' active' : ''}`}
                          onClick={handleBackToMain}
                        >
                          {showDetail.avatar_img && (
                            <img src={showDetail.avatar_img} alt="" className="alt-item-avatar" />
                          )}
                          <div className="alt-item-info-col">
                            <span className="alt-item-name">{showDetail.character_name}</span>
                            <span className="alt-item-info">
                              {showDetail.ranking_job || showDetail.job} Lv.{showDetail.ranking_level || showDetail.level}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* 부캐 목록 */}
                      {showDetail.alt_characters.map((alt, idx) => (
                        <div
                          key={idx}
                          className={`alt-item clickable${selectedAlt?.username === alt.username ? ' active' : ''}`}
                          onClick={() => handleAltClick(alt)}
                        >
                          {alt.avatar_img && (
                            <img src={alt.avatar_img} alt="" className="alt-item-avatar" />
                          )}
                          <div className="alt-item-info-col">
                            <span className="alt-item-name">{alt.username}</span>
                            <span className="alt-item-info">{alt.userjob} Lv.{alt.userlevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 길마만 역할 변경 가능 (자기 자신 제외) */}
                {isMaster && showDetail.role !== 'master' && showDetail.id !== user?.id && (
                  <div className="role-edit-section premium">
                    <span className="section-label">등급 설정</span>
                    <div className="role-buttons">
                      <button
                        className={`role-btn ${showDetail.role === 'submaster' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(showDetail.id, 'submaster')}
                        disabled={updatingRole || showDetail.role === 'submaster'}
                      >
                        부마스터
                      </button>
                      <button
                        className={`role-btn ${showDetail.role === 'member' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(showDetail.id, 'member')}
                        disabled={updatingRole || showDetail.role === 'member'}
                      >
                        길드원
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 우측: 레벨 변화 차트 */}
              <div className="member-detail-right">
                <LevelChart data={levelHistory} loading={historyLoading} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getIconEmoji } from '../components/UserAvatar';

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
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
                    <div className="avatar-placeholder">
                      {m.profile_image ? (
                        <img src={getImageUrl(m.profile_image)} alt="" style={{ transform: `scale(${m.profile_zoom || 1})` }} />
                      ) : (
                        <span>{getIconEmoji(m.default_icon)}</span>
                      )}
                    </div>
                    <div className={`online-indicator ${m.is_online ? 'on' : ''}`}></div>
                  </div>
                  <div className="member-main">
                    <div className="member-name-row">
                      <span className="member-name">{m.character_name}</span>
                      <span className={`member-role role-${m.role || 'member'}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    {m.alliance_name && (
                      <span className={`member-guild ${m.is_main_guild ? 'main' : 'alliance'}`}>
                        {m.alliance_emblem} {m.alliance_name}
                      </span>
                    )}
                  </div>
                  <div className="member-sub">
                    <span className="member-job">{m.job || '-'}</span>
                    <span className="member-level">Lv.{m.level || 0}</span>
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
              <div className="member-detail-avatar premium">
                <div className="avatar-large">
                  {showDetail.profile_image ? (
                    <img src={getImageUrl(showDetail.profile_image)} alt="" style={{ transform: `scale(${showDetail.profile_zoom || 1})` }} />
                  ) : (
                    <span>{getIconEmoji(showDetail.default_icon)}</span>
                  )}
                </div>
                <div className={`online-badge ${showDetail.is_online ? 'online' : ''}`}>
                  <span className="badge-dot"></span>
                  <span>{showDetail.is_online ? '접속중' : '오프라인'}</span>
                </div>
              </div>

              <div className="member-detail-name">
                <h2>{showDetail.character_name}</h2>
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
                  <span className="stat-value">{showDetail.job || '-'}</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-label">레벨</span>
                  <span className="stat-value">Lv.{showDetail.level || 0}</span>
                </div>
                {showDetail.discord && (
                  <div className="detail-stat full">
                    <span className="stat-label">Discord</span>
                    <span className="stat-value">{showDetail.discord}</span>
                  </div>
                )}
                <div className="detail-stat full">
                  <span className="stat-label">가입일</span>
                  <span className="stat-value">{formatDate(showDetail.created_at)}</span>
                </div>
              </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

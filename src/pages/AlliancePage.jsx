import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function AlliancePage({ setPage }) {
  const { user } = useAuth();
  const [alliances, setAlliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState(null);
  const [formData, setFormData] = useState({
    guild_name: '',
    guild_master: '',
    member_count: '',
    guild_level: '',
    description: '',
    is_main: false,
  });

  const isAdmin = user?.role === 'master' || user?.role === 'submaster';

  useEffect(() => {
    loadAlliances();
  }, []);

  const loadAlliances = async () => {
    try {
      const res = await api.getAlliances();
      setAlliances(res.data || []);
    } catch (e) {
      console.error('Failed to load alliances:', e);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedAlliance(null);
    setFormData({
      guild_name: '',
      guild_master: '',
      member_count: '',
      guild_level: '',
      description: '',
      is_main: false,
    });
    setShowModal(true);
  };

  const openEditModal = (alliance) => {
    setEditMode(true);
    setSelectedAlliance(alliance);
    setFormData({
      guild_name: alliance.guild_name || alliance.name || '',
      guild_master: alliance.guild_master || alliance.master_name || '',
      member_count: alliance.member_count || '',
      guild_level: alliance.guild_level || '',
      description: alliance.description || '',
      is_main: alliance.is_main || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.guild_name) {
      alert('길드 이름은 필수입니다.');
      return;
    }

    try {
      if (editMode && selectedAlliance) {
        await api.updateAlliance(selectedAlliance.id, {
          ...formData,
          member_count: parseInt(formData.member_count) || 0,
          guild_level: parseInt(formData.guild_level) || 1,
        });
        alert('연합 길드가 수정되었습니다.');
      } else {
        await api.createAlliance({
          ...formData,
          member_count: parseInt(formData.member_count) || 0,
          guild_level: parseInt(formData.guild_level) || 1,
        });
        alert('연합 길드가 추가되었습니다.');
      }
      setShowModal(false);
      loadAlliances();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (allianceId) => {
    if (!confirm('정말 이 연합 길드를 삭제하시겠습니까?')) return;
    try {
      await api.deleteAlliance(allianceId);
      alert('연합 길드가 삭제되었습니다.');
      loadAlliances();
    } catch (e) {
      alert(e.message);
    }
  };

  const totalMembers = alliances.reduce((a, b) => a + (b.member_count || 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>연합 길드</h1>
        {isAdmin && (
          <button className="write-btn" onClick={openAddModal}>길드 추가</button>
        )}
      </div>

      {/* 길드 추가/수정 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? '연합 길드 수정' : '연합 길드 추가'}>
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>길드 이름 <span className="required">*</span></label>
            <input
              type="text"
              value={formData.guild_name}
              onChange={e => setFormData({ ...formData, guild_name: e.target.value })}
              placeholder="길드 이름"
            />
          </div>
          <div className="form-group">
            <label>길드 마스터</label>
            <input
              type="text"
              value={formData.guild_master}
              onChange={e => setFormData({ ...formData, guild_master: e.target.value })}
              placeholder="길드 마스터 닉네임"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>길드원 수</label>
              <input
                type="number"
                value={formData.member_count}
                onChange={e => setFormData({ ...formData, member_count: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>길드 레벨</label>
              <input
                type="number"
                value={formData.guild_level}
                onChange={e => setFormData({ ...formData, guild_level: e.target.value })}
                placeholder="1"
                min="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>소개</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="길드 소개"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_main}
                onChange={e => setFormData({ ...formData, is_main: e.target.checked })}
              />
              메인 길드로 설정
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowModal(false)}>취소</button>
            <button type="submit" className="primary">{editMode ? '수정' : '등록'}</button>
          </div>
        </form>
      </Modal>

      <div className="alliance-banner">
        <span className="banner-title">메이플운동회 연합</span>
        <span className="banner-sub">총 {totalMembers}명이 함께합니다</span>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="alliance-list">
          {alliances.length === 0 ? (
            <div className="empty-message">등록된 연합 길드가 없습니다.</div>
          ) : (
            alliances.map((g) => (
              <div key={g.id} className={`alliance-card ${g.is_main ? 'main-guild' : ''}`}>
                {!!g.is_main && <div className="main-badge">우리 길드</div>}
                <div className="guild-header">
                  <div className="guild-emblem-small">{g.emblem || '🍁'}</div>
                  <div className="guild-title-area">
                    <h3>{g.guild_name || g.name}</h3>
                    <span className="guild-master">길마: {g.guild_master || g.master_name || '-'}</span>
                  </div>
                  <div className="guild-level-badge">Lv.{g.guild_level || 1}</div>
                </div>
                <p className="guild-desc">{g.description || '소개가 없습니다.'}</p>
                <div className="guild-footer">
                  <span className="guild-stat">👥 {g.member_count || 0}명</span>
                  {isAdmin && (
                    <div className="admin-btns">
                      <button className="edit-btn-small" onClick={() => openEditModal(g)}>수정</button>
                      {!g.is_main && (
                        <button className="delete-btn-small" onClick={() => handleDelete(g.id)}>삭제</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

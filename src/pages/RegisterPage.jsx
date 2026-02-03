import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function RegisterPage({ setPage }) {
  const [preview, setPreview] = useState(null);
  const [alliances, setAlliances] = useState([]);
  const [memberType, setMemberType] = useState('main'); // 'main' or 'alliance'
  const [formData, setFormData] = useState({
    characterName: '',
    job: '',
    level: '',
    discord: '',
    message: '',
    allianceId: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadAlliances();
  }, []);

  const loadAlliances = async () => {
    try {
      const res = await api.getAlliances();
      const data = res.data || [];
      setAlliances(data);
      // 우리 길드 자동 선택
      const mainGuild = data.find(a => a.is_main);
      if (mainGuild) {
        setFormData(prev => ({ ...prev, allianceId: String(mainGuild.id) }));
      }
    } catch (e) {
      console.error('Failed to load alliances:', e);
    }
  };

  const handleMemberTypeChange = (type) => {
    setMemberType(type);
    if (type === 'main') {
      const mainGuild = alliances.find(a => a.is_main);
      if (mainGuild) {
        setFormData(prev => ({ ...prev, allianceId: String(mainGuild.id) }));
      }
    } else {
      // 연합 길드 선택 시 첫 번째 연합 길드 자동 선택
      const firstAlliance = alliances.find(a => !a.is_main);
      setFormData(prev => ({ ...prev, allianceId: firstAlliance ? String(firstAlliance.id) : '' }));
    }
  };

  const mainGuild = alliances.find(a => a.is_main);
  const allianceGuilds = alliances.filter(a => !a.is_main);

  const jobs = [
    '히어로', '팔라딘', '다크나이트',
    '아크메이지(불,독)', '아크메이지(썬,콜)', '비숍',
    '보우마스터', '신궁', '메르세데스',
    '나이트로드', '섀도어', '듀얼블레이드',
    '바이퍼', '캡틴',
    '데몬슬레이어', '배틀메이지', '와일드헌터', '메카닉',
    '아란', '에반',
  ];

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.characterName.trim()) {
      alert('캐릭터 닉네임을 입력해주세요.');
      return;
    }
    if (!formData.job) {
      alert('직업을 선택해주세요.');
      return;
    }
    if (!formData.level || formData.level < 100) {
      alert('레벨 100 이상만 가입 가능합니다.');
      return;
    }
    if (!formData.discord.trim()) {
      alert('디스코드 아이디를 입력해주세요.');
      return;
    }
    if (!formData.allianceId) {
      alert('소속 길드를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitRegister({
        character_name: formData.characterName,
        job: formData.job,
        level: parseInt(formData.level),
        discord: formData.discord,
        message: formData.message,
        alliance_id: parseInt(formData.allianceId),
        image: imageFile,
      });
      alert('가입 신청이 완료되었습니다! 승인 후 이용 가능합니다.');
      setPage('main');
    } catch (e) {
      alert(e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-content register-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => setPage('main')}>← 돌아가기</button>
        <h1>가입 신청</h1>
      </div>

      <div className="register-container">
        <div className="register-info">
          <div className="info-box">
            <h3>가입 안내</h3>
            <ul>
              <li>레벨 100 이상</li>
              <li>디스코드 참여 필수</li>
              <li>주 1회 이상 접속 권장</li>
            </ul>
          </div>
          <div className="info-box benefits">
            <h3>길드 혜택</h3>
            <ul>
              <li>주간 보스전 참여</li>
              <li>파티퀘스트 상시 모집</li>
              <li>친목 이벤트 참여</li>
            </ul>
          </div>
          <a
            href="https://discord.gg/jQeDb8D5kK"
            target="_blank"
            rel="noopener noreferrer"
            className="discord-link register-discord"
          >
            <span className="discord-icon">💬</span>
            <span>디스코드 참여하기</span>
          </a>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group avatar-upload">
            <label>캐릭터 이미지 (선택)</label>
            <div className="avatar-upload-box" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="미리보기" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder-upload">
                  <span>📷</span>
                  <p>캐릭터 스크린샷<br />업로드</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>캐릭터 닉네임 <span className="required">*</span></label>
            <input
              type="text"
              name="characterName"
              placeholder="인게임 닉네임"
              value={formData.characterName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>직업 <span className="required">*</span></label>
              <select
                name="job"
                value={formData.job}
                onChange={handleChange}
                required
              >
                <option value="">선택</option>
                {jobs.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>레벨 <span className="required">*</span></label>
              <input
                type="number"
                name="level"
                placeholder="현재 레벨"
                min="100"
                max="300"
                value={formData.level}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>디스코드 <span className="required">*</span></label>
            <input
              type="text"
              name="discord"
              placeholder="username"
              value={formData.discord}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group member-type-group">
            <label>가입 유형 <span className="required">*</span></label>
            <div className="member-type-toggle">
              <button
                type="button"
                className={`type-btn ${memberType === 'main' ? 'active' : ''}`}
                onClick={() => handleMemberTypeChange('main')}
              >
                <span className="type-icon">🍁</span>
                <span className="type-label">메이플운동회 가입</span>
                <span className="type-desc">메이플운동회 정식 길드원</span>
              </button>
              <button
                type="button"
                className={`type-btn alliance ${memberType === 'alliance' ? 'active' : ''}`}
                onClick={() => handleMemberTypeChange('alliance')}
              >
                <span className="type-icon">🤝</span>
                <span className="type-label">연합 길드원으로 가입</span>
                <span className="type-desc">명예 길드원으로 활동</span>
              </button>
            </div>
          </div>

          {memberType === 'main' && mainGuild && (
            <div className="selected-guild-info">
              <div className="guild-card main">
                <span className="guild-emblem">{mainGuild.emblem || '🍁'}</span>
                <div className="guild-details">
                  <span className="guild-name">{mainGuild.name}</span>
                  <span className="guild-badge">메이플운동회</span>
                </div>
              </div>
            </div>
          )}

          {memberType === 'alliance' && (
            <div className="form-group alliance-select-group">
              <label>소속 연합 길드 <span className="required">*</span></label>
              <div className="alliance-options">
                {allianceGuilds.map(alliance => (
                  <label
                    key={alliance.id}
                    className={`alliance-option ${formData.allianceId === String(alliance.id) ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="allianceId"
                      value={alliance.id}
                      checked={formData.allianceId === String(alliance.id)}
                      onChange={handleChange}
                    />
                    <div className="alliance-option-content">
                      <span className="alliance-emblem">{alliance.emblem || '🏰'}</span>
                      <div className="alliance-info">
                        <span className="alliance-name">{alliance.name}</span>
                        <span className="alliance-desc">{alliance.description}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="alliance-hint">
                연합 길드원은 명예 길드원으로 가입되어 커뮤니티 활동에 참여할 수 있습니다.
              </p>
            </div>
          )}

          <div className="form-group">
            <label>하고 싶은 말</label>
            <textarea
              name="message"
              placeholder="자기소개나 가입 동기"
              rows="3"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            <span>{submitting ? '신청 중...' : '가입 신청하기'}</span>
            <span>🍁</span>
          </button>
        </form>
      </div>
    </div>
  );
}

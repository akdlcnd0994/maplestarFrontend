import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// 메이플스토리 직업 목록
const JOB_LIST = [
  { value: '', label: '직업 선택' },
  { value: '히어로', label: '히어로' },
  { value: '팔라딘', label: '팔라딘' },
  { value: '다크나이트', label: '다크나이트' },
  { value: '아크메이지(불,독)', label: '아크메이지(불,독)' },
  { value: '아크메이지(썬,콜)', label: '아크메이지(썬,콜)' },
  { value: '비숍', label: '비숍' },
  { value: '보우마스터', label: '보우마스터' },
  { value: '신궁', label: '신궁' },
  { value: '패스파인더', label: '패스파인더' },
  { value: '나이트로드', label: '나이트로드' },
  { value: '섀도어', label: '섀도어' },
  { value: '듀얼블레이더', label: '듀얼블레이더' },
  { value: '바이퍼', label: '바이퍼' },
  { value: '캡틴', label: '캡틴' },
  { value: '캐논슈터', label: '캐논슈터' },
  { value: '소울마스터', label: '소울마스터' },
  { value: '플레임위자드', label: '플레임위자드' },
  { value: '윈드브레이커', label: '윈드브레이커' },
  { value: '나이트워커', label: '나이트워커' },
  { value: '스트라이커', label: '스트라이커' },
  { value: '미하일', label: '미하일' },
  { value: '아란', label: '아란' },
  { value: '에반', label: '에반' },
  { value: '메르세데스', label: '메르세데스' },
  { value: '팬텀', label: '팬텀' },
  { value: '루미너스', label: '루미너스' },
  { value: '은월', label: '은월' },
  { value: '데몬슬레이어', label: '데몬슬레이어' },
  { value: '데몬어벤져', label: '데몬어벤져' },
  { value: '배틀메이지', label: '배틀메이지' },
  { value: '와일드헌터', label: '와일드헌터' },
  { value: '메카닉', label: '메카닉' },
  { value: '블래스터', label: '블래스터' },
  { value: '제논', label: '제논' },
  { value: '카이저', label: '카이저' },
  { value: '카인', label: '카인' },
  { value: '카데나', label: '카데나' },
  { value: '엔젤릭버스터', label: '엔젤릭버스터' },
  { value: '아델', label: '아델' },
  { value: '일리움', label: '일리움' },
  { value: '아크', label: '아크' },
  { value: '호영', label: '호영' },
  { value: '라라', label: '라라' },
  { value: '하야토', label: '하야토' },
  { value: '칸나', label: '칸나' },
  { value: '제로', label: '제로' },
  { value: '키네시스', label: '키네시스' },
];

export default function SignupPage({ setPage }) {
  const { signup } = useAuth();
  const [alliances, setAlliances] = useState([]);
  const [memberType, setMemberType] = useState('main');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    characterName: '',
    job: '',
    level: '',
    discord: '',
    allianceId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlliances();
  }, []);

  const loadAlliances = async () => {
    try {
      const res = await api.getAlliances();
      const data = res.data || [];
      setAlliances(data);
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
      const firstAlliance = alliances.find(a => !a.is_main);
      setFormData(prev => ({ ...prev, allianceId: firstAlliance ? String(firstAlliance.id) : '' }));
    }
  };

  const mainGuild = alliances.find(a => a.is_main);
  const allianceGuilds = alliances.filter(a => !a.is_main);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.username.trim()) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    if (formData.username.length < 4 || formData.username.length > 12) {
      setError('아이디는 4-12자여야 합니다.');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      setError('아이디는 영문/숫자만 가능합니다.');
      return false;
    }
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (!formData.characterName.trim()) {
      setError('캐릭터 닉네임을 입력해주세요.');
      return false;
    }
    if (!formData.job) {
      setError('직업을 선택해주세요.');
      return false;
    }
    if (!formData.level || formData.level < 1 || formData.level > 200) {
      setError('레벨을 올바르게 입력해주세요. (1-200)');
      return false;
    }
    if (!formData.discord.trim()) {
      setError('디스코드 아이디를 입력해주세요.');
      return false;
    }
    if (!formData.allianceId) {
      setError('소속 길드를 선택해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup({
        username: formData.username,
        password: formData.password,
        character_name: formData.characterName,
        job: formData.job,
        level: parseInt(formData.level),
        discord: formData.discord,
        alliance_id: parseInt(formData.allianceId),
      });
      alert('회원가입이 완료되었습니다!\n관리자 승인 후 로그인할 수 있습니다.');
      setPage('main');
    } catch (e) {
      setError(e.message || '회원가입에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="page-content login-page">
      <div className="login-container signup">
        <div className="login-header">
          <div className="login-emblem">🍁</div>
          <h1>회원가입</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="username"
              placeholder="영문/숫자 4-12자"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              placeholder="8자 이상"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호 재입력"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>캐릭터 닉네임</label>
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
              <label>직업</label>
              <select
                name="job"
                value={formData.job}
                onChange={handleChange}
                required
              >
                {JOB_LIST.map(job => (
                  <option key={job.value} value={job.value}>{job.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>레벨</label>
              <input
                type="number"
                name="level"
                placeholder="1-200"
                min="1"
                max="200"
                value={formData.level}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>디스코드</label>
            <input
              type="text"
              name="discord"
              placeholder="디스코드 아이디"
              value={formData.discord}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group member-type-group compact">
            <label>가입 유형</label>
            <div className="member-type-toggle compact">
              <button
                type="button"
                className={`type-btn ${memberType === 'main' ? 'active' : ''}`}
                onClick={() => handleMemberTypeChange('main')}
              >
                <span className="type-label">메이플운동회</span>
              </button>
              <button
                type="button"
                className={`type-btn alliance ${memberType === 'alliance' ? 'active' : ''}`}
                onClick={() => handleMemberTypeChange('alliance')}
              >
                <span className="type-label">연합 길드원</span>
              </button>
            </div>
          </div>

          {memberType === 'alliance' && allianceGuilds.length > 0 && (
            <div className="form-group">
              <label>소속 연합 길드</label>
              <select
                name="allianceId"
                value={formData.allianceId}
                onChange={handleChange}
                className="alliance-dropdown"
              >
                {allianceGuilds.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.emblem} {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <button className="guest-btn" onClick={() => setPage('login')}>
          ← 로그인으로
        </button>
      </div>
    </div>
  );
}

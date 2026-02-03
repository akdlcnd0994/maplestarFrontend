import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setPage }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await login(formData.username, formData.password);
      setPage('main');
    } catch (e) {
      setError(e.message || '로그인에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="page-content login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-emblem">🍁</div>
          <h1>메이플운동회</h1>
          <p>길드 홈페이지 로그인</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="username"
              placeholder="아이디"
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
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-links">
          <button onClick={() => setPage('signup')}>회원가입</button>
          <span>|</span>
          <button onClick={() => alert('관리자에게 문의해주세요.')}>비밀번호 찾기</button>
        </div>

        <button className="guest-btn" onClick={() => setPage('main')}>
          비회원으로 둘러보기
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import API from '../config/apiConfig.js';
import '../css/Login.css';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,72}$/;

export default function ResetPage({ actualToken: token }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    if (!token) {
      setStatus('invalid');
      return () => controller.abort();
    }
    setStatus('checking');
    const validate = async () => {
      try {
        const response = await fetch(`${API.API_BASE_URL}/member/tokenchecker`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken: token }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Token check unavailable');
        const result = await response.json();
        if (!controller.signal.aborted) setStatus(result.tokenChecker ? 'valid' : 'invalid');
      } catch {
        if (!controller.signal.aborted) setStatus('unavailable');
      }
    };
    validate();
    return () => controller.abort();
  }, [token, attempt]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    if (!passwordPattern.test(newPassword)) {
      setError('비밀번호는 8~72자이며 영문, 숫자, 특수문자(@$!%*#?&)를 각각 포함해야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API.API_BASE_URL}/member/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: token, resetPassword: newPassword }),
      });
      if (!response.ok) throw new Error('Password reset unavailable');
      const result = await response.json();
      if (result.resetPasswordSuccess) {
        addToast('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.', 'success');
        navigate('/login', { replace: true });
      } else {
        setStatus('invalid');
      }
    } catch {
      setError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = !newPassword || passwordPattern.test(newPassword);
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;
  const handleInputChange = (event) => {
    if (event.target.name === 'newPassword') setNewPassword(event.target.value);
    if (event.target.name === 'confirmPassword') setConfirmPassword(event.target.value);
  };

    if (status === 'checking') {
        return (
            <div className="account-service-main-container">
                <div className="account-wrapper">
                    <div className="welcome-section">
                        <div className="welcome-content">
                            <div className="logo-circle">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h1>토큰 검증 중...</h1>
                            <p>잠시만 기다려주세요</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-service-main-container">
            <div className="account-wrapper">
                {/* 왼쪽: 웰컴 섹션 */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className="logo-circle">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h1>비밀번호 재설정</h1>
                        <p>새로운 비밀번호를 설정해주세요</p>
                        
                        <div className="features">
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>안전한 암호화 처리</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>즉시 적용</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>간편한 재설정</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 비밀번호 재설정 폼 */}
                <div className="form-section">
                    <div className="login-container">
                        {status === 'invalid' && <div aria-live="polite">
                            <h2>사용할 수 없는 링크입니다</h2>
                            <p>링크가 만료되었거나 이미 사용되었습니다. 가장 최근에 받은 메일을 확인하거나 새 링크를 요청해주세요.</p>
                            <Link to="/resetPassword" className="service-link">새 재설정 링크 요청</Link>
                        </div>}
                        {status === 'unavailable' && <div aria-live="polite">
                            <h2>링크를 확인하지 못했습니다</h2>
                            <p>서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.</p>
                            <button className="login-btn" onClick={() => setAttempt(value => value + 1)}>다시 확인</button>
                        </div>}
                        {status === 'valid' && <>
                        <h2>새 비밀번호 입력</h2>
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label 
                                    htmlFor="newPassword"
                                    style={isPasswordValid ? {} : {color: 'red'}}
                                >
                                    {isPasswordValid 
                                        ? '새 비밀번호' 
                                        : '비밀번호는 8~72자, 영문+숫자+특수문자(@$!%*#?&) 조합이어야 합니다'}
                                </label>
                                <input 
                                    id="newPassword"
                                    name="newPassword"
                                    type="password" 
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={handleInputChange}
                                    className={isPasswordValid ? '' : 'passwordInvalid'}
                                    autoComplete="new-password"
                                    maxLength={72}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            
                            <div className="input-group">
                                <label htmlFor="confirmPassword">비밀번호 확인</label>
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password" 
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={handleInputChange}
                                    className={passwordsMatch ? '' : 'passwordInvalid'}
                                    autoComplete="new-password"
                                    maxLength={72}
                                    disabled={isSubmitting}
                                    required
                                />
                                {!passwordsMatch && confirmPassword && (
                                    <span style={{color: 'red', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block'}}>
                                        비밀번호가 일치하지 않습니다
                                    </span>
                                )}
                            </div>
                            
                            {error && <p role="alert">{error}</p>}
                            <button type="submit" className="login-btn" disabled={isSubmitting}>
                                {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                            </button>
                        </form>
                        </>}
                    </div>

                    <div className="divider">
                        <span>또는</span>
                    </div>

                    <div className="account-services">
                        <h3>다른 서비스</h3>
                        <div className="service-links">
                            <a href={(import.meta.env.VITE_ROUTER_BASE || "/").replace(/\/$/, "") + "/login"} className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                <span>로그인으로 돌아가기</span>
                            </a>
                            <a href={(import.meta.env.VITE_ROUTER_BASE || "/").replace(/\/$/, "") + "/register"} className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                <span>회원가입</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
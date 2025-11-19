import { useState } from 'react';
import { useToast } from '../components/ToastContext.jsx';

import '../css/ResetPassword.css';

import API from '../config/apiConfig.js';

export default function ResetPassword() {
  const { addToast } = useToast();
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if(!email){
        setError('이메일 주소를 입력해주세요')
        return;
    } else if (!emailRegex.test(email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    const response = await fetch(`${API.API_BASE_URL}/member/reset/password`,{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        memberRegisterEmail: email
                    })
                });
    
    if(!response.ok){
        return;
    }

    const result = await response.json();

    if(result.resetPassStt){
        setTimeout(() => {
            setIsLoading(false);
            setStep(2);
            }, 1500);
        addToast(result.resetStatus, "success");
    } else {
        setTimeout(() => {
            setIsLoading(false);
            setStep(1);
            }, 1500);
        addToast(result.resetStatus, "warning");
    }
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast('인증 메일이 재전송되었습니다.', 'success');
    }, 1000);
  };

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
            <h1>비밀번호 재설정</h1>
            <p>안전하게 비밀번호를 재설정하고<br />다시 서비스를 이용해보세요</p>
            
            <div className="features">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>이메일 인증을 통한 안전한 재설정</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>간편하고 빠른 처리</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>계정 보안 강화</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          {step === 1 ? (
            <div className="reset-container">
              <h2>이메일 인증</h2>
              <p className="reset-subtitle">
                가입하신 이메일 주소를 입력해주세요.<br />
                비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div className="reset-form">
                <div className="input-group">
                  <label htmlFor="email">이메일</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={error ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {error && (
                    <div className="error-message">
                      ⚠️ {error}
                    </div>
                  )}
                </div>

                <button onClick={handleSubmit} className="submit-btn" disabled={isLoading}>
                  {isLoading && <span className="spinner"></span>}
                  {isLoading ? '전송 중...' : '재설정 링크 전송'}
                </button>
              </div>

              <div className="divider">
                <span>또는</span>
              </div>

              <div className="account-services">
                <div className="service-links">
                  <a href="/login" className="service-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>로그인하기</span>
                  </a>
                  <a href="/register" className="service-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    <span>회원가입하기</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="reset-container">
              <div className="success-content">
                <div className="success-icon">✉️</div>
                
                <div className="success-message">
                  <h3>이메일을 확인해주세요</h3>
                  <p>
                    <span className="email-highlight">{email}</span>로<br />
                    비밀번호 재설정 링크를 전송했습니다.
                  </p>
                </div>

                <div className="info-box">
                  <p>
                    💡 이메일이 도착하지 않았나요?<br />
                    스팸 메일함을 확인하거나 몇 분 후 다시 시도해주세요.
                  </p>
                </div>

                <div className="action-buttons">
                  <button 
                    className="submit-btn" 
                    onClick={() => window.location.href = '/login'}
                  >
                    로그인 페이지로 이동
                  </button>
                  
                  <button 
                    className="resend-btn" 
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    {isLoading && <span className="spinner dark"></span>}
                    {isLoading ? '재전송 중...' : '이메일 재전송'}
                  </button>
                </div>
              </div>

              <div className="divider">
                <span>또는</span>
              </div>

              <div className="account-services">
                <div className="service-links">
                  <a href="/register" className="service-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    <span>회원가입하기</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import API from '../config/apiConfig.js';
import '../css/Login.css';

export default function ResetPasswordInThisPage(props) {
    const token = props.actualToken;
    const { addToast } = useToast();
    const [isValidToken, setIsValidToken] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    useEffect(() => {
        const tokenValidationChecker = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/member/tokenchecker`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ resetToken: token }) 
                });
                const result = await response.json();

                if (result.tokenChecker) {
                    setIsValidToken(true);
                } else {
                    const toastData = {
                        status: 'warning',
                        message: '토큰값 인증 실패'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Token validation error:', error);
                const toastData = {
                    status: 'error',
                    message: '토큰 검증 중 오류가 발생했습니다'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
            }
        };
        
        if (token) {
            tokenValidationChecker();
        } else {
            window.location.href = '/';
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'newPassword') {
            setNewPassword(value);
            const passwordhollow = value.trim();
            let pwValid = true;
    
            if (!passwordhollow) {
                pwValid = false;
            } else {
                const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
                pwValid = passwordPattern.test(passwordhollow);
            }
    
            setIsPasswordValid(pwValid);
            setPasswordsMatch(confirmPassword ? value === confirmPassword : true);
        }
    
        if (name === 'confirmPassword') {
            setConfirmPassword(value);
            setPasswordsMatch(value === newPassword);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();

        if (!newPassword) {
            addToast({
                status: 'warning',
                message: '비밀번호를 입력해주세요'
            });
            return;
        }

        if (!isPasswordValid) {
            addToast({
                status: 'warning',
                message: '비밀번호 형식이 올바르지 않습니다'
            });
            return;
        }

        if (!confirmPassword) {
            addToast({
                status: 'warning',
                message: '비밀번호 확인을 입력해주세요'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast({
                status: 'error',
                message: '비밀번호가 일치하지 않습니다'
            });
            return;
        }

        try {
            const response = await fetch(`${API.API_BASE_URL}/member/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resetToken: token,  
                    resetPassword: newPassword
                })
            });

            const result = await response.json();

            if (result.resetPasswordSuccess) {
                
            } else {
                addToast({
                    status: 'error',
                    message: result.message || '비밀번호 변경에 실패했습니다'
                });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            addToast({
                status: 'error',
                message: '비밀번호 변경 중 오류가 발생했습니다'
            });
        }
    };

    if (!isValidToken) {
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
                        <h2>새 비밀번호 입력</h2>
                        <div className="login-form">
                            <div className="input-group">
                                <label 
                                    htmlFor="newPassword"
                                    style={isPasswordValid ? {} : {color: 'red'}}
                                >
                                    {isPasswordValid 
                                        ? '새 비밀번호' 
                                        : '비밀번호는 8자 이상, 영문+숫자+특수문자(@$!%*#?&) 조합이어야 합니다'}
                                </label>
                                <input 
                                    id="newPassword"
                                    name="newPassword"
                                    type="password" 
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={handleInputChange}
                                    className={isPasswordValid ? '' : 'passwordInvalid'}
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
                                    required
                                />
                                {!passwordsMatch && confirmPassword && (
                                    <span style={{color: 'red', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block'}}>
                                        비밀번호가 일치하지 않습니다
                                    </span>
                                )}
                            </div>
                            
                            <button onClick={handlePasswordReset} className="login-btn">
                                비밀번호 변경
                            </button>
                        </div>
                    </div>

                    <div className="divider">
                        <span>또는</span>
                    </div>

                    <div className="account-services">
                        <h3>다른 서비스</h3>
                        <div className="service-links">
                            <a href="/login" className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                <span>로그인으로 돌아가기</span>
                            </a>
                            <a href="/register" className="service-link">
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
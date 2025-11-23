import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';

import '../css/Login.css';
import API from '../config/apiConfig.js';

export default function AccountService() {
    const { addToast } = useToast();
    const [loginP, setLoginP] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        const response = await fetch(`${API.API_BASE_URL}/member/login`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               memberLoginEmail: email,
               memberLoginPassword: password,
               memberLoginPermt: loginP
            })
        });

        if(!response.ok){
            try {
                const errorResult = await response.json();
                addToast(errorResult.LoginMessage || "로그인 실패: 서버 오류", "warning");
            } catch (e) {
                addToast("네트워크 또는 서버 응답 오류", "error");
            }
            return false;
        }

        const result = await response.json();

        if(result.LoginSuccess){
        
            addToast(result.LoginMessage, "success");
            
            const toastData = {
                status: 'success',
                message: result.LoginMessage 
            };
            
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            
     
            window.location.href = '/';
        }
    };

    return (
        <div className="account-service-main-container">
            <div className="account-wrapper">
                {/* 왼쪽: 웰컴 섹션 */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className="logo-circle">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h1>환영합니다</h1>
                        <p>서비스를 이용하시려면 로그인해주세요</p>
                        
                        <div className="features">
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>안전한 계정 관리</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>빠른 서비스 이용</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>간편한 시작 절차</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 로그인 & 계정 서비스 */}
                <div className="form-section">
                    <div className="login-container">
                        <h2>로그인</h2>
                        <div className="login-form">
                            <div className="input-group">
                                <label htmlFor="email">이메일</label>
                                <input 
                                    id="email"
                                    type="email" 
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            
                            <div className="input-group">
                                <label htmlFor="password">비밀번호</label>
                                <input 
                                    id="password"
                                    type="password" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="remember-forgot">
                                <label className="remember-me">
                                    <input 
                                        type="checkbox"
                                        checked={loginP}
                                        onChange={(e) => setLoginP(e.target.checked)}/>
                                    <span>로그인 상태 유지</span>
                                </label>
                            </div>
                            
                            <button onClick={handleSubmit} className="login-btn">로그인</button>
                        </div>
                    </div>

                    <div className="divider">
                        <span>또는</span>
                    </div>

                    <div className="account-services">
                        <h3>계정 서비스</h3>
                        <div className="service-links">
                            <a href="/register" className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                <span>회원가입</span>
                            </a>
                            <a href="/resetPassword" className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>비밀번호 재설정</span>
                            </a>
                            {/* <a href="/findId" className="service-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <span>아이디 찾기</span>
                            </a> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
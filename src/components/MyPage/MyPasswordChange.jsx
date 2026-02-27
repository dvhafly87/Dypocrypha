import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';

import '../../css/MyPasswordChange.css';

const TOKEN_CHECKER_URL = `${API.API_BASE_URL}/member/tokenchecker`;
const PASSWORD_CHANGE_URL = `${API.API_BASE_URL}/member/password/change`;

const IconLock = () => (
    <svg className="pwchange-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconEye = () => (
    <svg className="pwchange-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const IconEyeOff = () => (
    <svg className="pwchange-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const IconCheck = () => (
    <svg className="pwchange-match-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default function MyPasswordChange() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isLogined, isLoading, logout} = useAuth();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isValidToken, setIsValidToken] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    useEffect(() => {
        if (!token) {
            addToast('비밀번호 확인이 필요합니다', 'warning');
            navigate('/mypage/password');
            return;
        }

        const tokenValidationChecker = async () => {
            try {
                const response = await fetch(TOKEN_CHECKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resetToken: token })
                });
                const result = await response.json();

                if (result.tokenChecker) {
                    setIsValidToken(true);
                } else {
                    addToast('유효하지 않은 접근입니다', 'warning');
                    navigate('/mypage/password');
                }
            } catch (error) {
                addToast('토큰 검증 중 오류가 발생했습니다', 'error');
                navigate('/mypage/password');
            } finally {
                setIsCheckingToken(false);
            }
        };

        tokenValidationChecker();
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'newPassword') {
            setNewPassword(value);
            setIsPasswordValid(!value || passwordPattern.test(value));
            setPasswordsMatch(confirmPassword ? value === confirmPassword : true);
        }

        if (name === 'confirmPassword') {
            setConfirmPassword(value);
            setPasswordsMatch(value === newPassword);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!newPassword) { addToast('새 비밀번호를 입력해주세요', 'warning'); return; }
        if (!isPasswordValid) { addToast('비밀번호 형식이 올바르지 않습니다', 'warning'); return; }
        if (!confirmPassword) { addToast('비밀번호 확인을 입력해주세요', 'warning'); return; }
        if (newPassword !== confirmPassword) { addToast('비밀번호가 일치하지 않습니다', 'error'); return; }

        setIsSubmitting(true);

        try {
            const response = await fetch(PASSWORD_CHANGE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken: token, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.passwordChangeMessage || '로그인이 필요한 서비스입니다' }));
                    navigate('/login');
                    return;
                } else if (response.status === 403) {
                    addToast(result.passwordChangeMessage, 'warning');
                    navigate('/mypage/password');
                    return;
                }
                throw new Error(result.passwordChangeMessage || '서버 통신 불가');
            } else {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'success', message: result.passwordChangeMessage || '원활한 서비스 이용을 위해 다시 로그인 해주십시오.' }));
                navigate('/login');
                logout();
            }

        } catch (error) {
            addToast(error.message || '오류가 발생했습니다', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingToken) {
        return (
            <div className="pwchange-verifying">
                <div className="pwchange-verifying-spinner" />
                <p>검증 중...</p>
            </div>
        );
    }

    if (!isValidToken) return null;

    return (
        <div className="pwchange-container">

            <div className="pwchange-header">
                <p className="pwchange-header-title">
                    <IconLock />
                    새 비밀번호 설정
                </p>
                <p className="pwchange-header-desc">
                    새로 사용할 비밀번호를 입력해주세요.
                </p>
            </div>

            <form className="pwchange-form" onSubmit={handlePasswordChange}>

                {/* 새 비밀번호 */}
                <div className="pwchange-input-wrapper">
                    <p className={`pwchange-form-label ${!isPasswordValid ? 'invalid' : ''}`}>
                        {isPasswordValid
                            ? '새 비밀번호'
                            : '8자 이상, 영문 + 숫자 + 특수문자(@$!%*#?&) 조합이어야 합니다'}
                    </p>
                    <input
                        className={`pwchange-input ${!isPasswordValid ? 'invalid' : ''}`}
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        placeholder="새 비밀번호 입력 ..."
                        autoComplete="off"
                        value={newPassword}
                        onChange={handleInputChange}
                    />
                </div>

                {/* 비밀번호 확인 */}
                <div className="pwchange-input-wrapper">
                    <p className="pwchange-form-label">비밀번호 확인</p>
                    <div className="pwchange-input-row">
                        <input
                            className={`pwchange-input ${confirmPassword && !passwordsMatch ? 'invalid' : ''} ${confirmPassword && passwordsMatch ? 'valid' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="비밀번호 재입력 ..."
                            autoComplete="off"
                            value={confirmPassword}
                            onChange={handleInputChange}
                        />
                        {confirmPassword && passwordsMatch && (
                            <span className="pwchange-match-check">
                                <IconCheck />
                            </span>
                        )}
                    </div>
                    {confirmPassword && !passwordsMatch && (
                        <p className="pwchange-mismatch-msg">비밀번호가 일치하지 않습니다</p>
                    )}
                </div>

                {/* 비밀번호 표시 토글 */}
                <label className="pwchange-show-toggle">
                    <button
                        type="button"
                        className={`pwchange-toggle-btn ${showPassword ? 'active' : ''}`}
                        onClick={() => setShowPassword(p => !p)}
                    >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                    <span>{showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}</span>
                </label>

                <button
                    className="pwchange-btn"
                    type="submit"
                    disabled={isSubmitting || !isPasswordValid || (confirmPassword && !passwordsMatch)}
                >
                    {isSubmitting ? '변경 중 ...' : '비밀번호 변경'}
                </button>
            </form>

        </div>
    );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';

import '../../css/MyPasswordChk.css';

const PASSWRD_CHG_URL = `${API.API_BASE_URL}/member/passwordCheck`

const IconLock = () => (
    <svg className="passwordchk-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconInfo = () => (
    <svg className="passwordchk-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

/* 눈 - 보임 */
const IconEye = () => (
    <svg className="passwordchk-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

/* 눈 - 숨김 */
const IconEyeOff = () => (
    <svg className="passwordchk-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

export default function PasswordChange() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isLogined, isLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordChange, setPasswordChange] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    const handlePasswordCheck = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!passwordChange.trim()) {
            addToast('비밀번호를 입력해주세요', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(PASSWRD_CHG_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwordChange })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.passwordChkMessage || "로그인이 필요한 서비스입니다" }));
                    navigate('/login');
                    return;
                } else if (response.status === 403) {
                    addToast(result.passwordChkMessage || "비밀번호가 일치하지 않습니다", "warning");
                    return;
                }
                throw new Error(result.passwordChkMessage || "서버 통신 불가");
            } else {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'success', message: result.passwordChkMessage || "비밀번호 확인됨" }));
                navigate(`/mypage/password/change?token=${result.tempToken}`);
            }
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
            navigate('/');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="passwordchk-container">

            {/* 헤더 */}
            <div className="passwordchk-header">
                <p className="passwordchk-header-title">
                    <IconLock />
                    비밀번호 변경
                </p>
                <p className="passwordchk-header-desc">
                    비밀번호 변경을 위해 현재 비밀번호로 본인 확인이 필요합니다.
                </p>
            </div>

            {/* 안내 */}
            <div className="passwordchk-notice">
                <IconInfo />
                현재 비밀번호 확인 후 새 비밀번호를 설정할 수 있습니다.
            </div>

            {/* 폼 */}
            <form className="passwordchk-form" onSubmit={handlePasswordCheck}>
                <div className="passwordchk-input-wrapper">
                    <p className="passwordchk-form-label">현재 비밀번호</p>
                    <div className="passwordchk-input-row">
                        <input
                            className="passwordchk-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="계정 비밀번호 입력 ..."
                            autoComplete="off"
                            value={passwordChange}
                            onChange={(e) => setPasswordChange(e.currentTarget.value)}
                        />
                        <button
                            type="button"
                            className="passwordchk-eye-btn"
                            onClick={() => setShowPassword(prev => !prev)}
                            tabIndex={-1}
                        >
                            {showPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                    </div>
                </div>
                <button
                    className="passwordchk-btn"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '확인 중 ...' : '확인'}
                </button>
            </form>

        </div>
    );
}
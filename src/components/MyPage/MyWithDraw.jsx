import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';

import '../../css/MyWithDraw.css';

const DRAW_URL = `${API.API_BASE_URL}/member/draw`

const IconWarning = () => (
    <svg className="withdraw-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export default function MyWithdraw() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [drawPassword, setDrawPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isLogined, isLoading, logout } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    const handleDrawMember = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!drawPassword.trim()) {
            addToast('비밀번호를 입력해주세요', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(DRAW_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drawPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    addToast(result.memberDrawMessage || "비밀번호가 일치하지 않습니다", "warning");
                    return;
                } else if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.memberDrawMessage || "로그인이 필요한 서비스입니다" }));
                    navigate('/login');
                    return;
                }
                throw new Error(result.memberDrawMessage || "서버 통신 불가");
            } else {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'success', message: result.memberDrawMessage || "탈퇴되었습니다" }));
                logout();
                navigate('/');
            }

        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
            navigate('/');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="withdraw-container">

            {/* 경고 헤더 */}
            <div className="withdraw-header">
                <p className="withdraw-header-title">
                    <IconWarning />
                    회원 탈퇴
                </p>
                <p className="withdraw-header-desc">
                    탈퇴 시 계정 정보는 즉시 삭제되며 복구가 불가능합니다. 신중하게 결정해주세요.
                </p>
            </div>

            {/* 안내 사항 */}
            <div className="withdraw-notice">
                <div className="withdraw-notice-item">
                    <span className="withdraw-notice-dot" />
                    탈퇴 즉시 계정 정보 및 개인정보가 영구 삭제됩니다.
                </div>
                <div className="withdraw-notice-item">
                    <span className="withdraw-notice-dot" />
                    작성한 게시글 및 프로젝트는 삭제되지 않으며 익명으로 전환됩니다.
                </div>
                <div className="withdraw-notice-item">
                    <span className="withdraw-notice-dot" />
                    아카이브에 업로드한 파일은 탈퇴 시 모두 영구 삭제됩니다.
                </div>
                <div className="withdraw-notice-item">
                    <span className="withdraw-notice-dot" />
                    동일한 이메일로 재가입이 가능하나 기존 데이터와 연동되지 않습니다.
                </div>
            </div>

            {/* 비밀번호 입력 폼 */}
            <form className="withdraw-form" onSubmit={handleDrawMember}>
                <div className="withdraw-input-wrapper">
                    <p className="withdraw-form-label">본인 확인을 위해 현재 비밀번호를 입력해주세요</p>
                    <input
                        className="withdraw-input"
                        type="password"
                        placeholder="계정 비밀번호 입력 ..."
                        autoComplete="off"
                        value={drawPassword}
                        onChange={(e) => setDrawPassword(e.currentTarget.value)}
                    />
                </div>
                <button
                    className="withdraw-btn"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '처리 중 ...' : '탈퇴하기'}
                </button>
            </form>

        </div>
    );
}
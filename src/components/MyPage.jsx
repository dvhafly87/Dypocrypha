import React, { useEffect } from 'react';
import { useNavigate, useLocation, NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';

import '../css/MyPage.css';

const SUBTITLE_MAP = {
    '/mypage/profile': '회원 정보 관리',
    '/mypage/password': '회원 비밀번호 변경',
    '/mypage/content': '업로드한 작업물 관리',
    '/mypage/withdraw': '회원 탈퇴',
};

/* ── SVG 아이콘 컴포넌트 ── */
const IconProfile = () => (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);

const IconPassword = () => (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconFolder = () => (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
);

const IconWithdraw = () => (
    <svg className="mypage-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

/* ── 메인 컴포넌트 ── */
export default function Mypage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLogined, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    if (location.pathname === '/mypage' || location.pathname === '/mypage/') {
        return <Navigate to="/mypage/profile" replace />;
    }

    const subtitle = SUBTITLE_MAP[location.pathname] ?? '내 계정 관리';

    return (
        <div className="mypage-container">
            <div className="mypage-inner">

                {/* 좌측 네비게이션 */}
                <nav className="mypage-nav">

                    <div className="mypage-nav-header">
                        <p className="mypage-nav-title">My Page</p>
                        <p className="mypage-nav-subtitle">{subtitle}</p>
                    </div>

                    <ul className="mypage-nav-list">
                        <li>
                            <NavLink
                                to="/mypage/profile"
                                className={({ isActive }) => `mypage-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <IconProfile />
                                회원 정보
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/mypage/password"
                                className={({ isActive }) => `mypage-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <IconPassword />
                                비밀번호 변경
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/mypage/content"
                                className={({ isActive }) => `mypage-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <IconFolder />
                                내 작업물 관리
                            </NavLink>
                        </li>

                        <div className="mypage-nav-divider" />

                        <li>
                            <NavLink
                                to="/mypage/withdraw"
                                className={({ isActive }) => `mypage-nav-item danger ${isActive ? 'active' : ''}`}
                            >
                                <IconWithdraw />
                                회원 탈퇴
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {/* 우측 컨텐츠 뷰어 */}
                <div className="mypage-viewer">
                    <Outlet />
                </div>

            </div>
        </div>
    );
}
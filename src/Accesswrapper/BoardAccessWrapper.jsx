import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../config/apiConfig';
import '../css/PrivateAccess.css';

export default function BoardPrivatePostAccess({ boardId, boardName }) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 암호화된 게시판인지 확인
    useEffect(() => {
        const thisPageIsOnlyPrivateBoardPage = async () => {
            const response = await fetch(`${API.API_BASE_URL}/private/boardChecker`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callingpostId: boardId,
                    callingpostBoardName: boardName,
                })
            });
            
            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: "서버 통신 불가"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if (!result.boardChecker) {
                const toastData = {
                    status: 'warning',
                    message: result.boardCheckerMessage
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }
        }

        thisPageIsOnlyPrivateBoardPage();
    }, [boardId, boardName, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!password.trim()) {
            addToast('비밀번호를 입력해주세요.', 'warning');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch(`${API.API_BASE_URL}/private/verify`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: boardId,
                    boardName: boardName,
                    password: password
                })
            });

            if (!response.ok) {
                addToast('서버 통신 중 오류가 발생했습니다.', 'error');
                setIsLoading(false);
                return;
            }

            const result = await response.json();

            if (result.verifyStatus) {
                addToast('인증되었습니다.', 'success');
                navigate(`/board/${boardName}/${boardId}`);
            } else {
                addToast(result.verifyMessage || '비밀번호가 올바르지 않습니다.', 'warning');
                setPassword('');
            }
            
        } catch (err) {
            addToast('서버 통신 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="private-board-access-container">
            {/* 헤더 */}
            <div className="private-access-header">
                <div className="private-access-header-left">
                    <h1 className="private-access-title">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lock-icon">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        비공개 게시판 
                    </h1>
                    <p className="private-access-meta">{boardName.includes("게시판") ? boardName+"에 접근하려면 비밀번호 인증이 필요합니다." : boardName + " 게시판에 접근하려면 비밀번호 인증이 필요합니다." }</p>
                </div>
            </div>

            {/* 비밀번호 입력 폼 */}
            <div className="private-access-form-container">
                <div className="private-access-card">
                    <div className="private-access-card-header">
                        <div className="private-access-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h2 className="private-access-card-title">{boardName}</h2>
                        <p className="private-access-card-description">
                            게시판에 접근하려면 올바른 비밀번호를 입력해주세요
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="private-access-form">
                        <div className="private-access-input-group">
                            <label className="private-access-label">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5z"></path>
                                </svg>
                                비밀번호
                            </label>
                            <div className="private-access-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="게시판 비밀번호를 입력하세요"
                                    disabled={isLoading}
                                    className="private-access-input"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="private-access-toggle-btn"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="private-access-button-group">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn-private-back"
                                disabled={isLoading}
                            >
                                홈으로
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-private-submit"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        확인 중...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                            <polyline points="10 17 15 12 10 7"></polyline>
                                            <line x1="15" y1="12" x2="3" y2="12"></line>
                                        </svg>
                                        접속하기
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
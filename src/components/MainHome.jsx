import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';

import '../css/MainHome.css';

import ProjectSlider from '../components/ProjectSlider.jsx'
import DOAI from '../img/doge.jpeg';
import DoBanner from '../img/dogae.jpeg';

import API from '../config/apiConfig.js';

export default function MainHome() {
    const { addToast } = useToast();
    const [boardList, setBoardList] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [boardName, setBoardName] = useState('');

    useEffect(() => {
        const storedToastData = localStorage.getItem('redirectToast');
        if (storedToastData) {
            try {
                const toastData = JSON.parse(storedToastData);
                addToast(toastData.message, toastData.status);
                localStorage.removeItem('redirectToast');
            } catch (error) {
                console.error("Failed to parse redirectToast from localStorage:", error);
                localStorage.removeItem('redirectToast');
            }
        }
    }, [addToast]);

    useEffect(() => {
        const getCallRecentlyBoardInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/board/non-private/calling/all`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
        
                if (!response.ok) {
                    setHasError(true);
                    setBoardList([]);
                    return;
                }
        
                const result = await response.json();

                if(result.boardInfoStatus) {
                    setBoardList(result.boardInfoInfo || []);
                    setHasError(false);
                } else {
                    setBoardList([]);
                    setHasError(false);
                }
            } catch (error) {
                console.error("게시판 목록 조회 에러:", error);
                setHasError(true);
                setBoardList([]);
            }
        };
        
        getCallRecentlyBoardInformation();
    }, [addToast]);

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            return '-';
        }
    };

    // 작성자 표시 함수 (익명 처리)
    const getAuthorDisplay = (post) => {
        if (post.postAnonymous) {
            return post.postAnonymous;
        }
        return post.postAuthor || '알 수 없음';
    };

    return (
        <>
            <div className="main-home-container">
                <div className="main-upper-section-wrapper">
                    <ProjectSlider />
                </div>
                <div className="main-middle-section-wrapper">
                    <div className="recently-posted-section">
                        <span className="recently-post-header">
                            <h2>최근 게시글</h2>
                        </span>
                        <hr/>
                        
                        {hasError ? (
                            <div className="server-error-container">
                                <p className="server-error-icon">🔧</p>
                                <p className="server-error-message">현재 서버가 가동 중이 아닙니다</p>
                                <p className="server-error-submessage">나중에 다시 방문해 주십시오</p>
                            </div>
                        ) : boardList.length === 0 ? (
                            <div className="no-posts-container">
                                <p className="no-posts-message">📝 아직 게시글이 없습니다</p>
                                <p className="no-posts-submessage">첫 번째 게시글을 작성해보세요!</p>
                            </div>
                        ) : (
                            <table className="recent-posts-table">
                                <thead>
                                    <tr>
                                        <th>게시판</th>
                                        <th>제목</th>
                                        <th>작성자</th>
                                        <th>작성일</th>
                                        <th>조회수</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boardList.map((post, index) => (
                                        <tr key={post.boardPostPr || index}>
                                            <td className="board-name-cell">
                                                {post.boardName || '미분류'}
                                            </td>
                                            <td className="post-title-cell">
                                                <Link 
                                                    to={`/boardPost/${post.boardName}/${post.boardId}/${post.boardPostId}`}
                                                    className="post-title-link"
                                                >
                                                    {post.postIsPinned && (
                                                       <svg 
                                                       xmlns="http://www.w3.org/2000/svg" 
                                                       className="pinned-badge" 
                                                       viewBox="0 0 24 24" 
                                                       width="16" 
                                                       height="16" 
                                                       fill="currentColor"
                                                   >
                                                       <path d="M12 2C11.4477 2 11 2.44772 11 3V14.5858L6.70711 10.2929C6.31658 9.90237 5.68342 9.90237 5.29289 10.2929C4.90237 10.6834 4.90237 11.3166 5.29289 11.7071L10.2929 16.7071C10.6834 17.0976 11.3166 17.0976 11.7071 16.7071L16.7071 11.7071C17.0976 11.3166 17.0976 10.6834 16.7071 10.2929C16.3166 9.90237 15.6834 9.90237 15.2929 10.2929L11 14.5858V3C11 2.44772 10.5523 2 10 2H12Z"/>
                                                   </svg>
                                                    )}
                                                    {post.postTitle}
                                                </Link>
                                            </td>
                                            <td className="author-cell">
                                                {getAuthorDisplay(post)}
                                            </td>
                                            <td className="date-cell">
                                                {formatDate(post.createdAt)}
                                            </td>
                                            <td className="view-count-cell">
                                                {post.postViewCount || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    <div className="youtube-newer-iframe-container">
                        <h2>최근 채널 업로드 영상</h2>
                        <div className="iframe-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/o1c_yLFXCig?si=zHe8lVUM95E-pLEH`}
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
                
                <div className="main-lower-section-wrapper">
                    <div className="go-ai-chatbotpage-container">
                        <h2>The Chat bot of Dypocrypha</h2>
                        <img src={DOAI} alt="AI 챗봇 이미지"/>
                        <Link to="/dypoai">대화하기</Link>
                    </div>
                    <div className="archive-container">
                        <h2>아카이브</h2>
                        {/* 아직은 내용이 없고 공간만 잡아놓기 용 */}
                    </div>
                </div>
            </div>
        </>
    )
}
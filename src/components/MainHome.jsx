import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

import '../css/MainHome.css';

import ProjectSlider from '../components/ProjectSlider.jsx'
import API from '../config/apiConfig.js';

export default function MainHome() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [boardList, setBoardList] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [fileList, setFileList] = useState([]);

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
        const getRecentlyArchiveInfomation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/archive/recent/upload`, {
                    method: 'POST',
                    credentials: 'include',
                });
                const result = await response.json();
                if (!response.ok) {
                    if (response.status === 404) return; // 파일 없음 - 조용히 처리
                    throw new Error(result.archiveRecentMessage || "서버 통신 불가");
                }
                if (result.recentFileReturnInfo) {
                    setFileList(result.recentFileReturnInfo);
                }
            } catch (error) {
                addToast(error.message, "error");
            }
        };
        getRecentlyArchiveInfomation();
    }, [addToast]);

    useEffect(() => {
        const getCallRecentlyBoardInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/board/non-private/calling/all`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) { setHasError(true); setBoardList([]); return; }
                const result = await response.json();
                if (result.boardInfoStatus) {
                    setBoardList(result.boardInfoInfo || []);
                    setHasError(false);
                } else {
                    setBoardList([]);
                    setHasError(false);
                }
            } catch (error) {
                setHasError(true);
                setBoardList([]);
            }
        };
        getCallRecentlyBoardInformation();
    }, [addToast]);

    // ----------------------------------------------------------------
    // 날짜 포맷
    // ----------------------------------------------------------------
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } catch { return '-'; }
    };

    const getAuthorDisplay = (post) => post.postAnonymous || post.postAuthor || '알 수 없음';

    // ----------------------------------------------------------------
    // 아카이브 아이콘 (Archive.jsx에서 가져옴)
    // ----------------------------------------------------------------
    const getFileIcon = (ext) => {
        const e = ext?.toLowerCase();
        const base = (children) => (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                {children}
            </svg>
        );

        if (e === '.pdf') return base(<>
            <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3z" />
            <path d="M14 13h1a2 2 0 0 1 0 4h-1v-4z" />
        </>);
        if (['.doc', '.docx'].includes(e)) return base(<>
            <line x1="8" y1="9" x2="10" y2="9" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
        </>);
        if (['.xls', '.xlsx'].includes(e)) return base(<>
            <rect x="8" y="12" width="8" height="6" rx="0.5" />
            <line x1="8" y1="15" x2="16" y2="15" />
            <line x1="12" y1="12" x2="12" y2="18" />
        </>);
        if (['.zip', '.rar', '.7z'].includes(e)) return base(<>
            <line x1="12" y1="10" x2="12" y2="10" />
            <line x1="12" y1="12" x2="12" y2="12" />
            <line x1="12" y1="14" x2="12" y2="14" />
            <rect x="10" y="15" width="4" height="4" rx="0.5" />
        </>);
        if (['.txt', '.md'].includes(e)) return base(<>
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
        </>);
        if (['.mp3', '.wav', '.flac'].includes(e)) return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        );
        if (['.mp4', '.avi', '.mov'].includes(e)) return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10 9 16 12 10 15 10 9" />
            </svg>
        );
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(e)) return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );
        return base(null);
    };

    const LockIcon = () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
    );

    // ----------------------------------------------------------------
    // 아카이브 미리보기 렌더
    // ----------------------------------------------------------------
    const renderArchivePreview = (file) => {
        const ext = file.fileExtension;
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        const isVideo = ['.mp4', '.avi', '.mov'].includes(ext);
        const isMp3WithThumb = ext === '.mp3' && file.mp3FileThumb;

        if (!file.isEncrypted && isImage) {
            return (
                <img
                    src={`${API.API_BASE_URL}/archive/file/${file.fileUuidName}`}
                    className="main-archive-preview-img"
                    alt={file.fileMainName}
                />
            );
        }
        if (!file.isEncrypted && isVideo) {
            return (
                <video
                    src={`${API.API_BASE_URL}/archive/file/${file.fileUuidName}`}
                    className="main-archive-preview-img"
                    muted
                />
            );
        }
        if (!file.isEncrypted && isMp3WithThumb) {
            return (
                <img
                    src={`${API.API_BASE_URL}/archive/file/mp3/${file.mp3FileThumb}`}
                    className="main-archive-preview-img"
                    alt={file.mp3FileThumb}
                />
            );
        }
        return (
            <span className="main-archive-icon">
                {getFileIcon(ext)}
            </span>
        );
    };

    return (
        <>
            <div className="main-home-container">
                <div className="main-upper-section-wrapper">
                    <ProjectSlider />
                </div>
                <div className="main-middle-section-wrapper">
                    {/* ---- 최근 게시글 ---- */}
                    <div className="recently-posted-section">
                        <span className="recently-post-header">
                            <h2>최근 게시글</h2>
                        </span>
                        <hr />
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
                                            <td className="board-name-cell">{post.boardName || '미분류'}</td>
                                            <td className="post-title-cell">
                                                <Link to={`/boardPost/${post.boardName}/${post.boardId}/${post.boardPostId}`} className="post-title-link">
                                                    {post.postIsPinned && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="pinned-badge" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                            <path d="M12 2C11.4477 2 11 2.44772 11 3V14.5858L6.70711 10.2929C6.31658 9.90237 5.68342 9.90237 5.29289 10.2929C4.90237 10.6834 4.90237 11.3166 5.29289 11.7071L10.2929 16.7071C10.6834 17.0976 11.3166 17.0976 11.7071 16.7071L16.7071 11.7071C17.0976 11.3166 17.0976 10.6834 16.7071 10.2929C16.3166 9.90237 15.6834 9.90237 15.2929 10.2929L11 14.5858V3C11 2.44772 10.5523 2 10 2H12Z" />
                                                        </svg>
                                                    )}
                                                    {post.postTitle}
                                                </Link>
                                            </td>
                                            <td className="author-cell">{getAuthorDisplay(post)}</td>
                                            <td className="date-cell">{formatDate(post.createdAt)}</td>
                                            <td className="view-count-cell">{post.postViewCount || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* ---- 최근 아카이브 업로드 ---- */}
                    <div className="archive-container">
                        <h2>최근 아카이브 업로드</h2>

                        {fileList.length === 0 ? (
                            <div className="no-posts-container">
                                <p className="no-posts-message">📂 업로드된 파일이 없습니다</p>
                            </div>
                        ) : (
                            <div className="main-archive-card-list">
                                {fileList.map((file, index) => (
                                    <div
                                        className="main-archive-card"
                                        key={file.archId || index}
                                        onClick={() => navigate(`/archive/fileSelect/${file.fileUuidName}`)}
                                    >
                                        {/* 미리보기 영역 */}
                                        <div className="main-archive-card-preview">
                                            {renderArchivePreview(file)}
                                        </div>

                                        {/* 정보 영역 */}
                                        <div className="main-archive-card-info">
                                            <div className="main-archive-card-header">
                                                <span className="main-archive-ext-badge">
                                                    {file.fileExtension?.replace('.', '').toUpperCase()}
                                                </span>
                                                {file.isEncrypted && (
                                                    <span className="main-archive-lock-badge">
                                                        <LockIcon /> 암호화
                                                    </span>
                                                )}
                                            </div>
                                            <p className="main-archive-filename" title={file.fileMainName}>
                                                {file.fileMainName?.length > 20
                                                    ? file.fileMainName.substring(0, 20) + '...'
                                                    : file.fileMainName}
                                            </p>
                                            <div className="main-archive-meta">
                                                <span>{file.uploader}</span>
                                                <span>{formatDate(file.uploadDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
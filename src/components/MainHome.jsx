import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';

import '../css/MainHome.css';

import ProjectSlider from '../components/ProjectSlider.jsx'
import API from '../config/apiConfig.js';
import { formatDate } from '../util/dateFormat.js';

export default function MainHome() {
    const { addToast } = useToast();
    const [boardList, setBoardList] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [filesLoading, setFilesLoading] = useState(true);
    const [fileError, setFileError] = useState(false);

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
                setFileError(true);
            } finally {
                setFilesLoading(false);
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
            } finally {
                setPostsLoading(false);
            }
        };
        getCallRecentlyBoardInformation();
    }, [addToast]);

    // ----------------------------------------------------------------
    // 날짜 포맷
    // ----------------------------------------------------------------


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
                    loading="lazy"
                    alt=""
                />
            );
        }
        if (!file.isEncrypted && isVideo) {
            return (
                <video
                    src={`${API.API_BASE_URL}/archive/file/${file.fileUuidName}`}
                    className="main-archive-preview-img"
                    muted
                    preload="none"
                />
            );
        }
        if (!file.isEncrypted && isMp3WithThumb) {
            return (
                <img
                    src={`${API.API_BASE_URL}/archive/file/mp3/${file.mp3FileThumb}`}
                    className="main-archive-preview-img"
                    loading="lazy"
                    alt=""
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
        <main className="main-home-container">
            <ProjectSlider />
            <div className="home-recent-grid">
                <section className="home-section" aria-labelledby="home-posts-title">
                    <header className="home-section-header">
                        <h2 id="home-posts-title">최근 게시글</h2>
                        <Link className="home-more" to="/boards" aria-label="게시글 전체 보기">전체 보기 <span aria-hidden="true">→</span></Link>
                    </header>
                    {postsLoading ? <p className="home-state" role="status">게시글을 불러오는 중입니다.</p>
                    : hasError ? <p className="home-state" role="status">게시글을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.</p>
                    : boardList.length === 0 ? <p className="home-state">아직 게시글이 없습니다.</p>
                    : <ul className="home-post-list">
                        {boardList.map((post, index) => (
                            <li key={`${post.boardId}-${post.boardPostId || index}`}>
                                <Link className="home-post-link" to={`/boardsPost/${encodeURIComponent(post.boardName || '게시판')}/${post.boardId}/${post.boardPostId}`}>
                                    <span className="home-post-title">{post.postIsPinned && <span className="home-pinned">고정</span>}{post.postTitle}</span>
                                    <span className="home-item-meta">
                                        <span className="home-board-name" title={post.boardName}>{post.boardName || '미분류'}</span>
                                        <span aria-hidden="true">·</span>
                                        <span className="home-item-date">{formatDate(post.createdAt)}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>}
                </section>
                <section className="home-section" aria-labelledby="home-archive-title">
                    <header className="home-section-header">
                        <h2 id="home-archive-title">최근 아카이브</h2>
                        <Link className="home-more" to="/archives" aria-label="아카이브 전체 보기">전체 보기 <span aria-hidden="true">→</span></Link>
                    </header>
                    {filesLoading ? <p className="home-state" role="status">파일을 불러오는 중입니다.</p>
                    : fileError ? <p className="home-state" role="status">파일을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.</p>
                    : fileList.length === 0 ? <p className="home-state">아직 업로드된 파일이 없습니다.</p>
                    : <ul className="home-file-list">
                        {fileList.map((file, index) => (
                            <li key={file.archId || file.fileUuidName || index}>
                                <Link className="home-file-link" to={`/archives/fileSelect/${file.fileUuidName}`}>
                                    <span className="home-file-preview" aria-hidden="true">{renderArchivePreview(file)}</span>
                                    <span className="home-file-info">
                                        <span className="home-file-badges">
                                            <span className="home-file-ext">{file.fileExtension?.replace('.', '').toUpperCase()}</span>
                                            {file.isEncrypted && <span className="home-file-lock"><LockIcon /> 암호화</span>}
                                        </span>
                                        <span className="home-file-name" title={file.fileMainName}>{file.fileMainName}</span>
                                        <span className="home-item-meta"><span className="home-item-date">{formatDate(file.uploadDate)}</span></span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>}
                </section>
            </div>
        </main>
    );
}

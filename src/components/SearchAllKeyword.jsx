import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import API from '../config/apiConfig.js';
import '../css/SearchAllFunction.css';

// ── 확장자별 SVG 아이콘 ──
const getFileIcon = (ext) => {
    const e = (ext || '').toLowerCase().replace('.', '');
    const icons = {
        jpg: { color: '#4caf50', label: 'IMG' },
        jpeg: { color: '#4caf50', label: 'IMG' },
        png: { color: '#4caf50', label: 'PNG' },
        gif: { color: '#26a69a', label: 'GIF' },
        webp: { color: '#00897b', label: 'WEBP' },
        svg: { color: '#f57c00', label: 'SVG' },
        mp4: { color: '#e53935', label: 'MP4' },
        avi: { color: '#c62828', label: 'AVI' },
        mov: { color: '#d32f2f', label: 'MOV' },
        mkv: { color: '#b71c1c', label: 'MKV' },
        mp3: { color: '#7b1fa2', label: 'MP3' },
        wav: { color: '#6a1b9a', label: 'WAV' },
        flac: { color: '#4a148c', label: 'FLAC' },
        pdf: { color: '#f44336', label: 'PDF' },
        doc: { color: '#1565c0', label: 'DOC' },
        docx: { color: '#1565c0', label: 'DOCX' },
        xls: { color: '#2e7d32', label: 'XLS' },
        xlsx: { color: '#2e7d32', label: 'XLSX' },
        ppt: { color: '#e65100', label: 'PPT' },
        pptx: { color: '#e65100', label: 'PPTX' },
        txt: { color: '#757575', label: 'TXT' },
        zip: { color: '#ff8f00', label: 'ZIP' },
        rar: { color: '#ef6c00', label: 'RAR' },
        '7z': { color: '#e65100', label: '7Z' },
        js: { color: '#f9a825', label: 'JS' },
        ts: { color: '#1976d2', label: 'TS' },
        py: { color: '#0288d1', label: 'PY' },
        java: { color: '#ef6c00', label: 'JAVA' },
        html: { color: '#e64a19', label: 'HTML' },
        css: { color: '#0277bd', label: 'CSS' },
    };
    const info = icons[e] || { color: '#9e9e9e', label: e.toUpperCase() || 'FILE' };
    return (
        <div className="file-icon-box" style={{ backgroundColor: info.color }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
                fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="file-icon-label">{info.label}</span>
        </div>
    );
};

const ArchivePreview = ({ archive }) => {
    const ext = (archive.fileExtension || '').toLowerCase();
    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const vidExts = ['.mp4', '.avi', '.mov'];

    if (imgExts.includes(ext))
        return <img src={`${API.API_BASE_URL}/archive/file/${archive.fileUuidName}`} className="search-archive-preview-img" alt={archive.fileMainName} />;
    if (vidExts.includes(ext))
        return <video src={`${API.API_BASE_URL}/archive/file/${archive.fileUuidName}`} className="search-archive-preview-video" muted />;
    if (ext === '.mp3' && archive.mp3FileThumb)
        return <img src={`${API.API_BASE_URL}/archive/file/mp3/${archive.mp3FileThumb}`} className="search-archive-preview-img" alt={archive.mp3FileThumb} />;

    // getFileIcon도 점 제거 필요
    return getFileIcon(archive.fileExtension);
};

const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusInfo = (status) => {
    switch (status) {
        case 'I': return { label: '진행중', cls: 'status-in-progress' };
        case 'C': return { label: '완료', cls: 'status-complete' };
        case 'H': return { label: '대기', cls: 'status-hold' };
        case 'D': return { label: '중단', cls: 'status-deleted' };
        default: return { label: status, cls: '' };
    }
};

const highlight = (text, keyword) => {
    if (!text || !keyword) return text;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
};

// SVG 아이콘
const IconBoard = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" />
    </svg>
);
const IconPost = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);
const IconProject = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);
const IconArchive = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
);
const IconLock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const SectionHeader = ({ icon, title, count }) => (
    <div className="search-section-header">
        <span className="search-section-icon">{icon}</span>
        <h2 className="search-section-title">{title}</h2>
        <span className="search-section-count">{count}개</span>
    </div>
);

const EmptyResult = () => (
    <div className="search-section-empty">검색 결과가 없습니다</div>
);

// ═══════════════════════════════════════
export default function SearchAllFunction() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { searchAllKey } = useParams();

    const [searchBoardList, setSearchBoardList] = useState([]);
    const [searchBoardPostList, setSearchBoardPostList] = useState([]);
    const [searchArchiveList, setSearchArchiveList] = useState([]);
    const [searchProjectList, setSearchProjectList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getSearchResult = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API.API_BASE_URL}/main/search/allfunction`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ searchAllKey })
                });
                const result = await response.json();
                if (!response.ok) {
                    addToast(result.searchMessage || "검색 오류", "error");
                    return;
                }
                setSearchBoardList(result.boardList || []);
                setSearchBoardPostList(result.boardPostList || []);
                setSearchProjectList(result.projectList || []);
                setSearchArchiveList(result.archiveList || []);
            } catch (error) {
                localStorage.setItem('redirectToast', JSON.stringify({
                    status: 'error', message: error.message || "서버 통신 불가"
                }));
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };
        getSearchResult();
    }, [searchAllKey]);

    //게시판 이동용 핸들러 섹션
    const storageWithExpiry = {
        setItem: (key, value) => {
            const now = new Date();
            const item = { value, expiry: now.getTime() + (2 * 60 * 60 * 1000) };
            localStorage.setItem(key, JSON.stringify(item));
        }
    };

    const handleBoardClick = (board) => {
        storageWithExpiry.setItem('selectedBoardId', board.boardPriId.toString());
        storageWithExpiry.setItem('selectedBoardName', board.boardName);
        storageWithExpiry.setItem('selectedBoardPtd', board.boardProtected.toString());
        storageWithExpiry.setItem('selectedBoardDec', board.boardDec || '');
        navigate('/board');
    };

    const totalCount = searchBoardList.length + searchBoardPostList.length
        + searchProjectList.length + searchArchiveList.length;

    if (isLoading) {
        return (
            <div className="search-main-container">
                <div className="search-loading">
                    <div className="search-loading-spinner" />
                    <p>검색 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="search-main-container">
            {/* ── 헤더 ── */}
            <div className="search-header">
                <div className="search-header-left">
                    <span className="search-keyword-label">"{searchAllKey}"</span>
                    <span className="search-keyword-sub">검색 결과</span>
                </div>
                <div className="search-total-count">총 <strong>{totalCount}</strong>개</div>
            </div>

            {totalCount === 0 ? (
                <div className="search-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24"
                        fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어를 입력해 보세요.</p>
                </div>
            ) : (
                <div className="search-body">

                    {/* ── 상단: 게시판 1 | 게시글 3 ── */}
                    <div className="search-top-row">

                        {/* 게시판 */}
                        <div className="search-section search-col-board">
                            <SectionHeader icon={<IconBoard />} title="게시판" count={searchBoardList.length} />
                            {searchBoardList.length === 0 ? <EmptyResult /> : (
                                <div className="search-board-list">
                                    {searchBoardList.map((board) => (
                                        <div key={board.boardPriId} className="search-board-item"
                                            onClick={() => handleBoardClick(board)}>
                                            <div className="search-board-name">
                                                {board.boardProtected && <span className="search-lock"><IconLock /></span>}
                                                {highlight(board.boardName, searchAllKey)}
                                            </div>
                                            {board.boardDec && (
                                                <div className="search-board-desc">
                                                    {highlight(board.boardDec, searchAllKey)}
                                                </div>
                                            )}
                                            <div className="search-item-meta">by {board.boardCreator}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 게시글 */}
                        <div className="search-section search-col-post">
                            <SectionHeader icon={<IconPost />} title="게시글" count={searchBoardPostList.length} />
                            {searchBoardPostList.length === 0 ? <EmptyResult /> : (
                                <div className="search-post-scroll">
                                    <table className="search-post-table">
                                        <thead>
                                            <tr>
                                                <th>제목</th>
                                                <th>게시판</th>
                                                <th>작성자</th>
                                                <th>조회</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchBoardPostList.map((post) => (
                                                <tr key={post.boardPostPr} className="search-post-row"
                                                    onClick={() => navigate(`/boardPost/${post.boardName}/${post.boardId}/${post.boardPostId}`)}>
                                                    <td className="search-post-title">
                                                        {highlight(post.postTitle, searchAllKey)}
                                                    </td>
                                                    <td className="search-post-board">{post.boardName}</td>
                                                    <td className="search-post-author">{post.postAnonymous ?? post.postAuthor}</td>
                                                    <td className="search-post-views">{post.postViewCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 중단: 프로젝트 ── */}
                    <div className="search-section search-section-full">
                        <SectionHeader icon={<IconProject />} title="프로젝트" count={searchProjectList.length} />
                        {searchProjectList.length === 0 ? <EmptyResult /> : (
                            <div className="search-project-grid">
                                {searchProjectList.map((project) => {
                                    const { label, cls } = getStatusInfo(project.status);
                                    return (
                                        <div key={project.id} className="search-project-card"
                                            onClick={() => navigate(`/project/manage/${project.id}`)}>
                                            <div className="search-project-thumb">
                                                {project.projectThumb ? (
                                                    <img
                                                        src={`${API.API_BASE_URL}/projectThumb/${project.projectThumb}`}
                                                        alt={project.title}
                                                    />
                                                ) : (
                                                    <div className="search-project-no-thumb">
                                                        <IconProject />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="search-project-info">
                                                <div className="search-project-title-row">
                                                    <span className="search-project-title">
                                                        {highlight(project.title, searchAllKey)}
                                                    </span>
                                                    <span className={`search-status-badge ${cls}`}>{label}</span>
                                                </div>
                                                {project.summary && (
                                                    <div className="search-project-summary">
                                                        {highlight(project.summary, searchAllKey)}
                                                    </div>
                                                )}
                                                {project.skillStack && (
                                                    <div className="search-skill-stack">
                                                        {project.skillStack.split(',').map((s, i) => (
                                                            <span key={i} className="search-skill-tag">{s.trim()}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="search-item-meta">
                                                    <span>{project.teamValue ? `팀: ${project.teamName}` : project.starter}</span>
                                                    <span className="search-meta-dot">·</span>
                                                    <span>{project.pjCategory}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── 하단: 아카이브 ── */}
                    <div className="search-section search-section-full">
                        <SectionHeader icon={<IconArchive />} title="아카이브" count={searchArchiveList.length} />
                        {searchArchiveList.length === 0 ? <EmptyResult /> : (
                            <div className="search-archive-grid">
                                {searchArchiveList.map((archive) => (
                                    <div key={archive.archId} className="search-archive-card"
                                        onClick={() => navigate(`/archive/fileSelect/${archive.fileUuidName}`)}>
                                        <div className="search-archive-preview">
                                            <ArchivePreview archive={archive} />
                                        </div>
                                        <div className="search-archive-info">
                                            <div className="search-archive-name">
                                                {archive.isEncrypted && <span className="search-lock"><IconLock /></span>}
                                                {highlight(archive.fileMainName, searchAllKey)}
                                                <span className="search-ext-badge">.{archive.fileExtension}</span>
                                            </div>
                                            <div className="search-item-meta">
                                                <span>{archive.uploader}</span>
                                                <span className="search-meta-dot">·</span>
                                                <span>{formatFileSize(archive.fileSize)}</span>
                                                <span className="search-meta-dot">·</span>
                                                <span>다운로드 {archive.downloadCount ?? 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
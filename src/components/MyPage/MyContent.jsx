import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import API from '../../config/apiConfig.js';
import '../../css/MyContent.css';

const GET_WORK_PROCESS_INFO = `${API.API_BASE_URL}/get/info/work/process`;

/* ────────────────────────────────────────────
   SVG 아이콘
──────────────────────────────────────────── */
const IconProject = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
);
const IconArchive = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" rx="1" />
        <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
);
const IconBoard = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);
const IconPost = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
);
const IconComment = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const IconTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);
const IconGo = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const IconEmpty = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const IconWarn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const IconClose = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ────────────────────────────────────────────
   상수
──────────────────────────────────────────── */
const TABS = [
    { key: 'project', label: '프로젝트', Icon: IconProject },
    { key: 'archive', label: '아카이브', Icon: IconArchive },
    { key: 'board', label: '게시판', Icon: IconBoard },
    { key: 'post', label: '게시글', Icon: IconPost },
    { key: 'comment', label: '댓글', Icon: IconComment },
];

const PROJECT_STATUS = {
    H: { label: '대기', color: '#9ca3af' },
    I: { label: '진행중', color: '#3b82f6' },
    C: { label: '완료', color: '#10b981' },
    D: { label: '중단', color: '#ef4444' },
};

/* ────────────────────────────────────────────
   유틸
──────────────────────────────────────────── */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
    });
}

function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ────────────────────────────────────────────
   메인 컴포넌트
──────────────────────────────────────────── */
export default function MyContent() {
    const navigate = useNavigate();
    const { isLogined, isLoading } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState('project');
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [boardList, setBoardList] = useState([]);
    const [boardPostList, setBoardPostList] = useState([]);
    const [boardPostCommentList, setBoardPostCommentList] = useState([]);
    const [projectList, setProjectList] = useState([]);
    const [archiveList, setArchiveList] = useState([]);

    // 게시판 삭제 모달
    const [deleteBoardModal, setDeleteBoardModal] = useState(false);
    const [targetBoard, setTargetBoard] = useState(null);
    const [boardDeletePw, setBoardDeletePw] = useState('');

    /* 로그인 체크 */
    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({
                status: 'error', message: '로그인이 필요한 서비스 입니다',
            }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    /* 데이터 fetch */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(GET_WORK_PROCESS_INFO, {
                    method: 'POST',
                    credentials: 'include',
                });
                const result = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.setItem('redirectToast', JSON.stringify({
                            status: 'error',
                            message: result.getWorkInfoMessage || '로그인이 필요한 서비스 입니다',
                        }));
                        navigate('/login');
                        return;
                    }
                    throw new Error(result.getWorkInfoMessage || '서버 통신 불가');
                }

                if (result.getWorkInfoStatus) {
                    setBoardList(result.boardList ?? []);
                    setBoardPostList(result.boardPostList ?? []);
                    setBoardPostCommentList(result.boardPostCommentList ?? []);
                    setProjectList(result.projectList ?? []);
                    setArchiveList(result.archiveList ?? []);
                } else {
                    throw new Error('서버 통신 불가');
                }
            } catch (error) {
                localStorage.setItem('redirectToast', JSON.stringify({
                    status: 'error', message: error.message,
                }));
                navigate('/');
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, []);

    //게시판 이동용 로컬스토리지 저장을 위한 핸들러
    const storageWithExpiry = (key, value) => {
        const item = {
            value: value,
            expiry: new Date().getTime() + (2 * 60 * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    };

    //게시판 이동용 핸들러
    const handleNavigateToBoard = (item) => {
        storageWithExpiry('selectedBoardId', item.boardPriId.toString());
        storageWithExpiry('selectedBoardName', item.boardName);
        storageWithExpiry('selectedBoardPtd', item.boardProtected.toString());
        storageWithExpiry('selectedBoardDec', item.boardDec || '');
        navigate('/board');
    };

    //댓글 엔티티에 게시판 네임이 없는 관계로 보드 아이디만 전송해서 보드 네임 리턴하는 API가 있다?!?!?
    //그냥 설계 미스임
    const handleNavigateToComment = async (item) => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/board/info/id`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId: item.board })
            });
            const result = await response.json();

            if (result.boardInfoStatus) {
                navigate(`/boardPost/${result.boardName}/${item.board}/${item.post}`);
            } else {
                throw new Error(result.boardInfoMessage || "서버 통신 불가");
            }
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: error.message }));
            navigate(error.message === '로그인이 필요합니다' ? '/login' : '/');
            return;
        }
    };

    /* ── 삭제 핸들러 ── */

    // 아카이브 삭제
    const handleDeleteArchive = async (fileUuid) => {
        if (!window.confirm('이 파일을 삭제하시겠습니까?')) return;
        try {
            const response = await fetch(`${API.API_BASE_URL}/archive/file/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUuid }),
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: result.fileDeleteMessage }));
                    navigate('/login'); return;
                }
                if (response.status === 403) {
                    addToast(result.fileDeleteMessage || '삭제 권한이 없습니다', 'error'); return;
                }
                throw new Error(result.fileDeleteMessage || '서버 통신 불가');
            }
            addToast(result.fileDeleteMessage || '삭제되었습니다', 'success');
            setArchiveList(prev => prev.filter(f => f.fileUuidName !== fileUuid));
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: error.message }));
            navigate('/');
        }
    };

    // 게시판 삭제 모달
    const openBoardDeleteModal = (board) => { setTargetBoard(board); setBoardDeletePw(''); setDeleteBoardModal(true); };
    const closeBoardDeleteModal = () => { setDeleteBoardModal(false); setTargetBoard(null); setBoardDeletePw(''); };

    const handleDeleteBoard = async (e) => {
        e.preventDefault();
        if (!targetBoard) return;
        const url = targetBoard.boardProtected
            ? `${API.API_BASE_URL}/private/deleteBoard`
            : `${API.API_BASE_URL}/board/deleteBoard`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deleteBoardId: targetBoard.boardPriId,
                    deleteBoardName: targetBoard.boardName,
                    deleteBoardCreator: targetBoard.boardCreator,
                    deleteBoardProtected: targetBoard.boardProtected,
                    deleteBoardPassword: boardDeletePw,
                }),
            });
            const result = await response.json();
            if (!response.ok) { addToast('서버 통신 불가', 'error'); closeBoardDeleteModal(); return; }
            if (result.deleteStatus) {
                addToast(result.deleteMessage, 'success');
                setBoardList(prev => prev.filter(b => b.boardPriId !== targetBoard.boardPriId));

                // 삭제된 게시판의 선택된 요소가 이렇다면 스토리지 클리어 작업
                localStorage.removeItem('selectedBoardId');
                localStorage.removeItem('selectedBoardName');
                localStorage.removeItem('selectedBoardPtd');
                localStorage.removeItem('selectedBoardDec');
            } else {
                addToast(result.deleteMessage, 'warning');
            }
        } catch {
            addToast('서버 통신 불가', 'error');
        } finally {
            closeBoardDeleteModal();
        }
    };

    // 게시글 삭제 (보안 게시판 여부 분기)
    const handleDeletePost = async (post) => {
        if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
        const isProtected = boardList.find(b => b.boardPriId === post.boardId)?.boardProtected ?? false;
        const url = isProtected
            ? `${API.API_BASE_URL}/private/post/delete`
            : `${API.API_BASE_URL}/board/post/delete`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callingContentBoardId: post.boardId,
                    calliingContentPostId: post.boardPostId,
                }),
            });
            const result = await response.json();
            if (!response.ok) { addToast('서버 통신 불가', 'error'); return; }
            if (result.deletePostStatus) {
                addToast(result.deletePostMessage, 'success');
                setBoardPostList(prev => prev.filter(p => p.boardPostPr !== post.boardPostPr));
            } else {
                addToast(result.deletePostMessage || '삭제 실패', 'error');
            }
        } catch {
            addToast('게시글 삭제 중 오류가 발생했습니다', 'error');
        }
    };

    // 댓글 삭제 (보안 게시판 여부 분기)
    const handleDeleteComment = async (comment) => {
        if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
        const isProtected = boardList.find(b => b.boardPriId === comment.board)?.boardProtected ?? false;
        const url = isProtected
            ? `${API.API_BASE_URL}/private/comment/delete`
            : `${API.API_BASE_URL}/board/comment/delete`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentoryBid: comment.board,
                    commentoryPid: comment.post,
                    commentoryCid: comment.boardPostCmId,
                }),
            });
            const result = await response.json();
            if (!response.ok) { addToast('서버 통신 불가', 'error'); return; }
            if (result.commentDeleteStatus) {
                addToast(result.commentDeleteMessage, 'success');
                setBoardPostCommentList(prev => prev.filter(c => c.boardPostCmId !== comment.boardPostCmId));
            } else {
                addToast(result.commentDeleteMessage || '댓글 삭제 실패', 'error');
            }
        } catch {
            addToast('댓글 삭제 중 오류가 발생했습니다', 'error');
        }
    };

    // 프로젝트 삭제
    const handleDeleteProject = async (project) => {
        if (project.status === 'H') {
            addToast('대기중인 프로젝트는 삭제 불가능합니다', 'error');
            return;
        }

        if (!window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) return;


        try {
            const response = await fetch(`${API.API_BASE_URL}/project/delete`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id }),
            });
            if (!response.ok) {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: '서버 오류로 삭제가 불가능합니다' }));
                navigate('/'); return;
            }
            const result = await response.json();
            if (result.deleteStatus) {
                addToast('삭제되었습니다', 'success');
                setProjectList(prev => prev.filter(p => p.id !== project.id));
            } else {
                if (result.deleteForMember) {
                    try {
                        const mResponse = await fetch(`${API.API_BASE_URL}/project/draw/member`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ projectId: project.id }),
                        });

                        const mResult = await mResponse.json();

                        if (!mResponse.ok) {
                            if (mResponse.status === 401) {
                                localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: mResult.exitMessage || "로그인이 필요한 서비스입니다" }));
                                navigate('/');
                            }
                            throw new Error(mResult.exitMessage || "서버 통신 불가");
                        } else {
                            if (mResult.exitMessage) {
                                addToast(mResult.exitMessage, 'success');
                            }
                            setProjectList(prev => prev.filter(p => p.id !== project.id));
                        }
                    } catch (error) {
                        localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
                        navigate('/');
                    }
                } else {
                    addToast(result.deleteMessage, 'error');
                }
            }
        } catch {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: '서버 오류로 삭제가 불가능합니다' }));
            navigate('/');
        }
    };

    const countMap = {
        project: projectList.length,
        archive: archiveList.length,
        board: boardList.length,
        post: boardPostList.length,
        comment: boardPostCommentList.length,
    };

    return (
        <div className="mycontent-root">

            {/* 탭 바 */}
            <div className="mycontent-tab-bar">
                {TABS.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        className={`mycontent-tab ${activeTab === key ? 'active' : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        <span className="tab-icon"><Icon /></span>
                        <span className="tab-label">{label}</span>
                        <span className="tab-badge">{countMap[key]}</span>
                    </button>
                ))}
            </div>

            {/* 컨텐츠 바디 */}
            <div className="mycontent-body">
                {isDataLoading ? (
                    <p>불러오는 중...</p>
                ) : (
                    <>
                        {activeTab === 'project' && (
                            <Section title="참여중인 프로젝트" count={projectList.length} empty="참여중인 프로젝트가 없습니다">
                                {projectList.map(item => (
                                    <ProjectCard
                                        key={item.id}
                                        item={item}
                                        onNavigate={() => navigate(`/project/manage/${item.id}`)}
                                        onDelete={() => handleDeleteProject(item)}
                                    />
                                ))}
                            </Section>
                        )}
                        {activeTab === 'archive' && (
                            <Section title="업로드한 아카이브" count={archiveList.length} empty="업로드한 아카이브가 없습니다">
                                {archiveList.map(item => (
                                    <ArchiveCard
                                        key={item.archId}
                                        item={item}
                                        onNavigate={() => navigate(`/archive/fileselect/${item.fileUuidName}`)}
                                        onDelete={() => handleDeleteArchive(item.fileUuidName)}
                                    />
                                ))}
                            </Section>
                        )}
                        {activeTab === 'board' && (
                            <Section title="생성한 게시판" count={boardList.length} empty="생성한 게시판이 없습니다">
                                {boardList.map(item => (
                                    <BoardCard
                                        key={item.boardPriId}
                                        item={item}
                                        onNavigate={() => handleNavigateToBoard(item)}
                                        onDelete={() => openBoardDeleteModal(item)}
                                    />
                                ))}
                            </Section>
                        )}
                        {activeTab === 'post' && (
                            <Section title="작성한 게시글" count={boardPostList.length} empty="작성한 게시글이 없습니다">
                                {boardPostList.map(item => (
                                    <PostCard
                                        key={item.boardPostPr}
                                        item={item}
                                        onNavigate={() => navigate(`/boardPost/${item.boardName}/${item.boardId}/${item.boardPostId}`)}
                                        onDelete={() => handleDeletePost(item)}
                                    />
                                ))}
                            </Section>
                        )}
                        {activeTab === 'comment' && (
                            <Section title="작성한 댓글" count={boardPostCommentList.length} empty="작성한 댓글이 없습니다">
                                {boardPostCommentList.map(item => (
                                    <CommentCard
                                        key={item.boardPostCmId}
                                        item={item}
                                        onNavigate={() => handleNavigateToComment(item)}
                                        onDelete={() => handleDeleteComment(item)}
                                    />
                                ))}
                            </Section>
                        )}
                    </>
                )}
            </div>

            {/* 게시판 삭제 모달 */}
            {deleteBoardModal && targetBoard && (
                <div className="mc-modal-overlay" onClick={closeBoardDeleteModal}>
                    <div className="mc-modal" onClick={e => e.stopPropagation()}>
                        <div className="mc-modal-header">
                            <h3>게시판 삭제</h3>
                            <button className="mc-modal-close" onClick={closeBoardDeleteModal}>
                                <IconClose />
                            </button>
                        </div>
                        <form onSubmit={handleDeleteBoard}>
                            <div className="mc-modal-body">
                                <div className="mc-modal-warning">
                                    <IconWarn />
                                    <p>
                                        <strong>{targetBoard.boardName}</strong> 게시판을 삭제하시겠습니까?<br />
                                        게시판의 모든 게시글이 함께 삭제됩니다.
                                    </p>
                                </div>
                                {targetBoard.boardProtected && (
                                    <div className="mc-modal-input-group">
                                        <label>게시판 비밀번호</label>
                                        <input
                                            type="password"
                                            placeholder="비밀번호를 입력하세요"
                                            value={boardDeletePw}
                                            onChange={e => setBoardDeletePw(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mc-modal-footer">
                                <button type="button" className="mc-modal-btn-cancel" onClick={closeBoardDeleteModal}>취소</button>
                                <button type="submit" className="mc-modal-btn-delete">삭제</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ────────────────────────────────────────────
   공통 섹션 래퍼
──────────────────────────────────────────── */
function Section({ title, count, empty, children }) {
    const hasItems = React.Children.count(children) > 0;
    return (
        <div className="mycontent-section">
            <div className="section-header">
                <h3 className="section-title">{title}</h3>
                <span className="section-count">총 {count}건</span>
            </div>
            {!hasItems ? (
                <div className="mycontent-empty">
                    <IconEmpty />
                    <p>{empty}</p>
                </div>
            ) : (
                <div className="mycontent-list">{children}</div>
            )}
        </div>
    );
}

/* ────────────────────────────────────────────
   카드 컴포넌트
──────────────────────────────────────────── */
function ProjectCard({ item, onNavigate, onDelete }) {
    const st = PROJECT_STATUS[item.status] || { label: '-', color: '#9ca3af' };
    return (
        <div className="mc-card">
            <div className="mc-card-left" onClick={onNavigate}>
                <div className="mc-card-title-row">
                    <span className="mc-card-title">{item.title}</span>
                    <span className="mc-status-badge" style={{ color: st.color }}>● {st.label}</span>
                </div>
                <div className="mc-card-meta-row">
                    <span className="mc-card-meta">{item.pjCategory || '카테고리 없음'}</span>
                    {item.teamValue && <span className="mc-card-meta">팀: {item.teamName || '-'}</span>}
                    <span className="mc-card-meta">{formatDate(item.created)}</span>
                </div>
            </div>
            <div className="mc-card-actions">
                <button className="mc-card-goto" onClick={onNavigate} title="이동"><IconGo /></button>
                <button className="mc-card-delete" onClick={onDelete} title="삭제"><IconTrash /></button>
            </div>
        </div>
    );
}

function ArchiveCard({ item, onNavigate, onDelete }) {
    return (
        <div className="mc-card">
            <div className="mc-card-left" onClick={onNavigate}>
                <div className="mc-card-title-row">
                    <span className="mc-card-title">{item.fileMainName}</span>
                    <span className="mc-ext-badge">{item.fileExtension?.replace('.', '').toUpperCase()}</span>
                    {item.isEncrypted && <span className="mc-lock-icon" title="암호화 파일"><IconLock /></span>}
                </div>
                <div className="mc-card-meta-row">
                    <span className="mc-card-meta">{formatSize(item.fileSize)}</span>
                    <span className="mc-card-meta">다운로드 {item.downloadCount ?? 0}회</span>
                    <span className="mc-card-meta">{formatDate(item.uploadDate)}</span>
                </div>
            </div>
            <div className="mc-card-actions">
                <button className="mc-card-goto" onClick={onNavigate} title="이동"><IconGo /></button>
                <button className="mc-card-delete" onClick={onDelete} title="삭제"><IconTrash /></button>
            </div>
        </div>
    );
}

function BoardCard({ item, onNavigate, onDelete }) {
    return (
        <div className="mc-card">
            <div className="mc-card-left" onClick={onNavigate}>
                <div className="mc-card-title-row">
                    <span className="mc-card-title">{item.boardName}</span>
                    {item.boardProtected && <span className="mc-lock-icon" title="비밀번호 보호"><IconLock /></span>}
                </div>
                <div className="mc-card-meta-row">
                    {item.boardDec && <span className="mc-card-meta">{item.boardDec}</span>}
                    <span className="mc-card-meta">{formatDate(item.createdAt)}</span>
                </div>
            </div>
            <div className="mc-card-actions">
                <button className="mc-card-goto" onClick={onNavigate} title="이동"><IconGo /></button>
                <button className="mc-card-delete" onClick={onDelete} title="삭제"><IconTrash /></button>
            </div>
        </div>
    );
}

function PostCard({ item, onNavigate, onDelete }) {
    return (
        <div className="mc-card">
            <div className="mc-card-left" onClick={onNavigate}>
                <div className="mc-card-title-row">
                    <span className="mc-card-title">{item.postTitle}</span>
                    {item.postIsPinned && <span className="mc-pin-badge">고정</span>}
                </div>
                <div className="mc-card-meta-row">
                    <span className="mc-card-meta">{item.boardName}</span>
                    <span className="mc-card-meta">조회 {item.postViewCount ?? 0}</span>
                    <span className="mc-card-meta">{formatDate(item.createdAt)}</span>
                </div>
            </div>
            <div className="mc-card-actions">
                <button className="mc-card-goto" onClick={onNavigate} title="이동"><IconGo /></button>
                <button className="mc-card-delete" onClick={onDelete} title="삭제"><IconTrash /></button>
            </div>
        </div>
    );
}

function CommentCard({ item, onNavigate, onDelete }) {
    return (
        <div className="mc-card">
            <div className="mc-card-left" onClick={onNavigate}>
                <div className="mc-card-title-row">
                    <span className="mc-card-title mc-card-title--comment">{item.boardCommentContext}</span>
                </div>
                <div className="mc-card-meta-row">
                    <span className="mc-card-meta">{formatDate(item.createdAt)}</span>
                </div>
            </div>
            <div className="mc-card-actions">
                <button className="mc-card-goto" onClick={onNavigate} title="이동"><IconGo /></button>
                <button className="mc-card-delete" onClick={onDelete} title="삭제"><IconTrash /></button>
            </div>
        </div>
    );
}
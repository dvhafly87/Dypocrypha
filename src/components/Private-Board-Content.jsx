import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useBoardListState } from '../util/useBoardListState.js';
import API from '../config/apiConfig';
import '../css/BoardPost.css';
import { formatListDate, isSeoulToday, parseDate } from '../util/dateFormat.js';

export default function PrivateBoardPost({ boardId, boardName, boardDescription }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [posts, setPosts] = useState([]);
  const { currentPage, setCurrentPage, postSearchQuery, setPostSearchQuery, loaded, setLoaded, rememberList } = useBoardListState(boardId, 'private');

  const isPostEdited = (createdAt, updatedAt) => {
    const created = parseDate(createdAt)?.getTime();
    const updated = parseDate(updatedAt)?.getTime();
    return (updated - created) > 1000;
  };



  // 검색 필터링
  const filteredPosts = posts.filter(post =>
    post.postTitle.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
    post.postAuthor?.toLowerCase().includes(postSearchQuery.toLowerCase())
  );

  // 이후 pinnedPosts, normalPosts를 posts 대신 filteredPosts 기준으로 변경
  const pinnedPosts = filteredPosts.filter(post => post.postIsPinned);
  const normalPosts = filteredPosts.filter(post => !post.postIsPinned);

  let postsPerPage = 6;

  postsPerPage = isMobile ? 5 : 6;
  const maxLength = Math.floor((window.innerWidth * 0.8) / 8);
  const minSwipeDistance = 50;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const boardPostCalling = async () => {
      try {
        const response = await fetch(`${API.API_BASE_URL}/private/postcalling`, {
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

        if (result.boardPostCallingStatus) {
          setLoaded(true);
          if (result.boardPostCallingBoard != null) {
            setPosts(result.boardPostCallingBoard);
          } else {
            setPosts([]);
          }
        } else {
          const toastData = {
            status: 'warning',
            message: result.boardPostCallingMessage
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
        }

      } catch (error) {
        const toastData = {
          status: 'error',
          message: "게시판 목록을 불러오는데 실패했습니다"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
      }
    };

    boardPostCalling();
  }, [boardId, boardName, navigate, addToast]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
    if (isRightSwipe && currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handlePostClick = (postId) => {
    rememberList();
    navigate(`/privatePost/${boardName}/${boardId}/${postId}`);
  };

  const handleWritePost = () => {
    navigate(`/privatewriter/${boardId}`);
  };

  const handleBack = () => {
    navigate('/boards');
  };

  // 페이지네이션 계산
  postsPerPage = Math.max(1, postsPerPage - pinnedPosts.length);

  const totalPages = Math.max(1, Math.ceil(normalPosts.length / postsPerPage));
  useEffect(() => {
    if (loaded && currentPage > totalPages) setCurrentPage(totalPages);
  }, [loaded, currentPage, totalPages, setCurrentPage]);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = normalPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="board-post-container">
      {/* 헤더 */}
      <div className="board-post-header">
        <div className="board-post-header-left">
          <div className="board-title-tooltip-wrapper">
            <h1 className="board-post-title">{boardName}</h1>
            {boardDescription && (
              <span className="board-info-icon">
                !
                <div className="board-tooltip-bubble">
                  <div className="board-tooltip-arrow" />
                  {boardDescription}
                </div>
              </span>
            )}
          </div>
          <p className="board-post-meta">전체 게시글 {posts.length}개</p>
        </div>

        {/* 중앙: 게시글 검색창 */}
        <div className="board-post-search-wrapper">
          <input
            type="text"
            className="board-post-search-input"
            placeholder="게시글 검색..."
            value={postSearchQuery}
            onChange={(e) => setPostSearchQuery(e.target.value)}
          />
        </div>
        <div className="board-post-header-right">
          <button className="btn-write-post" onClick={handleWritePost}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            글쓰기
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div
        className="board-post-list-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>
        <table className="board-post-table">
          <thead className="board-post-table-header">
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="5" className="board-post-empty">
                  <div className="board-post-empty-icon">📝</div>
                  <h3 className="board-post-empty-title">게시글이 없습니다</h3>
                </td>
              </tr>
            ) : pinnedPosts.length === 0 && normalPosts.length === 0 ? (
              // ↑ 검색 결과 없을 때
              <tr>
                <td colSpan="5" className="board-post-empty">
                  <div className="board-post-empty-icon">🔍</div>
                  <h3 className="board-post-empty-title">
                    "{postSearchQuery}"에 해당하는 게시글이 없습니다
                  </h3>
                </td>
              </tr>
            ) : (
              <>
                {/* 고정 게시글 */}
                {pinnedPosts.map((post) => {
                  const edited = isPostEdited(post.createdAt, post.updatedAt);
                  return (
                    <tr key={post.boardPostId} className="board-post-row board-post-row-pinned" onClick={() => handlePostClick(post.boardPostId)}>
                      <td className="board-post-number">
                        <span className="board-post-notice-badge">공지</span>
                      </td>
                      <td>
                        <div className="board-post-title-cell">
                          <span className="board-post-title-text" title={post.postTitle}>
                            {post.postTitle}
                          </span>
                          {edited && (
                            <span className="board-post-edited-badge">수정됨</span>
                          )}
                        </div>
                      </td>
                      <td className="board-post-author">
                        {post.postAnonymous != null ? post.postAnonymous : post.postAuthor}
                      </td>
                      <td className="board-post-date">
                        {edited && (
                          <span className="date-label">
                            {isSeoulToday(post.updatedAt) ? '수정됨 ' : '수정일 '}
                          </span>
                        )}
                        {formatListDate(edited ? post.updatedAt : post.createdAt)}
                      </td>
                      <td className="board-post-views">{post.postViewCount}</td>
                    </tr>
                  );
                })}

                {/* 일반 게시글 - 동일한 패턴 적용 */}
                {currentPosts.map((post) => {
                  const edited = isPostEdited(post.createdAt, post.updatedAt);
                  return (
                    <tr key={post.boardPostId} className="board-post-row" onClick={() => handlePostClick(post.boardPostId)}>
                      <td className="board-post-number">{post.boardPostId}</td>
                      <td>
                        <div className="board-post-title-cell">
                          <span className="board-post-title-text" title={post.postTitle}>
                            {post.postTitle}
                          </span>
                          {edited && (
                            <span className="board-post-edited-badge">수정됨</span>
                          )}
                        </div>
                      </td>
                      <td className="board-post-author">{post.postAuthor}</td>
                      <td className="board-post-date">
                        {edited && (
                          <span className="date-label">
                            {isSeoulToday(post.updatedAt) ? '수정됨 ' : '수정일 '}
                          </span>
                        )}
                        {formatListDate(edited ? post.updatedAt : post.createdAt)}
                      </td>
                      <td className="board-post-views">{post.postViewCount}</td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {normalPosts.length > 0 && totalPages > 1 && (
        <div className="board-post-pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={`pagination-button ${currentPage === pageNumber ? 'pagination-button-active' : ''}`}
              onClick={() => handlePageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
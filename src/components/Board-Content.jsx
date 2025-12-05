import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../config/apiConfig';
import '../css/BoardPost.css';

export default function BoardPost({ boardId, boardName }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  let postsPerPage = 6;

  postsPerPage = isMobile ? 5 : 6;

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
        setIsLoading(true);
        const response = await fetch(`${API.API_BASE_URL}/board/postcalling`, {
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
        addToast("게시판 목록을 불러오는데 실패했습니다", "error");
      } finally {
        setIsLoading(false);
      }
    };

    boardPostCalling();
  }, [boardId, boardName, navigate, addToast]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

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
    navigate(`/boardPost/${boardId}/${postId}`);
  };

  const handleWritePost = () => {
    // navigate(`/board/${boardId}/write`);
    navigate(`/boardwriter/${boardId}`);
  };

  const handleBack = () => {
    navigate('/board');
  };

  if (isLoading) {
    return (
      <div className="board-post-container">
        <div className="board-post-loading">
          <div className="board-post-loading-spinner"></div>
          <p className="board-post-loading-text">게시판을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 고정 게시글과 일반 게시글 분리
  const pinnedPosts = posts.filter(post => post.postIsPinned);
  const normalPosts = posts.filter(post => !post.postIsPinned);

  // 페이지네이션 계산
  postsPerPage = postsPerPage - pinnedPosts.length;

  const totalPages = Math.ceil(normalPosts.length / postsPerPage);
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
          <h1 className="board-post-title">{boardName}</h1>
          <p className="board-post-meta">전체 게시글 {posts.length}개</p>
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
              <th>이미지</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" className="board-post-empty">
                  <div className="board-post-empty-icon">📝</div>
                  <h3 className="board-post-empty-title">게시글이 없습니다</h3>
                </td>
              </tr>
            ) : (
              <>
                {/* 고정 게시글 */}
                {pinnedPosts.map((post) => (
                  <tr
                    key={post.boardPostId}
                    className="board-post-row board-post-row-pinned"
                    onClick={() => handlePostClick(post.boardPostId)}
                  >
                    <td className="board-post-number">
                      <span className="board-post-notice-badge">공지</span>
                    </td>
                    <td>
                      <div className="board-post-title-cell">
                        <span className="board-post-title-text">{post.postTitle}</span>
                        {post.postMaxImages > 0 && (
                          <span className="board-post-image-indicator">
                            📷 {post.postMaxImages}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="board-post-author">{post.postAuthor}</td>
                    <td className="board-post-date">{formatDate(post.createdAt)}</td>
                    <td className="board-post-views">{post.postViewCount}</td>
                    <td className="board-post-images">
                      {post.postMaxImages > 0 ? post.postMaxImages : '-'}
                    </td>
                  </tr>
                ))}

                {/* 일반 게시글 */}
                {currentPosts.map((post) => (
                  <tr
                    key={post.boardPostId}
                    className="board-post-row"
                    onClick={() => handlePostClick(post.boardPostId)}
                  >
                    <td className="board-post-number">{post.boardPostId}</td>
                    <td>
                      <div className="board-post-title-cell">
                        <span className="board-post-title-text">{post.postTitle}</span>
                        {post.postMaxImages > 0 && (
                          <span className="board-post-image-indicator">
                            📷 {post.postMaxImages}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="board-post-author">{post.postAuthor}</td>
                    <td className="board-post-date">{formatDate(post.createdAt)}</td>
                    <td className="board-post-views">{post.postViewCount}</td>
                    <td className="board-post-images">
                      {post.postMaxImages > 0 ? post.postMaxImages : '-'}
                    </td>
                  </tr>
                ))}
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
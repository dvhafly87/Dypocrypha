import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../config/apiConfig';
import '../css/BoardPost.css';

export default function BoardPost({ boardId, boardName }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState([]);

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

  const handlePostClick = (postId) => {
    navigate(`/board/${boardId}/post/${postId}`);
  };

  const handleWritePost = () => {
    navigate(`/board/${boardId}/write`);
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
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            글쓰기
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="board-post-list-container">
        {posts.length === 0 ? (
          <div className="board-post-empty">
            <div className="board-post-empty-icon">📝</div>
            <h3 className="board-post-empty-title">게시글이 없습니다</h3>
            <p className="board-post-empty-message">
              첫 번째 게시글을 작성해보세요!
            </p>
            <button className="btn-write-first" onClick={handleWritePost}>
              첫 게시글 작성하기
            </button>
          </div>
        ) : (
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
              {normalPosts.map((post, index) => (
                <tr
                  key={post.boardPostId}
                  className="board-post-row"
                  onClick={() => handlePostClick(post.boardPostId)}
                >
                  <td className="board-post-number">{posts.length - pinnedPosts.length - index}</td>
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
            </tbody>
          </table>
        )}
      </div>

      {/* 하단 버튼 */}
      {posts.length > 0 && (
        <div className="board-post-footer">
          <button className="btn-back" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            목록으로
          </button>
          <button className="btn-write-post" onClick={handleWritePost}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            글쓰기
          </button>
        </div>
      )}
    </div>
  );
}
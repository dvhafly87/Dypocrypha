import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Calendar, User, Edit2, Trash2, List, Pin, MessageSquare, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../components/ToastContext.jsx';
import API from '../config/apiConfig.js';
import '../css/BoardPostContent.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function BoardPostContent() {
  const { boardName, boardId, postId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [postData, setPostData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postContentSection = useMemo(() => {
    if (!postData) return null;
    
    return (
      <div className="post-content-main">
        <div className="post-title-section">
          <h1 className="post-title">
            {postData.postIsPinned && (
              <span className="pin-badge">
                <Pin size={14} />
                고정
              </span>
            )}
            {postData.postTitle}
          </h1>
          <div className="post-meta">
            <div className="meta-item">
              <User size={18} />
              <span>{postData.postAnonymous != null ? postData.postAnonymous : postData.postAuthor}</span>
            </div>
            <div className="meta-item">
              <Calendar size={18} />
              <span>{formatDate(postData.createdAt)}</span>
            </div>
            <div className="meta-item">
              <Eye size={18} />
              <span>조회 {postData.postViewCount}</span>
            </div>
          </div>
        </div>
  
        <div 
          className="post-body"
          dangerouslySetInnerHTML={{ __html: postData.postContent }}
        />
      </div>
    );
  }, [postData]);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 6;
  // fetchComments 함수 수정
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${API.API_BASE_URL}/board/postcontent/call`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callingContentBoardId: boardId,
          calliingContentPostId: postId,
        })
      });
  
      if (!response.ok) {
        addToast('댓글 목록을 불러올 수 없습니다.', 'error');
        return [];
      }
  
      const result = await response.json();
  
      if (result.boardPostContentStatus) {
        const newComments = result.boardPostComment 
          ? (Array.isArray(result.boardPostComment) 
              ? result.boardPostComment 
              : [result.boardPostComment])
          : [];
        
        setComments(newComments);
        return newComments; // 새 댓글 배열 반환
      }
      return [];
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      return [];
    }
  }, [boardId, postId, addToast]);

  useEffect(() => {
    const boardPostContentCalling = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API.API_BASE_URL}/board/postcontent/call`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callingContentBoardId: boardId,
            calliingContentPostId: postId,
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

        if(result.boardPostContentStatus){
          setPostData(result.boardPostContentData);
          // 댓글 데이터 설정
          if(result.boardPostComment) {
            setComments(Array.isArray(result.boardPostComment) 
              ? result.boardPostComment 
              : [result.boardPostComment]);
          }
        } else {
          const toastData = {
            status: 'error',
            message: result.boardPostContentMessage
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
          return;
        }

      } catch (error) {
        const toastData = {
          status: 'error',
          message: "게시글 조회 에러"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    boardPostContentCalling();
  }, [boardId, postId, navigate]);

  // 페이지네이션 계산
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // 댓글 섹션으로 스크롤
    document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEdit = async () => {

    const response = await fetch(`${API.API_BASE_URL}/board/postcontent/authorcheck`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callingContentBoardId: boardId,
        calliingContentPostId: postId,
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

    if(result.AuthorChecker) {
      navigate(`/boardEdit/${boardId}/${postId}`);
    } else {
      addToast(result.AuthorCheckerMessage, "warning");
      return;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API.API_BASE_URL}/board/post/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callingContentBoardId: boardId,
          calliingContentPostId: postId,
        })
      });

      if (!response.ok) {
        addToast('서버 통신 오류', 'error');
        return;
      }

      const result = await response.json();
      
      if (result.deletePostStatus) {
        addToast(result.deletePostMessage, 'success');
        navigate(`/board`);
      } else {
        addToast(result.deletePostMessage || '삭제 실패', 'error');
      }
    } catch (error) {
      addToast('게시글 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleBackToList = () => {
    navigate(`/board`);
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      addToast('댓글 내용을 입력해주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API.API_BASE_URL}/board/comment/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentoryBid: boardId,
          commentoryPid: postId,
          commentoryContext: newComment
        })
      });

      if (!response.ok) {
        addToast('서버 통신 오류', 'error');
        return;
      }

      const result = await response.json();
      
      if (result.commentAddStatus) {
        addToast('댓글이 등록되었습니다.', 'success');
        setNewComment('');
        
        const newComments = await fetchComments();
        
        const newTotalPages = Math.ceil(newComments.length / commentsPerPage);
        setCurrentPage(newTotalPages);
      } else {
        addToast(result.commentAddMessage || '댓글 등록 실패', 'error');
      }
    } catch (error) {
      addToast('댓글 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {

    try {
      const response = await fetch(`${API.API_BASE_URL}/board/comment/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentoryBid: boardId,
          commentoryPid: postId,
          commentoryCid: commentId
        })
      });

      if (!response.ok) {
        addToast('서버 통신 오류', 'error');
        return;
      }

      const result = await response.json();
      
      if (result.commentDeleteStatus) {
        addToast(result.commentDeleteMessage, 'success');
        
        // 댓글 목록 다시 불러오기
        await fetchComments();
        
        // 현재 페이지가 비어있으면 이전 페이지로
        const newTotalPages = Math.ceil(comments.length / commentsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        addToast(result.commentDeleteMessage || '댓글 삭제 실패', 'error');
      }
    } catch (error) {
      addToast('댓글 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="board-content-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="board-content-container">
        <div className="loading-spinner">
          <p>게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-content-container">
      <div className="board-content-header">
        <div className="header-left">
          <h2>{boardName}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-delete-post" onClick={handleDelete}>
            <Trash2 size={18} />
            삭제
          </button>
          <button className="btn-edit" onClick={handleEdit}>
            <Edit2 size={18} />
            수정
          </button>
          <button className="btn-list" onClick={handleBackToList}>
            <List size={18} />
            목록으로
          </button>
        </div>
      </div>

      {postContentSection}

      {/* 댓글 섹션 */}
      <div className="comments-section">
        <div className="comments-header">
          <MessageSquare size={22} />
          <h3>댓글 {comments.length}개</h3>
        </div>

        {/* 댓글 작성 폼 */}
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <textarea
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            className="comment-submit-btn"
            disabled={isSubmitting}
          >
            <Send size={18} />
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </button>
        </form>

        {/* 댓글 목록 */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">
              <MessageSquare size={48} />
              <p>첫 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <>
              {currentComments.map((comment) => (
                <div key={comment.boardPostCmId} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author">
                      <User size={16} />
                      <span>{comment.boardCommentor}</span>
                    </div>
                    <div className="comment-actions">
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleCommentDelete(comment.boardPostCmId)}
                        title="댓글 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="comment-content">
                    {comment.boardCommentContext}
                  </div>
                </div>
              ))}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                    이전
                  </button>

                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // 현재 페이지 기준으로 ±2 페이지만 표시
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 3 ||
                        pageNumber === currentPage + 3
                      ) {
                        return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
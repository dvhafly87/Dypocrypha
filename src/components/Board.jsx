import React, { useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {useToast} from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

import API from '../config/apiConfig.js';
import SIC from '../img/sic.jpg';

import '../css/BoardMain.css';

export default function BoardMain() {
  const navigate = useNavigate();
  const [boardList, setBoardList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { isLogined } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [boardPassword, setBoardPassword] = useState('');
  
  // 삭제 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    const boardListCalling = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if(!response.ok){
          const toastData = {
            status: 'warning',
            message: "서버 통신 불가"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
          return;
        }

        const result = await response.json();

        if(result.boardListresult){
          setBoardList(result.boardList);
        } else {
          const toastData = {
            status: 'warning',
            message: "게시판 조회 에러"
          };
          localStorage.setItem('redirectToast', JSON.stringify(toastData));
          navigate('/');
        }
      } catch (error) {
        console.error('게시판 목록 조회 실패:', error);
        addToast("게시판 목록을 불러오는데 실패했습니다", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    boardListCalling();
  }, [navigate, addToast]);

  const addNewBoard = () => {
    if(!isLogined) {
      addToast("로그인이 필요합니다", "warning");
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBoardName('');
    setBoardDescription('');
    setIsPasswordProtected(false);
    setBoardPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch(`${API.API_BASE_URL}/board/newBoard`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addBoardName: boardName,
        addBoardDescription: boardDescription,
        addBoardProtected: isPasswordProtected,
        addBoardPassword: boardPassword
      }) 
    });

    if(!response.ok){
      const toastData = {
        status: 'warning',
        message: "서버 통신 불가"
      };
      localStorage.setItem('redirectToast', JSON.stringify(toastData));
      navigate('/');
    }

    const result = await response.json();

    if(result.boardStatus){
      addToast(result.boardMessage, "success");
      closeModal();
      // 게시판 목록 새로고침
      const listResponse = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const listResult = await listResponse.json();
      if(listResult.boardListresult){
        setBoardList(listResult.boardList);
      }
    } else {
      addToast(result.boardMessage, "warning");
      closeModal();
    }
  };

  // 삭제 모달 열기
  const openDeleteModal = (board, e) => {
    e.stopPropagation(); // 게시판 클릭 이벤트 방지
    if(!isLogined) {
      addToast("로그인이 필요합니다", "warning");
      return;
    }
    setBoardToDelete(board);
    setIsDeleteModalOpen(true);
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBoardToDelete(null);
    setDeletePassword('');
  };

  // 게시판 삭제 처리
  const handleDelete = async (e) => {
    e.preventDefault();
    
    const response = await fetch(`${API.API_BASE_URL}/board/deleteBoard`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deleteBoardId: boardToDelete.boardPriId,
        deleteBoardName: boardToDelete.boardName,
        deleteBoardCreator: boardToDelete.boardCreator,
        deleteBoardProtected: boardToDelete.boardProtected,
        deleteBoardPassword: deletePassword
      }) 
    });

    if(!response.ok){
      const toastData = {
        status: 'warning',
        message: "서버 통신 불가"
      };
      localStorage.setItem('redirectToast', JSON.stringify(toastData));
      navigate('/');
      return;
    }

    const result = await response.json();

    if(result.deleteStatus){
      addToast(result.deleteMessage, "success");
      closeDeleteModal();
      // 게시판 목록 새로고침
      const listResponse = await fetch(`${API.API_BASE_URL}/board/listcalling`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const listResult = await listResponse.json();
      if(listResult.boardListresult){
        setBoardList(listResult.boardList);
      }
    } else {
      // const toastData = {
      //   status: 'warning',
      //   message: result.deleteMessage
      // };
      // localStorage.setItem('redirectToast', JSON.stringify(toastData));
      // navigate('/');
      addToast(result.deleteMessage, "warning");
    }
  };

  return (
    <div className="board-wrapper">
      <div className="board-side-container">
        <div className="sidebar-header">
          <h2>게시판</h2>
        </div>
        <div className="sidebar-actions">
            {isLogined ? <p></p> : <p className="required-login">* 로그인 필요</p>}
            <div className="board-search-container">
              <form className="board-search-form">
                <input type="text" placeholder="게시판 검색" name="search" />
                <button type="submit" className="board-search-button">
                  <img src={SIC} alt="검색" className="search-icon" />
                </button>
              </form>
            </div>
            <button className="sidebar-actions-button" onClick={addNewBoard}>
              + 새 게시판 생성
            </button>
        </div>
        
        <div className="sidebar-boardList">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">게시판 목록을 불러오는 중...</p>
            </div>
          ) : boardList.length > 0 ? (
            boardList.map((board) => (
              <div 
                key={board.boardPriId} 
                className="board-list-item"
                onClick={() => navigate(`/board/${board.boardPriId}`)}
              >
                <div className="board-list-content">
                  <div className="board-list-header">
                    <div className="board-title-wrapper">
                      {board.boardProtected && (
                        <span className="lock-icon">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </span>
                      )}
                      <span className="board-name">{board.boardName}</span>
                    </div>
                    {isLogined && board.boardPriId !== 1 && board.boardName !== '자유게시판' && (
                      <button 
                        className="delete-board-button"
                        onClick={(e) => openDeleteModal(board, e)}
                        title="게시판 삭제"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                  {board.boardDescription && (
                    <span className="board-description">{board.boardDescription}</span>
                  )}
                  <span className="board-meta">
                    by {board.boardCreator}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-board-container">
              <div className="no-board-icon">📋</div>
              <p className="no-board-message">
                등록된 게시판이 없습니다
              </p>
              <p className="no-board-submessage">
                새 게시판을 생성해 보세요!
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="board-main-container">
        <div className="board-main-placeholder">
          <h3>게시판을 선택해주세요</h3>
          <p>왼쪽 사이드바에서 게시판을 선택하거나 새로운 게시판을 생성하세요.</p>
        </div>
      </div>

      {/* 생성 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>새 게시판 생성</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="boardName">게시판 이름 *</label>
                  <input
                    type="text"
                    id="boardName"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="게시판 이름을 입력하세요"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boardDescription">게시판 설명</label>
                  <textarea
                    id="boardDescription"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    placeholder="게시판 설명을 입력하세요 (선택사항)"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="isPasswordProtected"
                      checked={isPasswordProtected}
                      onChange={(e) => {
                        setIsPasswordProtected(e.target.checked);
                        if (!e.target.checked) {
                          setBoardPassword('');
                        }
                      }}
                    />
                    <label htmlFor="isPasswordProtected" className="checkbox-label">
                      비밀번호 보호 사용
                    </label>
                  </div>
                </div>
                {isPasswordProtected && (
                  <div className="form-group password-input-group">
                    <label htmlFor="boardPassword">게시판 비밀번호 *</label>
                    <input
                      type="password"
                      id="boardPassword"
                      value={boardPassword}
                      onChange={(e) => setBoardPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-modal-header">
              <h2>게시판 삭제</h2>
              <button className="modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <form onSubmit={handleDelete}>
              <div className="modal-body">
                {boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판' ? (
                  <div className="delete-warning delete-disabled">
                    <div className="warning-icon">🚫</div>
                    <p className="warning-message">
                      "<strong>{boardToDelete?.boardName}</strong>" 게시판은 기본 게시판으로 삭제할 수 없습니다.
                    </p>
                    <p className="warning-submessage">
                      이 게시판은 시스템에서 보호되는 게시판입니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="delete-warning">
                      <div className="warning-icon">⚠️</div>
                      <p className="warning-message">
                        정말로 "<strong>{boardToDelete?.boardName}</strong>" 게시판을 삭제하시겠습니까?
                      </p>
                      <p className="warning-submessage">
                        이 작업은 되돌릴 수 없으며, 게시판의 모든 게시글이 함께 삭제됩니다.
                      </p>
                    </div>
                    {boardToDelete?.boardProtected && (
                      <div className="form-group">
                        <label htmlFor="deletePassword">게시판 비밀번호 *</label>
                        <input
                          type="password"
                          id="deletePassword"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="비밀번호를 입력하세요"
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeDeleteModal}>
                  {boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판' ? '확인' : '취소'}
                </button>
                {!(boardToDelete?.boardPriId === 1 || boardToDelete?.boardName === '자유게시판') && (
                  <button type="submit" className="btn-delete">
                    삭제하기
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
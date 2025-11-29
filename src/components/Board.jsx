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
                    {board.boardProtected && <span className="lock-icon">🔒</span>}
                    <span className="board-name">{board.boardName}</span>
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

      {/* 모달 */}
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
    </div>
  );
}
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {useToast} from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

import API from '../config/apiConfig.js';
import SIC from '../img/sic.jpg';

import '../css/BoardMain.css';

export default function BoardMain() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isLogined } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [boardPassword, setBoardPassword] = useState('');

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

    } else {
      addToast(result.boardMessage, "warning");
    }
    
    closeModal();
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
            게시판 리스트 영역
        </div>
      </div>
      <div className="board-main-container">
          asdfdsaf
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
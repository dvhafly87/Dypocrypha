import React, { useState } from 'react';
import '../css/BoardMain.css';
import SIC from '../img/sic.jpg';

import { useAuth } from '../context/AuthContext.jsx';

export default function BoardMain() {
  const { isLogined } = useAuth();

  return (
    <div className="board-wrapper">
      <div className="board-side-container">
        <div className="sidebar-header">
          <h2>게시판</h2>
        </div>
        <div className="sidebar-actions">
            <div className="board-search-container">
              <form className="board-search-form">
                <input type="text" placeholder="게시판 검색" name="search" />
                <button type="submit" className="board-search-button">
                  <img src={SIC} alt="검색" className="search-icon" />
                </button>
              </form>
            </div>
            {isLogined ? <p></p> : <p className="required-login">* 로그인 필요</p>}
            <button className="sidebar-actions-button">
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
    </div>
  );
}
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import ProfileContainer from '../components/ProfileContainer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import '../css/Header.css';

import DOGE from '../../public/A3.svg';
import SIC from '../img/sic.jpg';

export default function Header() {
  const { isLogined } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ESC 키로 사이드바 닫기
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // 컴포넌트 마운트 시 이벤트 리스너 등록
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <>
      <header className="main-header">
        {/* 햄버거 메뉴 (모바일만) */}
        <button 
          className="hamburger-btn" 
          onClick={toggleSidebar}
          aria-label="메뉴 열기"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="brand-box">
          <img src={DOGE} alt="임시 이미지" />
          <Link to="/">Dypocrypha</Link>
        </div>
        
        {/* 데스크톱 검색창 */}
        <form className="search-box desktop-search">
          <input type="text" placeholder="키워드 입력" name="search" />
          <button type="submit" className="search-btn">
            <img src={SIC} alt="검색" className="search-icon" />
          </button>
        </form>
        {isLogined ? <ProfileContainer /> : <Link className="move-agreeAndlogin" to="/login">로그인</Link>}
      </header>
      <nav className="sub-nav" style={{ top: isLogined ? '111px' : '90px' }}>
        <Link to="/">홈</Link>
        <Link to="/test">게시판</Link>
        <Link to="/test2">프로젝트</Link>
        <Link to="/test3">아카이브</Link>
        <Link to="/test4">AI</Link>
      </nav>

      {/* 사이드바 오버레이 */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* 모바일 사이드바 */}
      <aside className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>메뉴</h2>
          <button 
            className="close-btn" 
            onClick={toggleSidebar}
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        {/* 사이드바 검색창 */}
        <form className="search-box mobile-search">
          <input type="text" placeholder="키워드 입력" name="search" />
          <button type="submit" className="search-btn">
            <img src={SIC} alt="검색" className="search-icon" />
          </button>
        </form>

        {/* 추가 메뉴 항목들 */}
        <nav className="sidebar-nav">
          <Link to="/" onClick={toggleSidebar}>홈</Link>
          <Link to="/test" onClick={toggleSidebar}>게시판</Link>
          <Link to="/test2" onClick={toggleSidebar}>프로젝트</Link>
          <Link to="/test3" onClick={toggleSidebar}>아카이브</Link>
          <Link to="/test4" onClick={toggleSidebar}>AI</Link>
        </nav>
      </aside>
    </>
  );
} 
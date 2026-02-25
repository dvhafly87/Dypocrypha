import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import ProfileContainer from '../components/ProfileContainer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

import '../css/Header.css';

import DOGE from '../../public/A3.svg';
import SIC from '../img/sic.jpg';

export default function Header() {
  const { isLogined } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchAllKey, setSearchAllKey] = useState('');
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);

  const isRecorded = useRef(false);

  useEffect(() => {
    if (isRecorded.current) return; 

    const fetchVisitorStats = async () => {
      try {
        const response = await fetch('/main/visitor/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setTodayVisitors(data.todayCount);
          isRecorded.current = true; 
        }
      } catch (error) {
        console.error("방문자 데이터를 가져오는데 실패했습니다:", error);
      }
    };

    fetchVisitorStats();
  }, []);
  const handleSearchKey = (e) => {
    e.preventDefault();

    if (!searchAllKey.trim()) {
      addToast("검색어를 입력해주세요", "error");
      return;
    }

    if (searchAllKey.length > 50) {
      addToast("검색어는 50자 제한입니다.", "warning");
      return;
    }

    if (searchAllKey.length < 2) {
      addToast("최소 2자 이상의 검색어를 입력해주세요", "warning");
      return;
    }

    navigate(`/all/search/${encodeURIComponent(searchAllKey)}`);
    closeSidebar();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchAllKey(value.slice(0, 50));
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  // 사이드바 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // const topValue = windowWidth <= 900
  //   ? (isLogined ? '97px' : '97px')
  //   : (isLogined ? '111px' : '');

  return (
    <>
      <header className="main-header">
        {/* 햄버거 메뉴 (모바일만) */}
        <button
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="메뉴 열기"
          aria-expanded={isSidebarOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="brand-box">
          <img src={DOGE} alt="로고" />
          <Link to="/">Dypocrypha</Link>
          <div className="visitor-badge">
            <span className="visitor-total">{totalVisitors}</span> {/* 방문자수 카운트 빨간색 */}
            <span className="visitor-online">•{onlineUsers}</span> {/* 접속자수 카운트 초록색 */}
          </div>
        </div>

        {/* 데스크톱 검색창 */}
        <form className="search-box desktop-search" onSubmit={handleSearchKey}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="키워드 입력"
              name="search"
              autoComplete="off"
              value={searchAllKey}
              onChange={handleSearchChange}
              maxLength={50}
            />
            <span
              className={`char-counter ${searchAllKey.length >= 45 ? 'warning' : ''
                }`}
            >
              {searchAllKey.length}/50
            </span>
          </div>

          <button type="submit" className="search-btn">
            <img src={SIC} alt="검색" className="search-icon" />
          </button>
        </form>

        {/* 데스크톱 로그인/프로필 (모바일에서 CSS로 숨김) */}
        {isLogined ? <ProfileContainer /> : <Link className="move-agreeAndlogin" to="/login">로그인</Link>}
      </header>

      {/* <nav className="sub-nav" style={{ top: topValue }}> */}
      <nav className="sub-nav">
        <Link to="/">홈</Link>
        <Link to="/board">게시판</Link>
        <Link to="/project">프로젝트</Link>
        <Link to="/archive">아카이브</Link>
      </nav>

      {/* 사이드바 오버레이 - 항상 렌더링하되 클래스로 제어 */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
      ></div>

      {/* 모바일 사이드바 - 항상 렌더링하되 클래스로 제어 */}
      <aside
        className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="sidebar-header">

        </div>

        {/* 모바일 로그인/프로필 영역 */}
        <div className="sidebar-auth-section">
          {isLogined ? (
            <ProfileContainer />
          ) : (
            <Link
              className="move-agreeAndlogin sidebar-login"
              to="/login"
              onClick={closeSidebar}
            >
              로그인
            </Link>
          )}
        </div>

        {/* 사이드바 검색창 */}
        <form className="search-box mobile-search" onSubmit={handleSearchKey}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="키워드 입력"
              name="search"
              autoComplete="off"
              value={searchAllKey}
              onChange={handleSearchChange}
              maxLength={50}
            />
            <span
              className={`char-counter ${searchAllKey.length >= 45 ? 'warning' : ''
                }`}
            >
              {searchAllKey.length}/50
            </span>
          </div>

          <button type="submit" className="search-btn">
            <img src={SIC} alt="검색" className="search-icon" />
          </button>
        </form>

        {/* 메뉴 항목들 */}
        <nav className="sidebar-nav">
          <Link to="/" onClick={closeSidebar}>홈</Link>
          <Link to="/board" onClick={closeSidebar}>게시판</Link>
          <Link to="/project" onClick={closeSidebar}>프로젝트</Link>
          <Link to="/archive" onClick={closeSidebar}>아카이브</Link>
        </nav>
      </aside>
    </>
  );
}
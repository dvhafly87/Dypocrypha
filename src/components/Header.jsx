import { Link, NavLink, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

import ProfileContainer from '../components/ProfileContainer.jsx';
import ThemeSettings from './ThemeSettings.jsx';

import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

import '../css/Header.css';

import DOGE from '../../public/icon.png';
import SIC from '../img/sic.jpg';

export default function Header() {
  const { isLogined } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const loginOrigin = location.pathname + location.search + location.hash;
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
        const response = await fetch(`${API.API_BASE_URL}/main/visitor/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setTotalVisitors(data.todayCount);
          isRecorded.current = true;
        }
      } catch (error) {
        console.error("방문자 데이터를 가져오는데 실패했습니다:", error);
      }
    };

    fetchVisitorStats();
  }, []);

  const onlineUsersRef = useRef(0);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  const clientRef = useRef(null);

  useEffect(() => {
    if (clientRef.current) return; // 이미 연결되면 무시

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API.API_BASE_URL}/ws`),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      // console.log('STOMP CONNECTED'); // 이게 찍히는지 먼저 확인
      const subscription = client.subscribe('/topic/online-users', (message) => {
        // console.log("메시지 도착:", message.body);
        const data = JSON.parse(message.body);
        setOnlineUsers(data.count);
      });

      client.publish({
        destination: '/app/request-count'
      });

      // console.log("구독 시작됨:", subscription.id);
    };

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
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
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width > 600) setIsSidebarOpen(false);
    };
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

  // Restore the previous body style when closing, resizing or unmounting.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
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

  const displayVisitorCount = count => windowWidth <= 600 && count >= 10000
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count)
    : count;
  const visitorLabel = `오늘 방문자 ${totalVisitors}명, 현재 접속 ${onlineUsers}명`;
  const visitorBadge = <div className="visitor-badge" role="group" aria-label={visitorLabel} title={visitorLabel}>
    <span className="visitor-total">{displayVisitorCount(totalVisitors)}</span>
    <span className="visitor-online">•{displayVisitorCount(onlineUsers)}</span>
  </div>;

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
          <Link className="brand-home" to="/" aria-label="Dypocrypha 홈">
            <img src={DOGE} alt="" />
            <span>Dypocrypha</span>
          </Link>
          {windowWidth > 600 && visitorBadge}
        </div>
        {windowWidth <= 600 && visitorBadge}

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
        {isLogined ? <ProfileContainer /> : <Link className="move-agreeAndlogin" to="/login" state={{ from: loginOrigin }}>로그인</Link>}
      </header>

      {/* <nav className="sub-nav" style={{ top: topValue }}> */}
      <nav className="sub-nav">
        <NavLink to="/" end>홈</NavLink>
        <NavLink to="/boards">게시판</NavLink>
        <NavLink to="/projects">프로젝트</NavLink>
        <NavLink to="/archives">아카이브</NavLink>
      </nav>

      {/* 사이드바 오버레이 - 항상 렌더링하되 클래스로 제어 */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
        inert={!isSidebarOpen ? '' : undefined}
      ></div>

      {/* 모바일 사이드바 - 항상 렌더링하되 클래스로 제어 */}
      <aside
        className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-hidden={!isSidebarOpen}
        inert={!isSidebarOpen ? '' : undefined}
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
              to="/login" state={{ from: loginOrigin }}
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
          <NavLink to="/" end onClick={closeSidebar}>홈</NavLink>
          <NavLink to="/boards" onClick={closeSidebar}>게시판</NavLink>
          <NavLink to="/projects" onClick={closeSidebar}>프로젝트</NavLink>
          <NavLink to="/archives" onClick={closeSidebar}>아카이브</NavLink>
        </nav>
        {windowWidth <= 600 && isSidebarOpen && <ThemeSettings placement="sidebar" onCloseSidebar={closeSidebar} />}
      </aside>
      {windowWidth > 600 && <ThemeSettings />}
    </>
  );
}
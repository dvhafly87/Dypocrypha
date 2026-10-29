import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../ToolBar/PlayerProvider.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

import '../../css/QuickToolbar.css';

export default function QuickToolbar() {
  const { isLogined } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const toolbarRef = useRef(null);

  const {
    allMp3s, playlist, currentTrack, isPlaying, isLoading,
    currentTime, duration, play, toggle, next, prev, seek,
    addToPlaylist, removeFromPlaylist, isInPlaylist,
  } = usePlayer();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (panel) => {
    if (activePanel === panel) { setActivePanel(null); }
    else { setActivePanel(panel); setIsMenuOpen(false); }
  };

  const handleFabClick = () => {
    if (activePanel) { setActivePanel(null); }
    else { setIsMenuOpen(prev => !prev); }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    seek((e.clientX - rect.left) / rect.width * duration);
  };

  if (!isLogined) return null;

  return (
    <div className="qt-root" ref={toolbarRef}>

      {/* 3단: 플레이어 패널 (2컬럼) */}
      <div className={`qt-panel ${activePanel === 'player' ? 'open' : ''}`}>
        <div className="qt-panel-header">
          <span className="qt-panel-title">음악 플레이어</span>
          <button className="qt-panel-close" onClick={() => setActivePanel(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="qt-panel-body">

          {/* 왼쪽: 재생기 + 내 플레이리스트 */}
          <div className="qt-left">
            <div className="qt-now-playing">
              <div className="qt-thumb">
                {currentTrack?.thumbnailUrl
                  ? <img src={currentTrack.thumbnailUrl} alt={currentTrack.title} />
                  : <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                }
                {isPlaying && (
                  <div className="qt-playing-overlay">
                    <div className="qt-bars"><span /><span /><span /></div>
                  </div>
                )}
              </div>
              <div className="qt-track-info">
                <div className="qt-track-title">{currentTrack?.title ?? '곡을 선택해주세요'}</div>
                <div className="qt-track-sub">{currentTrack?.archiveName ?? '아카이브'}</div>
              </div>
            </div>

            <div className="qt-progress-wrap">
              <div className="qt-progress-bar" onClick={handleSeek}>
                <div className="qt-progress-fill" style={{ width: `${progressPercent}%` }}>
                  <div className="qt-progress-thumb" />
                </div>
              </div>
              <div className="qt-progress-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="qt-controls">
              <button className="qt-ctrl-btn" onClick={prev} disabled={!currentTrack}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
              </button>
              <button className="qt-ctrl-btn play" onClick={toggle} disabled={!currentTrack}>
                {isLoading
                  ? <div className="qt-spinner" />
                  : isPlaying
                    ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                }
              </button>
              <button className="qt-ctrl-btn" onClick={next} disabled={!currentTrack}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 5.14 3.64L8 13.14V9.86zM16 6v12h2V6h-2z" /></svg>
              </button>
            </div>

            <div className="qt-mylist-header">
              <span className="qt-mylist-title">내 플레이리스트</span>
              <span className="qt-mylist-count">{playlist.length}</span>
            </div>
            <div className="qt-mylist">
              {playlist.length === 0 && (
                <div className="qt-empty">오른쪽에서 곡을 추가해보세요</div>
              )}
              {playlist.map((track, idx) => (
                <div
                  key={track.archId ?? idx}
                  className={`qt-pl-item ${currentTrack?.fileUrl === track.fileUrl ? 'active' : ''}`}
                  onClick={() => play(track)}
                >
                  <div className="qt-pl-thumb">
                    {track.thumbnailUrl
                      ? <img src={track.thumbnailUrl} alt={track.title} />
                      : <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    }
                    {currentTrack?.fileUrl === track.fileUrl && isPlaying && (
                      <div className="qt-pl-overlay">
                        <div className="qt-bars sm"><span /><span /><span /></div>
                      </div>
                    )}
                  </div>
                  <div className="qt-pl-info">
                    <div className="qt-pl-name">{track.title}</div>
                    <div className="qt-pl-sub">{track.archiveName}</div>
                  </div>
                  <button
                    className="qt-pl-remove"
                    onClick={(e) => { e.stopPropagation(); removeFromPlaylist(track.archId); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 아카이브 전체 mp3 */}
          <div className="qt-right">
            <div className="qt-right-header">
              <span className="qt-right-title">아카이브 전체 MP3</span>
              <span className="qt-right-count">{allMp3s.length}곡</span>
            </div>
            <div className="qt-alllist">
              {allMp3s.length === 0 && (
                <div className="qt-empty">불러오는 중...</div>
              )}
              {allMp3s.map((track, idx) => (
                <div
                  key={track.archId ?? idx}
                  className={`qt-all-item ${isInPlaylist(track.archId) ? 'in-list' : ''}`}
                >
                  <div className="qt-all-thumb">
                    {track.thumbnailUrl
                      ? <img src={track.thumbnailUrl} alt={track.title} />
                      : <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    }
                  </div>
                  <div className="qt-all-info">
                    <div className="qt-all-name">{track.title}</div>
                    <div className="qt-all-sub">{track.archiveName}</div>
                  </div>
                  <button
                    className={`qt-add-btn ${isInPlaylist(track.archId) ? 'added' : ''}`}
                    onClick={() => isInPlaylist(track.archId)
                      ? removeFromPlaylist(track.archId)
                      : addToPlaylist(track.archId)
                    }
                  >
                    {isInPlaylist(track.archId)
                      ? <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 2단: 기능 목록 메뉴 */}
      <div className={`qt-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="qt-menu-item" onClick={() => handleMenuItemClick('player')}>
          <div className="qt-menu-icon music">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span>음악 플레이어</span>
          {isPlaying && <div className="qt-menu-playing-dot" />}
        </button>
        {/* 추후 기능 추가 자리 */}
      </div>

      {/* 1단: FAB */}
      <button
        className={`qt-fab ${isMenuOpen ? 'menu-open' : ''} ${activePanel ? 'panel-open' : ''} ${isPlaying ? 'playing' : ''}`}
        onClick={handleFabClick}
        aria-label="퀵 메뉴"
      >
        {activePanel || isMenuOpen
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          : <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
        }
        {isPlaying && !isMenuOpen && !activePanel && (
          <div className="qt-fab-pulse" />
        )}
      </button>

    </div>
  );
}
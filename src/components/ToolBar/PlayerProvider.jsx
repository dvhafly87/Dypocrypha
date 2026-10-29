import { createContext, useContext, useRef, useState, useEffect } from 'react';
import API from '../../config/apiConfig.js';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [allMp3s, setAllMp3s] = useState([]);        // 아카이브 전체 mp3
  const [playlist, setPlaylist] = useState([]);       // 내 플레이리스트
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 전체 mp3 목록 (암호화 제외, 인증 불필요)
  const fetchAllMp3s = async () => {
    try {
      const res = await fetch(`${API.API_BASE_URL}/archive/mp3`);
      if (res.ok) {
        const data = await res.json();
        setAllMp3s(data);
      }
    } catch (error) {
      console.error('mp3 목록 조회 실패:', error);
    }
  };

  // 내 플레이리스트 (인증 필요)
  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`${API.API_BASE_URL}/archive/playlist`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      }
    } catch (error) {
      console.error('플레이리스트 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchAllMp3s();
    fetchPlaylist();
  }, []);

  // 플레이리스트 추가
  const addToPlaylist = async (archId) => {
    try {
      const res = await fetch(`${API.API_BASE_URL}/archive/playlist/${archId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) await fetchPlaylist();
    } catch (error) {
      console.error('플레이리스트 추가 실패:', error);
    }
  };

  // 플레이리스트 제거
  const removeFromPlaylist = async (archId) => {
    try {
      const res = await fetch(`${API.API_BASE_URL}/archive/playlist/${archId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        // 현재 재생 중인 곡이 제거되면 정지
        if (currentTrack?.archId === archId) {
          audioRef.current.pause();
          setIsPlaying(false);
          setCurrentTrack(null);
        }
        await fetchPlaylist();
      }
    } catch (error) {
      console.error('플레이리스트 제거 실패:', error);
    }
  };

  const isInPlaylist = (archId) => playlist.some(t => t.archId === archId);

  // 오디오 이벤트
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => { setDuration(audio.duration); setIsLoading(false); };
    const onEnded = () => next();
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const play = (track) => {
    const audio = audioRef.current;
    if (currentTrack?.fileUrl === track.fileUrl) {
      audio.play();
    } else {
      audio.src = track.fileUrl;
      audio.play();
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(0);
    }
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggle = () => {
    if (isPlaying) pause();
    else if (currentTrack) { audioRef.current.play(); setIsPlaying(true); }
  };

  const next = () => {
    if (!playlist.length || !currentTrack) return;
    const idx = playlist.findIndex(t => t.fileUrl === currentTrack.fileUrl);
    if (idx < playlist.length - 1) play(playlist[idx + 1]);
  };

  const prev = () => {
    if (!playlist.length || !currentTrack) return;
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    const idx = playlist.findIndex(t => t.fileUrl === currentTrack.fileUrl);
    if (idx > 0) play(playlist[idx - 1]);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <PlayerContext.Provider value={{
      allMp3s,
      playlist,
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      play,
      pause,
      toggle,
      next,
      prev,
      seek,
      addToPlaylist,
      removeFromPlaylist,
      isInPlaylist,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
export default PlayerProvider;
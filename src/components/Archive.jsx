import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastContext';
import API from '../config/apiConfig.js';
import '../css/Archive.css';

export default function Archive() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isLogined, loginSuccess } = useAuth();

    // ----------------------------------------------------------------
    // State & Refs
    // ----------------------------------------------------------------
    const [files, setFiles] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [initialized, setInitialized] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [availableExtensions, setAvailableExtensions] = useState(['all']);
    const [searchFileKey, setSearchFileKey] = useState('');

    const fileInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const observerRef = useRef(null);
    const containerRef = useRef(null);
    const isLoadingRef = useRef(false);
    const pageRef = useRef(0);

    // ----------------------------------------------------------------
    // 데이터 로드
    // ----------------------------------------------------------------
    const loadFiles = async (pageNum) => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        try {
            const response = await fetch(
                `${API.API_BASE_URL}/archive/getAllFileInfo?page=${pageNum}&size=16`,
                { method: 'POST' }
            );
            const result = await response.json();

            setFiles(prev => pageNum === 0 ? result.files : [...prev, ...result.files]);
            setHasMore(!result.last);

            if (pageNum === 0) setInitialized(true);
        } catch {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '서버 통신 불가' }));
            navigate('/');
        } finally {
            isLoadingRef.current = false;
        }
    };

    const loadMore = () => {
        if (!hasMore || isLoadingRef.current) return;
        pageRef.current += 1;
        loadFiles(pageRef.current);
    };

    const somthing = () => {
    
    }

    // 초기 로드
    useEffect(() => {
        loadFiles(0);
    }, []);

    // 무한 스크롤 Observer (초기 로드 완료 후 등록)
    useEffect(() => {
        if (!initialized) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
                    loadMore();
                }
            },
            { root: containerRef.current, threshold: 0.1, rootMargin: '100px' }
        );

        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [hasMore, initialized]);

    // ----------------------------------------------------------------
    // 리다이렉트 토스트 처리
    // ----------------------------------------------------------------
    useEffect(() => {
        const stored = localStorage.getItem('redirectToast');
        if (!stored) return;
        try {
            const { message, status } = JSON.parse(stored);
            addToast(message, status);
        } catch {
            // 파싱 실패 시 무시
        } finally {
            localStorage.removeItem('redirectToast');
        }
    }, [addToast]);

    // ----------------------------------------------------------------
    // 파일 업로드
    // ----------------------------------------------------------------
    const handleUpload = () => {
        if (!isLogined || !loginSuccess) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: '로그인이 필요한 서비스입니다' }));
            navigate('/login');
            return;
        }
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const forbiddenExtensions = [
            '.jsp', '.php', '.asp', '.aspx',
            '.exe', '.sh', '.bat', '.cmd',
            '.js', '.html', '.htm',
            '.dll', '.so', '.py', '.jar',
        ];

        const lastDot = file.name.lastIndexOf('.');
        const ext = lastDot !== -1 ? file.name.substring(lastDot).toLowerCase() : '';

        if (forbiddenExtensions.includes(ext)) {
            addToast(`[${ext}] 파일은 업로드할 수 없습니다.`, 'error');
            e.target.value = '';
            return;
        }

        navigate('/archive/upload', { state: { file } });
    };

    // ----------------------------------------------------------------
    // 확장자 필터
    // ----------------------------------------------------------------
    useEffect(() => {
        const extensions = new Set(['all']);
        files.forEach(file => { if (file.fileExtension) extensions.add(file.fileExtension); });
        setAvailableExtensions(Array.from(extensions));
    }, [files]);

    // 드롭다운 외부 클릭 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterSelect = (extension) => {
        setSelectedFilter(extension);
        setIsFilterOpen(false);
    };

    const getExtensionLabel = (ext) => {
        const labels = {
            all: '전체', pdf: 'PDF', jpg: 'JPG', jpeg: 'JPEG',
            png: 'PNG', gif: 'GIF', mp4: 'MP4', avi: 'AVI',
            mov: 'MOV', mp3: 'MP3', wav: 'WAV', docx: 'DOCX', txt: 'TXT',
        };
        return labels[ext.replace('.', '').toLowerCase()] || ext.toUpperCase();
    };

    // 변경
    const filteredFiles = files.filter(file => {
        const matchesExtension = selectedFilter === 'all' || file.fileExtension === selectedFilter;

        const keyword = searchFileKey.toLowerCase().trim();
        const matchesSearch = !keyword || (
            file.fileName?.toLowerCase().includes(keyword) ||
            file.uploader?.toLowerCase().includes(keyword) ||
            file.fileExtension?.toLowerCase().includes(keyword)
        );

        return matchesExtension && matchesSearch;
    });

    // ----------------------------------------------------------------
    // 파일 아이콘 SVG
    // ----------------------------------------------------------------
    const getFileIcon = (ext) => {
        const e = ext?.toLowerCase();
        const base = (children) => (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                {children}
            </svg>
        );

        if (e === '.pdf') return base(<>
            <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3z" />
            <path d="M14 13h1a2 2 0 0 1 0 4h-1v-4z" />
        </>);

        if (['.doc', '.docx'].includes(e)) return base(<>
            <line x1="8" y1="9" x2="10" y2="9" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
        </>);

        if (['.xls', '.xlsx'].includes(e)) return base(<>
            <rect x="8" y="12" width="8" height="6" rx="0.5" />
            <line x1="8" y1="15" x2="16" y2="15" />
            <line x1="12" y1="12" x2="12" y2="18" />
        </>);

        if (['.zip', '.rar', '.7z'].includes(e)) return base(<>
            <line x1="12" y1="10" x2="12" y2="10" />
            <line x1="12" y1="12" x2="12" y2="12" />
            <line x1="12" y1="14" x2="12" y2="14" />
            <rect x="10" y="15" width="4" height="4" rx="0.5" />
        </>);

        if (['.txt', '.md'].includes(e)) return base(<>
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
        </>);

        if (['.mp3', '.wav', '.flac'].includes(e)) return (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        );

        if (['.mp4', '.avi', '.mov'].includes(e)) return (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10 9 16 12 10 15 10 9" />
            </svg>
        );

        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(e)) return (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );

        // 기본 아이콘
        return base(null);
    };

    const LockIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
    );

    const isImageExt = (ext) => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isVideoExt = (ext) => ['.mp4', '.avi', '.mov'].includes(ext);

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------
    return (
        <div className="archive-main-container">
            {/* 헤더 */}
            <div className="archive-header">
                <span className="archive-header-title">
                    <p className="archive-main-title">Dypocrypha</p>
                    <p className="archive-sub-title">아카이브</p>
                </span>
                <div className="file-search-form">
                    <input
                        placeholder='업로드 파일 검색 ...'
                        autoComplete='off'
                        value={searchFileKey}
                        onChange={(e) => setSearchFileKey(e.target.value)}
                    />
                </div>

                <div className="archive-header-actives-wrapper">
                    {/* 확장자 필터 드롭다운 */}
                    <div className="extension-filter-dropdown" ref={dropdownRef}>
                        <button className="filter-dropdown-btn" onClick={() => setIsFilterOpen(prev => !prev)}>
                            <span>확장자별 정렬: {getExtensionLabel(selectedFilter)}</span>
                            <span className={`dropdown-arrow ${isFilterOpen ? 'open' : ''}`}>▼</span>
                        </button>
                        {isFilterOpen && (
                            <div className="filter-dropdown-menu">
                                {availableExtensions.map(ext => (
                                    <button
                                        key={ext}
                                        className={`filter-dropdown-item ${selectedFilter === ext ? 'active' : ''}`}
                                        onClick={() => handleFilterSelect(ext)}
                                    >
                                        {getExtensionLabel(ext)}
                                        {selectedFilter === ext && <span className="check-mark">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 업로드 버튼 (로그인 시에만) */}
                    {isLogined && loginSuccess && (
                        <button className="upload-btn" onClick={handleUpload}>
                            + 업로드
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* 파일 목록 */}
            <div className="archive-uploaded-viewer-container" ref={containerRef}>
                {filteredFiles.length === 0 ? (
                    <div className="archive-empty-state">
                        <span className="archive-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="8" y1="8" x2="16" y2="16" />
                                <line x1="16" y1="8" x2="8" y2="16" />
                            </svg>
                        </span>
                        <p className="archive-empty-text">업로드된 파일이 없습니다</p>
                    </div>
                ) : (
                    <>
                        {filteredFiles.map((file, index) => (
                            <div className="archive-card" key={index}>
                                <div className="archive-card-top">
                                    {/* 좌: 파일명 */}
                                    <div className="archive-card-name" title={file.fileName}>
                                        {file.fileName.length > 15
                                            ? file.fileName.substring(0, 15) + "..."
                                            : file.fileName}
                                    </div>

                                    {/* 우: 암호화 뱃지(있을 때만) + 아이콘/썸네일 */}
                                    <div className="archive-card-right">
                                        {file.isEncrypted && (
                                            <span className="archive-card-lock"><LockIcon /> 암호화</span>
                                        )}
                                        <span className="archive-card-icon">
                                            {!file.isEncrypted && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.fileExtension) ? (
                                                <img src={`${API.API_BASE_URL}/archive/file/${file.fileUuidName}`} className="archive-card-preview-img" alt={file.fileName} />
                                            ) : !file.isEncrypted && ['.mp4', '.avi', '.mov'].includes(file.fileExtension) ? (
                                                <video src={`${API.API_BASE_URL}/archive/file/${file.fileUuidName}`} className="archive-card-preview-video" muted />
                                            ) : (
                                                getFileIcon(file.fileExtension)
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* 메타 */}
                                <div className="archive-card-meta">
                                    <div className="archive-card-meta-top">
                                        <span className="archive-card-ext">{file.fileExtension?.replace('.', '').toUpperCase()}</span>
                                        <span className="archive-card-dl">↓ {file.downloadCnt?.toLocaleString() ?? 0}</span>
                                    </div>
                                    <div className="archive-card-meta-bottom">
                                        <span>{file.uploader}</span>
                                        <span>{new Date(file.uploadTime).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {hasMore && <div ref={observerRef} className="archive-scroll-trigger" />}
                    </>
                )}
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../config/apiConfig.js';
import '../css/UploadFileContent.css';

// ----------------------------------------------------------------
// 공통 파일 아이콘 SVG
// ----------------------------------------------------------------
const getFileIcon = (ext, size = 64) => {
    const e = ext?.toLowerCase();
    const base = (children) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
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
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );

    if (['.mp4', '.avi', '.mov'].includes(e)) return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polygon points="10 9 16 12 10 15 10 9" />
        </svg>
    );

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(e)) return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );

    return base(null);
};

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ----------------------------------------------------------------
// 비밀번호 인증 UI
// ----------------------------------------------------------------
function PasswordAuthSection({ onSuccess }) {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { fileUuid } = useParams();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!password.trim()) {
            addToast('비밀번호를 입력해주세요', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API.API_BASE_URL}/archive/verifypassword`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUuid, password })
            });
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: result.infoMessage }));
                    navigate('/login');
                    return;
                } else if (response.status === 403) {
                    addToast(result.verifyMessage || "비밀번호가 틀립니다");
                    return;
                }
                throw new Error(result.verifyMessage || "서버 통신 불가");
            } else {
                if (result.fileInfo) {
                    onSuccess(result.fileInfo);
                } else {
                    throw new Error(result.verifyMessage || "서버 통신 불가");
                }
            }
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: error.message }));
            navigate('/');
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="file-password-auth-container">
            <div className="file-password-auth-card">
                <span className="file-password-lock-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                    </svg>
                </span>
                <p className="file-password-title">암호화된 파일입니다</p>
                <p className="file-password-desc">이 파일에 접근하려면 비밀번호가 필요합니다</p>
                <div className="file-password-input-wrapper">
                    <input
                        type="password"
                        className="file-password-input"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        className="file-password-submit-btn"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? '확인 중...' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------
// 파일 상세 뷰
// ----------------------------------------------------------------
function FileDetailSection({ fileInfo }) {
    const fileUrl = `${API.API_BASE_URL}/archive/file/${fileInfo.fileUuidName}`;
    const ext = fileInfo.fileExtension?.toLowerCase();

    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isVideo = ['.mp4', '.avi', '.mov'].includes(ext);
    const isAudio = ['.mp3', '.wav', '.flac'].includes(ext);
    const isPdf = ext === '.pdf';

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileInfo.fileMainName + fileInfo.fileExtension;
        a.click();
    };

    return (
        <div className="select-file-viewer-container">
            {/* 좌: 미리보기 */}
            <div className="file-detail-preview-section">
                <div className="file-detail-preview-wrapper">
                    {isImage && (
                        <img src={fileUrl} alt={fileInfo.fileMainName} className="file-detail-preview-img" />
                    )}
                    {isVideo && (
                        <video src={fileUrl} controls className="file-detail-preview-video" />
                    )}
                    {isAudio && (
                        <div className="file-detail-audio-wrapper">
                            <span className="file-detail-preview-icon">{getFileIcon(ext, 72)}</span>
                            <audio src={fileUrl} controls className="file-detail-audio" />
                        </div>
                    )}
                    {isPdf && (
                        <iframe src={fileUrl} className="file-detail-preview-pdf" title={fileInfo.fileMainName} />
                    )}
                    {!isImage && !isVideo && !isAudio && !isPdf && (
                        <span className="file-detail-preview-icon">{getFileIcon(ext, 80)}</span>
                    )}
                </div>
            </div>

            {/* 우: 파일 정보 */}
            <div className="file-detail-info-section">
                <div className="file-detail-info-fields">
                    {/* 파일명 */}
                    <div className="file-detail-name-group">
                        <div className="file-detail-name">
                            {fileInfo.fileMainName}
                            <div className="file-detail-divider" />
                            <span className="file-detail-ext">{fileInfo.fileExtension}</span>
                        </div>
                        <button className="file-detail-delete-icon-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </button>
                    </div>

                    <div className="file-detail-divider" />

                    {/* 업로더 + 날짜 */}
                    <div className="file-detail-meta-group">
                        <div className="file-detail-meta-row">
                            <span className="file-detail-meta-label">업로더</span>
                            <span className="file-detail-meta-value">{fileInfo.uploader}</span>
                        </div>
                        <div className="file-detail-meta-row">
                            <span className="file-detail-meta-label">업로드 일</span>
                            <span className="file-detail-meta-value">
                                {new Date(fileInfo.uploadDate).toLocaleDateString('ko-KR')}
                            </span>
                        </div>
                    </div>

                    <div className="file-detail-divider" />

                    {/* 확장자 + 용량 */}
                    <div className="file-detail-meta-group">
                        <div className="file-detail-meta-row">
                            <span className="file-detail-meta-label">형식</span>
                            <span className="file-detail-ext-badge">
                                {fileInfo.fileExtension?.replace('.', '').toUpperCase()}
                            </span>
                        </div>
                        <div className="file-detail-meta-row">
                            <span className="file-detail-meta-label">크기</span>
                            <span className="file-detail-meta-value">{formatFileSize(fileInfo.fileSize)}</span>
                        </div>
                    </div>

                    <div className="file-detail-divider" />

                    {/* 다운로드 카운트 */}
                    <div className="file-detail-dl-count-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{(fileInfo.downloadCount ?? 0).toLocaleString()}회 다운로드</span>
                    </div>
                </div>

                {/* 다운로드 버튼 */}
                <div className="file-detail-action-area">
                    <button className="file-detail-download-btn" onClick={handleDownload}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------
// 메인 컴포넌트
// ----------------------------------------------------------------
export default function UploadFileContent() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { fileUuid } = useParams();

    const [fileInfo, setFileInfo] = useState(null);
    const [showPassAuth, setShowPassAuth] = useState(false);

    useEffect(() => {
        const getFileUploadInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/archive/getfileinformation`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileUuid })
                });

                const result = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.setItem('redirectToast', JSON.stringify({ status: 'warning', message: result.infoMessage }));
                        navigate('/login');
                        return;
                    }
                    if (response.status === 400) {
                        localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.infoMessage || '유효하지 않은 요청입니다' }));
                        navigate('/archive');
                        return;
                    }
                    throw new Error(result.infoMessage || '서버 통신 불가');
                } else {
                    if (result.fileInfo) {
                        setFileInfo(result.fileInfo);
                    } else {
                        setShowPassAuth(true);
                    }
                }
            } catch (error) {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
                navigate('/');
            }
        };
        getFileUploadInformation();
    }, [fileUuid]);

    const handlePasswordSuccess = (info) => {
        setFileInfo(info);
        setShowPassAuth(false);
    };

    return (
        <div className="file-content-main-container">
            <div className="file-content-header">
                <span className="file-content-header-title">
                    <p className="file-content-main-title">Dypocrypha</p>
                    <p className="file-content-sub-title">파일 상세</p>
                </span>
                <button className="file-content-back-btn" onClick={() => navigate('/archive')}>
                    ← 아카이브로
                </button>
            </div>

            {!fileInfo && showPassAuth && (
                <PasswordAuthSection onSuccess={handlePasswordSuccess} />
            )}
            {fileInfo && (
                <FileDetailSection fileInfo={fileInfo} />
            )}
        </div>
    );
}
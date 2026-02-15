import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastContext';
import React, { useState, useEffect, useRef } from 'react';

import '../css/ArchiveUpload.css';

export default function ArchiveUpload() {
    const location = useLocation();
    const { addToast } = useToast();
    const { isLogined, loginSuccess } = useAuth();
    const navigate = useNavigate();
    const file = location.state?.file;
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(file);
    const [fileName, setFileName] = useState('');
    const [fileExtension, setFileExtension] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);

    // 암호화 옵션 관련 state
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    //자물쇠 svg
    const LockIcon = ({ isLocked }) => (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="lock-icon"
        >
            {isLocked ? (
                // 잠긴 자물쇠
                <>
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </>
            ) : (
                // 열린 자물쇠
                <>
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </>
            )}
        </svg>
    );

    useEffect(() => {
        if (!file || !isLogined || !loginSuccess) {
            const toastData = {
                status: 'warning',
                message: '유효하지 않은 접근입니다'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/archive');
        }
    }, []);

    useEffect(() => {
        if (selectedFile) {
            const fullName = selectedFile.name;
            const lastDotIndex = fullName.lastIndexOf('.');

            if (lastDotIndex !== -1) {
                setFileName(fullName.substring(0, lastDotIndex));
                setFileExtension(fullName.substring(lastDotIndex));
            } else {
                setFileName(fullName);
                setFileExtension('');
            }

            // 미리보기 생성
            if (selectedFile.type.startsWith('image/')) {
                const url = URL.createObjectURL(selectedFile);
                setPreviewUrl(url);
                return () => URL.revokeObjectURL(url);
            } else if (selectedFile.type.startsWith('video/')) {
                const url = URL.createObjectURL(selectedFile);
                setPreviewUrl(url);
                return () => URL.revokeObjectURL(url);
            } else {
                setPreviewUrl(null);
            }
        }
    }, [selectedFile]);

    // 암호화 옵션 토글 시 비밀번호 초기화
    useEffect(() => {
        if (!isEncrypted) {
            setPassword('');
            setConfirmPassword('');
            setPasswordError('');
        }
    }, [isEncrypted]);

    // 비밀번호 검증
    useEffect(() => {
        if (isEncrypted && password && confirmPassword) {
            if (password !== confirmPassword) {
                setPasswordError('비밀번호가 일치하지 않습니다');
            } else if (password.length < 4) {
                setPasswordError('비밀번호는 최소 4자 이상이어야 합니다');
            } else {
                setPasswordError('');
            }
        } else {
            setPasswordError('');
        }
    }, [password, confirmPassword, isEncrypted]);

    const handleFileChange = (e) => {
        const newFile = e.target.files[0];
        if (newFile) {
            setSelectedFile(newFile);
        }
    };

    const handleReselect = () => {
        fileInputRef.current?.click();
    };

    const getFileIcon = () => {
        const ext = fileExtension.toLowerCase();

        if (['.pdf'].includes(ext)) return '📄';
        if (['.doc', '.docx'].includes(ext)) return '📝';
        if (['.xls', '.xlsx'].includes(ext)) return '📊';
        if (['.zip', '.rar', '.7z'].includes(ext)) return '📦';
        if (['.mp3', '.wav', '.flac'].includes(ext)) return '🎵';

        return '📁';
    };

    const handleUpload = async () => {
        // 파일명 검증
        if (!fileName.trim()) {
            addToast('파일명을 입력해주세요', 'warning');
            return;
        }

        // 암호화 옵션 검증
        if (isEncrypted) {
            if (!password || !confirmPassword) {
                addToast('비밀번호를 입력해주세요', 'warning');
                return;
            }
            if (passwordError) {
                addToast(passwordError, 'warning');
                return;
            }
        }

        // 업로드 로직 구현
        const uploadData = {
            file: selectedFile,
            fileName: fileName + fileExtension,
            isEncrypted,
            password: isEncrypted ? password : null
        };

        console.log('Upload data:', uploadData);
        // TODO: 실제 업로드 API 호출

        addToast('파일이 업로드되었습니다', 'success');
        navigate('/archive');
    };

    const isUploadDisabled = !fileName.trim() ||
        (isEncrypted && (!password || !confirmPassword || passwordError));

    return (
        <div className="upload-confirmation-container">
            <div className="upload-confirmation-header">
                <p className="upload-confirmation-header-title">업로드 확인</p>
            </div>
            <div className="upload-confirmation-content">
                <div className="upload-preview-section">
                    <div className="upload-preview-wrapper">
                        {selectedFile?.type.startsWith('image/') ? (
                            <img src={previewUrl} alt="미리보기" className="upload-preview-image" />
                        ) : selectedFile?.type.startsWith('video/') ? (
                            <video src={previewUrl} controls className="upload-preview-video" />
                        ) : (
                            <div className="upload-preview-icon">
                                <span className="file-icon">{getFileIcon()}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={handleReselect} className="reselect-file-button">
                        파일 다시 선택
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="upload-info-section">
                    <div className="upload-info-fields">
                        <div className="file-name-input-group">
                            <label>파일명</label>
                            <div className="file-name-wrapper">
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="file-name-input"
                                    placeholder="파일명을 입력하세요"
                                />
                                <span className="file-extension">{fileExtension}</span>
                            </div>
                        </div>

                        <div className="encryption-section">
                            <div className="encryption-toggle">
                                <label className="encryption-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={isEncrypted}
                                        onChange={(e) => setIsEncrypted(e.target.checked)}
                                        className="encryption-checkbox"
                                    />
                                    <LockIcon isLocked={isEncrypted} />
                                    <span className="encryption-label-text">
                                        암호화 옵션
                                    </span>
                                </label>
                                <span className="encryption-description">
                                    아카이브에서 접근 시 비밀번호가 필요합니다
                                </span>
                            </div>

                            {isEncrypted && (
                                <div className="password-fields">
                                    <div className="password-input-group">
                                        <label>비밀번호</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="password-input"
                                            placeholder="비밀번호를 입력하세요"
                                        />
                                    </div>
                                    <div className="password-input-group">
                                        <label>비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="password-input"
                                            placeholder="비밀번호를 다시 입력하세요"
                                        />
                                    </div>
                                    {passwordError && (
                                        <p className="password-error">{passwordError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="upload-action-area">
                        <button onClick={() => navigate('/archive')} className="cancel-button">
                            취소
                        </button>
                        <button
                            onClick={handleUpload}
                            className="upload-button"
                            disabled={isUploadDisabled}
                        >
                            업로드
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
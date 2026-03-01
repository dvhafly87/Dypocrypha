import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';
import '../../css/MyProfile.css';

const MY_PAGE_INFO = `${API.API_BASE_URL}/member/mypage/projfile/information`;
const UPDATE_NICKNAME = `${API.API_BASE_URL}/member/mypage/nickname/update`;
const UPDATE_PROFILE = `${API.API_BASE_URL}/member/mypage/profile/update`;

function formatBytes(bytes) {
    if (bytes === 0) return '0 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function barClass(ratio) {
    if (ratio >= 0.9) return 'danger';
    if (ratio >= 0.7) return 'warn';
    return '';
}

const IconCamera = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);

const IconInfinity = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
        <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" />
        <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
    </svg>
);

export default function MyProfile() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isLogined, isLoading, logout } = useAuth();
    const fileInputRef = useRef(null);

    const [getInfo, setGetInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editNick, setEditNick] = useState(false);
    const [nickValue, setNickValue] = useState('');
    const [nickError, setNickError] = useState('');
    const [nickSaving, setNickSaving] = useState(false);
    const [imgUploading, setImgUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    useEffect(() => {
        const getMemberInformation = async () => {
            try {
                const response = await fetch(MY_PAGE_INFO, {
                    method: 'POST',
                    credentials: 'include',
                });
                const result = await response.json();
                console.log("응답", result);

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.myPageInfoMessage || '로그인이 필요한 서비스 입니다' }));
                        navigate('/login');
                        return;
                    }
                    throw new Error(result.myPageInfoMessage || '서버 통신 불가');
                }

                if (result.myPageInfo) {
                    const info = result.myPageInfo;
                    setGetInfo({
                        profileImage: info.profileImage,
                        nickname: info.nickname,
                        email: info.email,
                        grade: info.grade,
                        createdAt: info.createdAt,
                        totalFileSize: info.totalFileSize,
                        maxFileSize: info.maxFileSize,
                        totalFileCount: info.totalFileCount
                    });
                    setNickValue(info.nickname);
                }
            } catch (error) {
                addToast('error', error.message);
            } finally {
                setLoading(false);
            }
        };
        getMemberInformation();
    }, []);

    const handleNickSave = async () => {
        if (isSubmitting) {
            console.log("닉 변경 api가 실행중임: 중복 실행 방지");
            return;
        }
        setIsSubmitting(true);
        const trimmed = nickValue.trim();
        if (!trimmed) { setNickError('닉네임을 입력해주세요'); return; }
        if (trimmed.length < 2 || trimmed.length > 20) { setNickError('닉네임은 2~20자 이내로 입력해주세요'); return; }
        if (trimmed === getInfo.nickname) { setEditNick(false); return; }

        setNickSaving(true);
        try {

            const response = await fetch(UPDATE_NICKNAME, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: trimmed }),
            });

            const result = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.changedNickName || '로그인이 필요한 서비스 입니다' }));
                    navigate('/login');
                    return;
                } else if (response.status === 403) {
                    addToast(result.changedNickName, "warning");
                    return;
                }
                throw new Error(result.changedNickName || "서버 통신 불가");
            } else {
                localStorage.setItem('nickname', trimmed);
                addToast("닉네임이 변경되었습니다", "success");
                setGetInfo(prev => ({ ...prev, nickname: trimmed }));
                setNickValue(trimmed);
                setEditNick(false);
            }
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
            navigate('/');
            return;
        } finally {
            setNickSaving(false);
        }
    };

    const handleNickCancel = () => {
        setNickValue(getInfo.nickname);
        setNickError('');
        setEditNick(false);
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            addToast('error', 'JPG, PNG, WEBP 이미지만 업로드 가능합니다');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            addToast('error', '이미지 크기는 5MB 이하여야 합니다');
            return;
        }
        setImgUploading(true);
        const formData = new FormData();
        formData.append('profileImage', file);
        try {
            const response = await fetch(UPDATE_PROFILE, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.profileImgUpdateMessage || '로그인이 필요한 서비스 입니다' }));
                    navigate('/login');
                    return;
                }
                throw new Error(result.profileImgUpdateMessage || "서버 통신 불가");
            } else {
                setGetInfo(prev => ({ ...prev, profileImage: result.profileImageUrl }));
                addToast('프로필 이미지가 변경되었습니다', 'success');
            }
        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
            navigate('/');
            return;
        } finally {
            setImgUploading(false);
            e.target.value = '';
        }
    };

    if (loading) {
        return (
            <div className="profile-root">
                <p className="profile-loading">불러오는 중...</p>
            </div>
        );
    }

    if (!getInfo) {
        return (
            <div className="profile-root">
                <p className="profile-loading">정보를 불러올 수 없습니다.</p>
            </div>
        );
    }

    const isUnlimited = getInfo.maxFileSize === -1;
    const storageRatio = isUnlimited ? 0 : getInfo.totalFileSize / getInfo.maxFileSize;

    return (
        <div className="profile-root">

            {/* 상단: 이미지 + 기본 정보 */}
            <div className="profile-header-block">
                <div className="profile-img-section">

                    <div className="profile-img-wrapper">
                        {getInfo.profileImage
                            ? <img className="profile-img" src={`${API.API_BASE_URL}/member/prof/${getInfo.profileImage}`} alt="프로필" />
                            : <div className="profile-img-placeholder"><IconUser /></div>
                        }
                        <button
                            className="profile-img-edit-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imgUploading}
                            title="프로필 이미지 변경"
                        >
                            <IconCamera />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="profile-img-input"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <div className="profile-header-info">
                    <div className="profile-info-section">
                        <p className="profile-header-nickname">{getInfo.nickname}</p>
                        <p className="profile-header-email">{getInfo.email}</p>
                        <div className={`profile-grade-badge ${getInfo.grade === 'M' ? 'grade-m' : 'grade-n'}`}>
                            <span className="profile-grade-dot" />
                            {getInfo.grade === 'M' ? 'Master' : 'Normal'}
                        </div>
                        <p className="profile-header-joined">
                            {new Date(getInfo.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} 가입
                        </p>
                    </div>
                </div>
            </div>

            <hr className="profile-divider" />

            {/* 필드 */}
            <div className="profile-field-group">

                {/* 닉네임 */}
                <div className="profile-field">
                    <span className="profile-field-label">닉네임</span>
                    {editNick ? (
                        <>
                            <div className="profile-field-editable">
                                <input
                                    className="profile-field-input"
                                    type="text"
                                    value={nickValue}
                                    onChange={e => { setNickValue(e.target.value); setNickError(''); }}
                                    maxLength={20}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleNickSave();
                                        if (e.key === 'Escape') handleNickCancel();
                                    }}
                                />
                                <div className="profile-btn-group">
                                    <button className="profile-btn profile-btn-save" onClick={handleNickSave} disabled={nickSaving}>
                                        {nickSaving ? '저장 중…' : '저장'}
                                    </button>
                                    <button className="profile-btn profile-btn-cancel" onClick={handleNickCancel} disabled={nickSaving}>
                                        취소
                                    </button>
                                </div>
                            </div>
                            {nickError && <p className="profile-field-error">{nickError}</p>}
                        </>
                    ) : (
                        <div className="profile-field-editable">
                            <div className="profile-field-readonly">{getInfo.nickname}</div>
                            <div className="profile-btn-group">
                                <button className="profile-btn profile-btn-edit" onClick={() => setEditNick(true)}>
                                    수정
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* <div className="profile-field">
                    <span className="profile-field-label">가입일</span>
                    <div className="profile-field-readonly">
                        {new Date(getInfo.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div> */}

            </div>

            <hr className="profile-divider" />

            {/* 업로드 용량 */}
            <div className="profile-storage-block">
                <p className="profile-section-label">아카이브 업로드 용량</p>
                {isUnlimited ? (
                    <div className="profile-storage-unlimited">
                        <IconInfinity />
                        무제한 사용 가능
                    </div>
                ) : (
                    <>
                        <div className="profile-storage-row">
                            <span className="profile-storage-used">
                                사용량 &nbsp;<strong>{formatBytes(getInfo.totalFileSize)}</strong>
                            </span>
                            <span className="profile-storage-used">
                                파일 {getInfo.totalFileCount}개 · {formatBytes(getInfo.maxFileSize)}
                            </span>
                            <span className="profile-storage-used">
                                {formatBytes(getInfo.maxFileSize)}
                            </span>
                        </div>
                        <div className="profile-storage-bar-bg">
                            <div
                                className={`profile-storage-bar-fill ${barClass(storageRatio)}`}
                                style={{ width: `${Math.min(storageRatio * 100, 100).toFixed(1)}%` }}
                            />
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
import { useAuth } from '../context/AuthContext.jsx'; //로그인 관리용
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';

import '../css/Archive.css';

export default function Archive() {

    // ------------------------------- 1.페이지 접근 시 토스트 메시지 확인 및 표시 섹션 ------------------------------//
    const { addToast } = useToast(); //토스트 메시지 관리용
    // 페이지 접근시 토스트 메시지 확인 및 표시
    useEffect(() => {
        const storedToastData = localStorage.getItem('redirectToast');
        if (storedToastData) {
            try {
                const toastData = JSON.parse(storedToastData);
                addToast(toastData.message, toastData.status);
                localStorage.removeItem('redirectToast');
            } catch (error) {
                console.error("Failed to parse redirectToast from localStorage:", error);
                localStorage.removeItem('redirectToast');
            }
        }
    }, [addToast]);
    // ------------------------------- 페이지 접근 시 토스트 메시지 확인 및 표시 섹션 끝 ------------------------------//

    // ------------------------------- 2.페이지 state 및 핸들러 정의 섹션 ------------------------------//
    const navigate = useNavigate(); //네비게이션
    const fileInputRef = useRef(null);

    const { isLogined, loginSuccess, logout } = useAuth();

    const [files, setFiles] = useState([]); // 업로드된 파일 목록
    const [selectedFilter, setSelectedFilter] = useState('all'); // 현재 선택된 필터
    const [isFilterOpen, setIsFilterOpen] = useState(false); // 드롭다운 열림/닫힘 상태
    const [availableExtensions, setAvailableExtensions] = useState(['all']); // 사용 가능한 확장자 목록

    const dropdownRef = useRef(null);
    // ------------------------------- 페이지 state 및 핸들러 정의 섹션 끝 ------------------------------//

    //-------------------------------- 3.파일 업로드 핸들러 섹션 ------------------------------//
    const handleUpload = () => {

        // 비 로그인 스테이터스 확인 처리
        if (!isLogined || !loginSuccess) {
            const toastData = {
                status: 'warning',
                message: "로그인이 필요한 서비스입니다"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/login');
            return;
        }

        // 파일 선택 input 창 열기
        fileInputRef.current.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        navigate('/archive/upload', {
            state: { file }
        });
    };
    //-------------------------------- 파일 업로드 핸들러 섹션 끝 ------------------------------//




    // 파일 목록이 변경될 때마다 확장자 추출
    useEffect(() => {
        if (files.length === 0) {
            setAvailableExtensions(['all']);
            return;
        }

        const extensions = new Set(['all']);
        files.forEach(file => {
            if (file.extension) {
                extensions.add(file.extension);
            }
        });
        setAvailableExtensions(Array.from(extensions));
    }, [files]);

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 필터링된 파일 목록
    const filteredFiles = selectedFilter === 'all'
        ? files
        : files.filter(file => file.extension === selectedFilter);

    // 확장자 필터 선택 핸들러
    const handleFilterSelect = (extension) => {
        setSelectedFilter(extension);
        setIsFilterOpen(false);
    };

    // 확장자명 표시 변환
    const getExtensionLabel = (ext) => {
        const labels = {
            'all': '전체',
            'pdf': 'PDF',
            'jpg': 'JPG',
            'jpeg': 'JPEG',
            'png': 'PNG',
            'gif': 'GIF',
            'mp4': 'MP4',
            'avi': 'AVI',
            'mov': 'MOV',
            'mp3': 'MP3',
            'wav': 'WAV',
            'docx': 'DOCX',
            'txt': 'TXT'
        };
        return labels[ext.toLowerCase()] || ext.toUpperCase();
    };

    return (
        <div className="archive-main-container">
            <div className="archive-header">
                <span className="archive-header-title">
                    <p className="archive-main-title">Dypocrypha</p>
                    <p className="archive-sub-title">아카이브</p>
                </span>
                <div className="archive-header-actives-wrapper">
                    <div className="extension-filter-dropdown" ref={dropdownRef}>
                        <button
                            className="filter-dropdown-btn"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
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
            <div className="archive-uploaded-viewer-container">

            </div>
        </div>
    );
}
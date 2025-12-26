import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import '../css/ProfileContainer.css';
import API from '../config/apiConfig';
import Doge from '../img/doge.jpeg';

export default function ProfileContainer() {
    const [userNickname, setUserNickname] = useState('');
    const { logout, isLogined } = useAuth();

    useEffect(() => {
        const profileInformationCalling = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/member/profileInformation`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                
                if (!response.ok) {
                    logout();
                    return;
                }

                const result = await response.json();
                
                if (!result.getProfileInfo) {
                    logout();
                } else {
                    setUserNickname(result.nickname);
                }
            } catch (error) {
                console.error("프로필 정보 로드 실패:", error);
                logout();
            }
        };

        if (isLogined) {
            profileInformationCalling();
        }
    }, [isLogined, logout]);

    if (!isLogined) {
        return null;
    }

    return (
        <div className="profile-container">
            <div className="profile-image-wrapper">
                <img 
                    src={Doge} 
                    alt={`${userNickname}의 프로필`} 
                    className="profile-image"
                />
            </div>
            <div className="profile-info">
                <span className="profile-nickname">{userNickname || '사용자'} 님</span>
                <div className="profile-actions">
                    <Link to="/mypage" className="profile-mypage-link">
                        마이페이지
                    </Link>
                    <button onClick={logout} className="profile-logout-btn">
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
}
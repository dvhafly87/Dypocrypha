import React, { useEffect, useState} from 'react'; // React import 추가
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 AuthContext 파일 경로에 맞게 수정 필요
import { useNavigate } from 'react-router-dom';

import '../css/ProfileContainer.css';

import API from '../config/apiConfig';
import Doge from '../img/doge.jpeg';

export default function ProfileContainer() {
    const [userNickname, setUserNickname] = useState('');
    const { logout, isLogined } = useAuth(); 
    const navigate = useNavigate();

    let toastData;
    const handleLogout = () => {
    logout();
    };

    useEffect(() => {
       const profileInformationCalling = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/member/profileInformation`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                const result = await response.json();
                if(!result.getProfileInfo){
                    handleLogout();
                } else {
                    setUserNickname(result.nickname);
                }
            } catch (error) {
                console.error("로그인 상태 확인 실패:", error);
                setIsLogined(false); 
            }
       }
       profileInformationCalling();
    }, []);

  return (
    <div className="profile-container">
      {isLogined && ( 
        <>
          <div className="profile-image-wrapper">
            <img 
              src={Doge} 
              alt={`사용자의 프로필`} 
              className="profile-image"
            />
          </div>
          <div className="profile-info">
            <span className="profile-nickname">{userNickname} 님</span>
            <div className="profile-actions">
              <Link to="/mypage" className="profile-mypage-link">
                마이페이지
              </Link>
              <button onClick={handleLogout} className="profile-logout-btn">
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
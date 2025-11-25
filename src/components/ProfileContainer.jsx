import React from 'react'; // React import 추가
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 AuthContext 파일 경로에 맞게 수정 필요
import '../css/ProfileContainer.css';

import Doge from '../img/doge.jpeg';

export default function ProfileContainer() {
  
  // 💡 1. useAuth 훅을 사용하여 전역 상태와 함수를 가져옵니다.
  const { logout, isLogined } = useAuth(); 

  // 임시 사용자 데이터 (실제로는 AuthContext나 props에서 받아옴)
  const userNickname = "사용자";

  // 💡 2. 로그아웃 핸들러를 AuthContext의 logout 함수로 대체합니다.
  const handleLogout = () => {
    logout(); // 👈 전역으로 가져온 logout 함수 호출
  };

  return (
    <div className="profile-container">
      {/* isLogined 상태를 활용하여 로그인 시에만 보여주는 등의 로직을 추가할 수 있습니다. */}
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
              {/* 💡 3. 버튼 클릭 시 handleLogout 연결 */}
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
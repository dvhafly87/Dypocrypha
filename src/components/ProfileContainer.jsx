import { Link } from 'react-router-dom';
import '../css/ProfileContainer.css';

import Doge from '../img/doge.jpeg';

export default function ProfileContainer() {
  // 임시 사용자 데이터 (실제로는 AuthContext나 props에서 받아옴)
  const userNickname = "사용자";

  // 로그아웃 핸들러 (실제로는 AuthContext의 logout 함수 사용)
  const handleLogout = () => {
    // logout(); // AuthContext에서 가져온 함수
    console.log("로그아웃");
  };

  return (
    <div className="profile-container">
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
    </div>
  );
}
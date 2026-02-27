import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';


export default function MyProfile() {
    return (
        <div className="mypage-destination">
            이 페이지는 회원 정보 페이지입니다.
        </div>
    );
}
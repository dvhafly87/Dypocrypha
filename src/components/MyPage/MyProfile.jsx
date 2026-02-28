import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';


export default function MyProfile() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isLogined, isLoading } = useAuth();

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
                const response = await fetch(PASSWRD_CHG_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passwordChange })
                });
            } catch (error) {

            }
        }
        getMemberInformation();
    }, []);

    return (
        <div className="mypage-destination">
            이 페이지는 회원 정보 페이지입니다.
        </div>
    );
}
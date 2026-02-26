import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../config/apiConfig.js';

const DRAW_URL = `${API.API_BASE_URL}/member/draw`

export default function MyWithdraw() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [drawPassword, setDrawPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isLogined, isLoading, logout} = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!isLogined) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: '로그인이 필요한 서비스 입니다' }));
            navigate('/login');
        }
    }, [isLogined, isLoading]);

    const handleDrawMember = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; //이미 제출된 경우 중복 제출 방지용

        if (!drawPassword.trim()) {
            addToast('비밀번호를 입력해주세요', 'warning');
            return;
        } //비밀번호 체크 처리

        //중복 처리 방지용 bool
        setIsSubmitting(true);

        try {
            const response = await fetch(DRAW_URL, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drawPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    addToast(result.memberDrawMessage || "비밀번호가 일치하지 않습니다", "warning");
                    return;
                } else if (response.status === 401) {
                    localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: result.memberDrawMessage || "로그인이 필요한 서비스입니다" }));
                    navigate('/login');
                    return;
                }
                throw new Error(result.memberDrawMessage || "서버 통신 불가");
            } else {
                localStorage.setItem('redirectToast', JSON.stringify({ status: 'success', message: result.memberDrawMessage || "탈퇴되었습니다" }));
                logout();
                navigate('/');
            }


        } catch (error) {
            localStorage.setItem('redirectToast', JSON.stringify({ status: 'error', message: error.message }));
            navigate('/');
            return;
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mypage-destination">
            <form onSubmit={handleDrawMember}>
                <input
                    type="password"
                    placeholder='계정 비밀번호 입력 ...'
                    autoComplete='off'
                    value={drawPassword}
                    onChange={(e) => setDrawPassword(e.currentTarget.value)}
                />
                <button type="submit">탈퇴하기</button>
            </form>
        </div>
    );
}
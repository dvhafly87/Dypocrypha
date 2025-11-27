import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

// API 경로는 실제 환경에 맞게 수정하세요.
import API from '../config/apiConfig';
const LOGIN_CHECKER_URL = `${API.API_BASE_URL}/member/login/checker`;
const LOGOUT_URL = `${API.API_BASE_URL}/member/logout`;


// Context 객체 생성
const AuthContext = createContext({
    isLogined: false,
    logout: () => {},
});

// Custom Hook
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider 컴포넌트 생성
export const AuthProvider = ({ children }) => {
    // 초기값은 false입니다.
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isLogined, setIsLogined] = useState(false);

    const loginSuccess = () => {
        setIsLogined(true);
    };

    // --- 2. 로그아웃 함수 (ProfileContainer에서 호출될 함수) ---
    const logout = async () => {
        try {
            // 서버에 로그아웃 요청 (쿠키/세션 무효화)
            const response = await fetch(LOGOUT_URL, {
                method: 'POST',
                credentials: 'include', // 세션/쿠키를 포함하여 요청
                headers: {'Content-Type': 'application/json'},
            });

            const result = await response.json();

            if(!response.ok){
                addToast("로그아웃 처리 중 오류 발생", "warning");
                setIsLogined(false);
                navigate('/login'); 
            }

            if(result.logoutSuccess){
                setIsLogined(false);
                addToast("로그아웃 되었습니다", "success");
                navigate('/');  
            }
        } catch (error) {
            // 네트워크 오류가 나더라도 클라이언트 측에서는 로그아웃 처리 (강제 로그아웃)
            addToast("로그아웃 처리 중 오류 발생: "+error, "warning");
            setIsLogined(false);
            // localStorage.removeItem('authToken');
            navigate('/login'); 
        }
    };

    // 오직 로그인 상태 확인 로직만 포함합니다.
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                // 로그인 상태 확인 API 호출
                const response = await fetch(LOGIN_CHECKER_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                
                const result = await response.json();

                // 서버 응답의 isLogined 결과만 전역 상태에 반영
                if(result.isLogined){
                    setIsLogined(true);
                } else {
                    // 로그아웃 상태이거나 응답이 false일 경우
                    setIsLogined(false);
                }
               
            } catch (error) {
                // API 호출 오류 발생 시에도 false로 유지
                console.error("로그인 상태 확인 실패:", error);
                setIsLogined(false); 
            }
        };
        checkLoginStatus();
    }, []); // 앱 실행 시 1회만 실행

    // Context Value 정의: 오직 isLogined 상태만 제공
    const value = {
        isLogined,
        logout,
        loginSuccess
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
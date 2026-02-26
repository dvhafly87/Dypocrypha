import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

import API from '../config/apiConfig';
const LOGIN_CHECKER_URL = `${API.API_BASE_URL}/member/login/checker`;
const LOGOUT_URL = `${API.API_BASE_URL}/member/logout`;

const AuthContext = createContext({
    isLogined: false,
    isLoading: true, 
    logout: () => {},
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isLogined, setIsLogined] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 
    

    const loginSuccess = () => {
        setIsLogined(true);
    };

    const logout = async () => {
        try {
            const response = await fetch(LOGOUT_URL, {
                method: 'POST',
                credentials: 'include',
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
            addToast("로그아웃 처리 중 오류 발생: "+error, "warning");
            setIsLogined(false);
            navigate('/login'); 
        }
    };

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(LOGIN_CHECKER_URL, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                
                const result = await response.json();

                setIsLogined(result.isLogined ?? false);
               
            } catch (error) {
                console.error("로그인 상태 확인 실패:", error);
                setIsLogined(false); 
            } finally {
                setIsLoading(false); 
            }
        };
        checkLoginStatus();
    }, []);

    const value = {
        isLogined,
        isLoading, 
        logout,
        loginSuccess
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
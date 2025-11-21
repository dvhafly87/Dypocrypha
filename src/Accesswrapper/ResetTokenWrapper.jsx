import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import ResetPage from '../components/ResetPage.jsx';

export default function tokenWrapper(){
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); 
    
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 2. 토큰이 없으면 바로 로딩 종료
        if (!token) {
            setIsLoading(false);
            return; 
        }
        setIsValid(true);
        setIsLoading(false);
      }, [token]);

      if (isLoading) {
        return <div>유효성 확인 중...</div>; 
      }
      
      if (!token || !isValid) {
        return <Navigate to="/resetPassword" replace />;
      }
      
      return (
            <ResetPage actualToken={token} /> 
      );
}
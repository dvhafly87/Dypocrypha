import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useApiError = () => {
    const navigate = useNavigate();  // ✅ Hook 안에서는 가능!

    const handleNetworkError = useCallback((error, customMessage = null) => {
        console.error('Network error:', error);
        
        let errorMessage = "알 수 없는 오류가 발생했습니다";
        
        if (error.message === 'Failed to fetch') {
            errorMessage = customMessage 
                ? customMessage + " 서버에 연결할 수 없습니다" 
                : "서버에 연결할 수 없습니다";
        } else if (error.name === 'TypeError') {
            errorMessage = customMessage 
                ? customMessage + " 네트워크 연결을 확인해주세요" 
                : "네트워크 연결을 확인해주세요";
        }

        const toastData = { status: 'error', message: errorMessage };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
    }, [navigate]);

    return { handleNetworkError };
};

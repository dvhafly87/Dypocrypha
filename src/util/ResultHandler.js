import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useApiError = () => {
    const navigate = useNavigate();

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

    /**
     * API 응답 상태 코드 처리
     * @param {Response} response - fetch API response 객체
     * @param {Object} result - response.json() 결과
     * @param {Object} options - 처리 옵션
     * @param {Function} options.onSuccess - 200/201 성공 시 실행할 콜백
     * @param {string} options.successMessageKey - result에서 메시지를 가져올 키 (기본: 'message')
     * @param {string} options.errorMessageKey - result에서 에러 메시지를 가져올 키 (기본: 'message')
     * @param {Function} options.addToast - 토스트 표시 함수
     * @returns {boolean} - 처리 성공 여부
     */
    const handleApiResponse = useCallback(({ 
        response, 
        result, 
        onSuccess, 
        successMessageKey = 'message',
        errorMessageKey = 'message',
        addToast 
    }) => {
        const status = response.status;

        // 500 - 서버 에러
        if (status === 500) {
            const toastData = {
                status: 'error',
                message: result?.[errorMessageKey] || "서버 통신 불가"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
            return false;
        }

        // 404, 400 - 잘못된 요청
        if (status === 404 || status === 400) {
            const toastData = {
                status: 'error',
                message: result?.[errorMessageKey] || "유효하지 않은 요청입니다"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
            return false;
        }

        // 401 - 인증 필요
        if (status === 401) {
            const toastData = {
                status: 'error',
                message: result?.[errorMessageKey] || "로그인이 필요한 서비스입니다"
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/login');
            return false;
        }

        // 403 - 권한 없음
        if (status === 403) {
            if (addToast) {
                addToast(result?.[errorMessageKey] || "권한이 없습니다", "warning");
            }
            return false;
        }

        // 200, 201 - 성공
        if (status === 200 || status === 201) {
            if (onSuccess) {
                onSuccess(result);
            }
            return true;
        }

        // 예상치 못한 상태 코드
        const toastData = {
            status: 'warning',
            message: "예상치 못한 응답입니다"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
        return false;

    }, [navigate]);

    return { handleNetworkError, handleApiResponse };
};
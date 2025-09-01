import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true }) => {
    // 로컬 스토리지에서 인증 상태 확인
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // 인증이 필요한 페이지인데 로그인되지 않은 경우
    if (requireAuth && !isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // 이미 로그인된 사용자가 로그인 페이지에 접근하는 경우
    if (!requireAuth && isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

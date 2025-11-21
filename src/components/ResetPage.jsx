import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import API from '../config/apiConfig.js';

export default function ResetPasswordInThisPage(props) {
    const token = props.actualToken;
    const { addToast } = useToast();
    const [isValidToken, setIsValidToken] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 1차 인증: 페이지 접근 시 토큰 검증
    useEffect(() => {
        const tokenValidationChecker = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/member/tokenchecker`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ resetToken: token }) // 토큰 전달
                });
                const result = await response.json();

                if (result.tokenChecker) {
                    setIsValidToken(true);
                } else {
                    const toastData = {
                        status: 'warning',
                        message: '토큰값 인증 실패'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Token validation error:', error);
                const toastData = {
                    status: 'error',
                    message: '토큰 검증 중 오류가 발생했습니다'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
            }
        };
        
        if (token) {
            tokenValidationChecker();
        } else {
            window.location.href = '/';
        }
    }, [token]);

    // 2차 인증: 비밀번호 변경 시 토큰과 함께 재검증
    const handlePasswordReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            addToast({
                status: 'error',
                message: '비밀번호가 일치하지 않습니다'
            });
            return;
        }

        try {
            const response = await fetch(`${API.API_BASE_URL}/member/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,  // 토큰을 함께 전송하여 백엔드에서 재검증
                    newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                addToast({
                    status: 'success',
                    message: '비밀번호가 성공적으로 변경되었습니다'
                });
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                addToast({
                    status: 'error',
                    message: result.message || '비밀번호 변경에 실패했습니다'
                });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            addToast({
                status: 'error',
                message: '비밀번호 변경 중 오류가 발생했습니다'
            });
        }
    };

    if (!isValidToken) {
        return <div>토큰 검증 중...</div>;
    }

    return (
        <div>
            <h2>비밀번호 재설정</h2>
            <form onSubmit={handlePasswordReset}>
                <input
                    type="password"
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">비밀번호 변경</button>
            </form>
        </div>
    );
}
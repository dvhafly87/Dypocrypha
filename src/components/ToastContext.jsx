// src/components/ToastContext.jsx

import React, { createContext, useContext, useState } from 'react'; // ⭐️ React만 있어도 됨
import '../css/Toast.css'; // ⭐️ CSS 임포트 (필수)

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// 1. Toast UI 렌더링 컴포넌트
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container"> 
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <p className="toast-message">{toast.message}</p>
                    <button 
                        className="toast-close-btn" 
                        onClick={() => removeToast(toast.id)}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

// 2. Provider: 상태 관리 및 Container 렌더링
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        // 배열 관리 로직
        setToasts(prev => [...prev.slice(-4), { id, message, type }]); 
        
        // 3초 후 자동 제거 로직
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* ⭐️ ToastContainer를 여기에 렌더링합니다. */}
            <ToastContainer toasts={toasts} removeToast={removeToast} /> 
        </ToastContext.Provider>
    );
}
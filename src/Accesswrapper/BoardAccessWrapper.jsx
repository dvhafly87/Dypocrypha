import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../config/apiConfig';


export default function BoardPrivatePostAccess({ boardId, boardName }){
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const thisPageIsOnlyPrivateBoardPage = async () => {
            const response = await fetch(`${API.API_BASE_URL}/private/boardChecker`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callingpostId: boardId,
                    callingpostBoardName: boardName,
                })
            });
            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: "서버 통신 불가"
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if(!result.boardChecker) {
                const toastData = {
                    status: 'warning',
                    message: result.boardCheckerMessage
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }
        }
        

        thisPageIsOnlyPrivateBoardPage();
    }, []);
    return (
        <>
            {boardName}
        </>
    )
}         
import React, { useState, useEffect } from 'react';
import API from '../config/apiConfig';


export default function BoardPrivatePostAccess({ boardId, boardName }){
   useEffect(() => {
     const thisPageIsOnlyPrivateBoardPage = async () => {
        const response = await fetch(`${API.API_BASE_URL}/board/postcalling`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callingpostId: boardId,
                callingpostBoardName: boardName,
            })
        });
        
     }
     thisPageIsOnlyPrivateBoardPage();
     }, []);
    return (
        <>
            {boardName}
        </>
    )
}         
import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ToastContext.jsx';
import API from '../config/apiConfig.js';
export default function BoardPostContent() {
    const { boardId } = useParams();
    const { postId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();


      useEffect(() => {
        const boardPostContentCalling= async () => {
          try {
            setIsLoading(true);
            const response = await fetch(`${API.API_BASE_URL}/board/postcontent/call`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callingContentBoardId: boardId,
                calliingContentPostId: postId,
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
    
          } catch (error) {
            addToast("게시판 목록을 불러오는데 실패했습니다", "error");
          } finally {
            setIsLoading(false);
          }
        };
    
        boardPostContentCalling();
      }, []);

  return (
    <div>
        <h2>Board Post Content</h2>
        {boardId && <p>Board ID: {boardId}</p>}
        {postId && <p>Post ID: {postId}</p>}
    </div>
  );
}
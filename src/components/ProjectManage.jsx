import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function projectManage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const getThisProjectInformation = async () => {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/info/id`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    callProjectId: projectId
                })
            });
        
              if(!response.ok) {
                const toastData = {
                  status: 'warning',
                  message: '프로젝트 목록을 불러올 수 없습니다.'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
              }
        
              const result = await response.json();

              if(result.projectOneInfoStatus) {

              } else {
                addToast("")
              }
        
            } catch (error) {
              console.error('Token validation error:', error);
              const toastData = {
                status: 'error',
                message: '프로젝트 페이지 useEffect API 에러'
              };
              localStorage.setItem('redirectToast', JSON.stringify(toastData));
              window.location.href = '/';
            }
        };

        getThisProjectInformation();
    }, []);
    return (
        <>
            프로젝트 관리 페이지
        </>
    )
}
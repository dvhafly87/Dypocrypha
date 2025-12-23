import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

import API from '../config/apiConfig.js';

import '../css/ProjectManage.css';

export default function projectManage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [projectBasic, setProjectBasic] = useState([]);

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
                if(result.projectOneInfobasic != null) {
                    setProjectBasic(result.projectOneInfobasic);
                }
              } else {
                const toastData = {
                    status: 'warning',
                    message: result.projectOneInfoMessage
                  };
                  localStorage.setItem('redirectToast', JSON.stringify(toastData));
                  window.location.href = '/';
              }
        
            } catch (error) {
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
    // 프로젝트 상태 = C => 완성 , I => 진행 중 , H => 대기 //처음 생성하면 대기 상태 대기상태에서 몇가지 주요 정보 입력과 함께 진행상태로 전환가능 D=> 중단 말그대로 잠시 중단상태 이건 진행상태랑 거의 비슷하지만 추후 중단되었다가 다시 재시작 혹은 그대로 드랍되면 삭제되게 
    return (
        <>
            <div className="project-manage-container">
                <div className="project-manage-header">
                     <img className="project-manage-thumbnail"
                        src={`${API.API_BASE_URL}/projectThumb/${projectBasic.projectThumb}`}
                        alt="프로젝트 썸네일"
                    />
                </div>
            </div>
        </>
    )
}
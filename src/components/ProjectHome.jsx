import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';

import '../css/ProjectMain.css';

import API from '../config/apiConfig.js';

export default function ProjectMain() {
  const navigate = useNavigate();

  const [projectInfo, setProjectInfo] = useState([]);

  const statusCount = projectInfo.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  
  const inProgress = statusCount.I || 0;
  const completed  = statusCount.C || 0;
  const hold       = statusCount.H || 0;
  const dropped    = statusCount.D || 0;

  const navigateCompleteProject = () => {
    navigate("/completeproject");
  }

  useEffect(() => {
    const getProjectInformation = async () => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/getAllData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            if (result.projectDataStatus) {
              setProjectInfo(result.projectDataBool ? result.projectData : []);
            } else {
              const toastData = {
                  status: 'warning',
                  message: result.projectDataMessage
              };
              localStorage.setItem('redirectToast', JSON.stringify(toastData));
              window.location.href = '/';
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
    getProjectInformation();
  }, []);
  return (
    <>
      <div className="project-main-container">
        <div className="project-header">
          <div className="project-header-left">
            <h2 className="project-title">프로젝트</h2>
            <span className="project-sub-title">
              전체 프로젝트 {projectInfo.length}건
            </span>
          </div>

          <div className="project-header-right">
            <div className="project-status-box complete">
              <span className="count">{completed}</span>
              <span className="label">완료</span>
            </div>

            <div className="project-status-box progress">
              <span className="count">{inProgress}</span>
              <span className="label">진행중</span>
            </div>

            <div className="project-status-box progress">
              <span className="count">{hold}</span>
              <span className="label">대기</span>
            </div>

            <div className="project-status-box progress">
              <span className="count">{dropped}</span>
              <span className="label">중단</span>
            </div>
          </div>
        </div>
        <div className="project-content-container">
          <div className="project-complete-navigate-container">
              <div className="project-commentors">
                <div className="project-complete-svg-container">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20" />
                    <path d="M6.5 7v10" />
                  </svg>
                </div>  
                    <div className="pj-comment">
                        <div className="complete-icon">✓</div>
                        <span>완성된 프로젝트를 한곳에서</span>
                    </div>
                    <div className="pj-comment">
                        <div className="complete-icon">✓</div>
                        <span>프로젝트 아카이브</span>
                    </div>
                    <div className="pj-comment">
                        <div className="complete-icon">✓</div>
                        <span>프로젝트의 결과를 정리하는 공간</span>
                    </div>
              </div>
              <button onClick={navigateCompleteProject}>완성된 프로젝트</button>
          </div>
          
          <div className="add-project-and-progress-pj-list-container">

          </div>  
        </div>
      </div>
    </>
  )
}
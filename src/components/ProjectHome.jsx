import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';

import '../css/ProjectMain.css';

import API from '../config/apiConfig.js';

export default function ProjectMain() {
  const navigate = useNavigate();
  const [projectArea, setProjectArea] = useState(false);
  const [nonProjectArea, setNonProjectArea] = useState(false);
  const { isLogined } = useAuth();
  const { addToast } = useToast();
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  
  // 프로젝트 폼 상태
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [teamValue, setTeamValue] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [skillStack, setSkillStack] = useState("");
  const [projectThumb, setProjectThumb] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  const addNewProject = () => {
    if(!isLogined) {
      addToast("로그인이 필요합니다", "warning");
    } else {
      setAddProjectModalOpen(true);
    }
  };

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

  const handleThumbChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        addToast('이미지 파일만 업로드 가능합니다.', 'warning');
        return;
      }

      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        addToast('파일 크기는 5MB 이하여야 합니다.', 'warning');
        return;
      }

      setProjectThumb(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumb = () => {
    setProjectThumb(null);
    setThumbPreview(null);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', projectTitle);
    formData.append('summary', projectSummary);
    formData.append('teamValue', teamValue);
    if (teamValue && teamName) {
      formData.append('teamName', teamName);
    }
    if (skillStack) {
      formData.append('skillStack', skillStack);
    }
  
    if (projectThumb) {
      formData.append('projectThumb', projectThumb);
    }

    try {
      const response = await fetch(`${API.API_BASE_URL}/project/create`, {
        method: 'POST',
        body: formData
      });

      if(!response.ok) {
        const toastData = {
          status: 'warning',
          message: "서버 통신 불가"
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate('/');
        return;
      }

      const result = await response.json();

      if (result.createPJStatus) {
        addToast('프로젝트가 생성되었습니다.', 'success');
        setAddProjectModalOpen(false);
        resetForm();
        // 프로젝트 목록 새로고침
        getProjectInformation();
      } else {
        setAddProjectModalOpen(false);
        addToast(result.createPJMessage, 'warning');
      }
    } catch (error) {
      const toastData = {
        status: 'warning',
        message: "서버 통신 불가"
      };
      localStorage.setItem('redirectToast', JSON.stringify(toastData));
      navigate('/');
      return;
    }
  };

  const resetForm = () => {
    setProjectTitle("");
    setProjectSummary("");
    setTeamValue(false);
    setTeamName("");
    setSkillStack("");
    setProjectThumb(null);
    setThumbPreview(null);
  };

  const closeModal = () => {
    setAddProjectModalOpen(false);
    resetForm();
  };

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

  useEffect(() => {
    getProjectInformation();
  }, []);

  const hasProject = hold > 0;

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
                <span>프로젝트의 결과를 정리</span>
              </div>
            </div>
            <button onClick={navigateCompleteProject}>완성된 프로젝트</button>
          </div>
          <div className="project-main-content-container">
            <div className="project-main-content-header">
              <div className="project-search-container">
                <form onSubmit={(e) => e.preventDefault()}>
                  <input placeholder="프로젝트 검색 ..." autoComplete="off"/>
                  <button type="submit">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </form>
              </div>
              <div className="add-new-project-container">
                <button className="sort-card">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="1.5"/>
                    <rect x="13" y="3" width="8" height="8" rx="1.5"/>
                    <rect x="3" y="13" width="8" height="8" rx="1.5"/>
                    <rect x="13" y="13" width="8" height="8" rx="1.5"/>
                  </svg>
                </button>
                <button className="sort-list">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="3" rx="1.5"/>
                    <rect x="3" y="10.5" width="18" height="3" rx="1.5"/>
                    <rect x="3" y="17" width="18" height="3" rx="1.5"/>
                  </svg>
                </button>
                <button className="add-new-project" onClick={addNewProject}>새 프로젝트 생성 +</button>
              </div>
            </div>
            {!hasProject && (
              <div className="project-non-list-container">
                <h3>현재 생성된 프로젝트가 없습니다.</h3>
                <p>새 프로젝트 생성 + 버튼을 눌러 새 프로젝트를 생성해보세요</p>
              </div>
            )}

            {hasProject && (
              <div className="project-list-container">
                <h3>여기에 프로젝트를 카드 또는 바 형태로</h3>
                <p>아직은 안만들어져 있지</p>
              </div>
            )}
          </div>  
        </div>
      </div>

      {addProjectModalOpen && (
        <>
          <div className="modal-overlay" onClick={closeModal}></div>
          <div className="add-new-project-modal">
            <div className="modal-header">
              <h3>새 프로젝트 생성</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleProjectSubmit}>
              <div className="project-modal-body">
                <div className="form-group">
                  <label htmlFor='projectTitle'>프로젝트 타이틀 <span className="required">*</span></label>
                  <input 
                    type="text"
                    id="projectTitle"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="프로젝트 이름을 입력하세요"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor='projectSummary'>프로젝트 요약 <span className="required">*</span></label>
                  <textarea 
                    id="projectSummary"
                    value={projectSummary}
                    onChange={(e) => setProjectSummary(e.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                    rows={3}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={teamValue}
                      onChange={(e) => {
                        setTeamValue(e.target.checked);
                        if (!e.target.checked) setTeamName("");
                      }}
                    />
                    <span>팀 프로젝트</span>
                  </label>
                </div>

                {teamValue && (
                  <div className="form-group team-name-group">
                    <label htmlFor='teamName'>팀 이름 <span className="required">*</span></label>
                    <input 
                      type="text"
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="팀 이름을 입력하세요"
                      maxLength={255}
                      required={teamValue}
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor='skillStack'>기술 스택</label>
                    <input 
                      type="text"
                      id="skillStack"
                      value={skillStack}
                      onChange={(e) => setSkillStack(e.target.value)}
                      placeholder="Spring, React, python, Vue ... 등"
                      maxLength={255}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor='projectThumb'>프로젝트 썸네일</label>
                  <div className="file-upload-container">
                    {thumbPreview ? (
                      <div className="thumb-preview-wrapper">
                        <img src={thumbPreview} alt="썸네일 미리보기" className="thumb-preview" />
                        <button type="button" className="remove-thumb-btn" onClick={removeThumb}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="projectThumb" className="file-upload-label">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>이미지를 선택하세요</span>
                        <span className="file-upload-hint">JPG, PNG, GIF (최대 5MB)</span>
                      </label>
                    )}
                    <input 
                      type="file"
                      id="projectThumb"
                      accept="image/*"
                      onChange={handleThumbChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  프로젝트 생성
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
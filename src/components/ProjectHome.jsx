import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';

import '../css/ProjectMain.css';

import API from '../config/apiConfig.js';

export default function ProjectMain() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projectArea, setProjectArea] = useState(false);
  const [nonProjectArea, setNonProjectArea] = useState(false);
  const { isLogined } = useAuth();
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);

  // 프로젝트 폼 상태
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [projectCategory, setProjectCategory] = useState("개발");
  const [teamValue, setTeamValue] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [skillStack, setSkillStack] = useState("");
  const [projectThumb, setProjectThumb] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  // 카테고리 목록
  const categories = ['개발', '디자인', '기획', '학습', '연구', '취미', '기타'];

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
    formData.append('category', projectCategory);
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
        credentials: 'include',
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
    setProjectCategory("개발");
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

  const hasProject = projectInfo.length > 0
  
  // ProjectMain.jsx의 상태에 추가할 부분
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링된 프로젝트
  const filteredProjects = projectInfo.filter(project => {
    if (project.status === 'C') return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title?.toLowerCase().includes(query) ||
      project.summary?.toLowerCase().includes(query) ||
      project.skillStack?.toLowerCase().includes(query) ||
      project.teamName?.toLowerCase().includes(query)
    );
  });

  // 검색 핸들러 수정
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (projectId) => {
    navigate(`/project/manage/${projectId}`);
  };

  // 상태 라벨 가져오기
  const getStatusLabel = (status) => {
    const statusMap = {
      'I': { label: '진행중', color: '#2196f3' },
      'C': { label: '완료', color: '#4caf50' },
      'H': { label: '대기', color: '#ff9800' },
      'D': { label: '중단', color: '#f44336' }
    };
    return statusMap[status] || { label: '알 수 없음', color: '#999' };
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

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
              <form onSubmit={handleSearch}>
                <input 
                  placeholder="프로젝트 검색 ..." 
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
              <button 
                className={`sort-card ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="8" height="8" rx="1.5"/>
                  <rect x="13" y="3" width="8" height="8" rx="1.5"/>
                  <rect x="3" y="13" width="8" height="8" rx="1.5"/>
                  <rect x="13" y="13" width="8" height="8" rx="1.5"/>
                </svg>
              </button>
              <button 
                className={`sort-list ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
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
                {filteredProjects.length === 0 ? (
                  <div className="no-search-results">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어로 시도해보세요</p>
                  </div>
                ) : (
                  <>
                    {viewMode === 'card' ? (
                      <div className="project-card-grid">
                        {filteredProjects.map((project) => {
                          const statusInfo = getStatusLabel(project.status);
                          return (
                            <div 
                              key={project.id} 
                              className="project-card"
                              onClick={() => handleProjectClick(project.id)}
                            >
                              <div className="project-card-thumb">
                                {project.projectThumb ? (
                                 <img
                                 src={`${API.API_BASE_URL}/projectThumb/${project.projectThumb}`}
                                 alt="프로젝트 썸네일"
                               />
                                ) : (
                                  <div className="project-card-thumb-placeholder">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                  </div>
                                )}
                                <div className="project-card-status" style={{ backgroundColor: statusInfo.color }}>
                                  {statusInfo.label}
                                </div>
                              </div>
                              
                              <div className="project-card-content">
                                <h3 className="project-card-title">{project.title}</h3>
                                <p className="project-card-summary">{project.summary}</p>

                                {!project.teamValue && (
                                  <div className="project-card-team">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="7" r="4" />
                                      <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                                    </svg>
                                    <span>{project.starter}</span>
                                  </div>
                                )}

                                {project.teamValue && project.teamName && (
                                  <div className="project-card-team">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>{project.teamName}</span>
                                  </div>
                                )}
                                
                                {project.skillStack && (
                                  <div className="project-card-skills">
                                    {project.skillStack.split(',').map((skill, idx) => (
                                      <span key={idx} className="skill-tag">
                                        {skill.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="project-card-footer">
                                <span className="project-card-category-text">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                  </svg>
                                  {project.pjCategory}
                                </span>
                                  <span className="project-card-date">
                                    {formatDate(project.created)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="project-list-view">
                        {filteredProjects.map((project) => {
                          const statusInfo = getStatusLabel(project.status);
                          return (
                            <div 
                              key={project.id} 
                              className="project-list-item"
                              onClick={() => handleProjectClick(project.id)}
                            >
                              <div className="project-list-thumb">
                                {project.projectThumb ? (
                                <img
                                  src={`${API.API_BASE_URL}/projectThumb/${project.projectThumb}`}
                                  alt="프로젝트 썸네일"
                                />
                                ) : (
                                  <div className="project-list-thumb-placeholder">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              <div className="project-list-content">
                                <div className="project-list-header">
                                  <h3 className="project-list-title">{project.title}</h3>
                                  <div className="project-list-status" style={{ backgroundColor: statusInfo.color }}>
                                    {statusInfo.label}
                                  </div>
                                </div>
                                
                                <p className="project-list-summary">{project.summary}</p>
                                
                                <div className="project-list-meta">

                                <div className="project-list-category">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                  </svg>
                                  <span>{project.pjCategory}</span>
                                </div>

                                {!project.teamValue && (
                                    <div className="project-list-team">
                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="7" r="4" />
                                      <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                                    </svg>
                                      <span>{project.starter}</span>
                                    </div>
                                  )}
                                  {project.teamValue && project.teamName && (
                                    <div className="project-list-team">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                      <span>{project.teamName}</span>
                                    </div>
                                  )}
                                  
                                  {project.skillStack && (
                                    <div className="project-list-skills">
                                      {project.skillStack.split(',').slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="skill-tag-small">
                                          {skill.trim()}
                                        </span>
                                      ))}
                                      {project.skillStack.split(',').length > 3 && (
                                        <span className="skill-tag-small more">
                                          +{project.skillStack.split(',').length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <span className="project-list-date">
                                    {formatDate(project.created)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
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
                  <label htmlFor='projectSummary'>프로젝트 요약</label>
                  <textarea 
                    id="projectSummary"
                    value={projectSummary}
                    onChange={(e) => setProjectSummary(e.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                    rows={3}
                    maxLength={255}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor='projectCategory'>프로젝트 카테고리 <span className="required">*</span></label>
                  <select 
                    id="projectCategory"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
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
                    <label htmlFor='skillStack'>사용 스킬 / 툴</label>
                    <input 
                      type="text"
                      id="skillStack"
                      value={skillStack}
                      onChange={(e) => setSkillStack(e.target.value)}
                      placeholder="언어, 프레임워크, 프로그램, 툴 등"
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
                        <span className="file-upload-hint">JPG, JPEG, PNG(최대 5MB)</span>
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
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';
import '../css/ProjectManage.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function ProjectManage() {
    const [projectBasic, setProjectBasic] = useState([]);
    const [newMemberRole, setNewMemberRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [projectMember, setProjectMember] = useState([]);
    const [teamNameInput, setTeamNameInput] = useState('');
    const [permissionGrade, setPermissionGrade] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberGrade, setNewMemberGrade] = useState('M');

    const [summary, setSummary] = useState('');
    const [skillTool, setSkillTool] = useState('');
    const [selectCategory, setSelectCategory] = useState('');

    const [showCategorySelect, setShowCategorySelect] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditSummary, setShowEditSummary] = useState(false);
    const [showEditSkillTool, setShowEditSkillTool] = useState(false);

    const { projectId } = useParams();
    const { addToast } = useToast();
    const { isLogined, loginSuccess } = useAuth();
    const navigate = useNavigate();

    const categories = ['개발', '디자인', '기획', '학습', '연구', '취미', '기타'];

    const updateSubmitProjectInformation = async () => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updateProjectId: projectId,
                    updateProjectSkillTool: skillTool,
                    updateProjectCategory: selectCategory,
                    updateProjectSummary: summary
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '서버 통신 불가'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }

            const result = await response.json();

            if (result.updateProjectInformationStatus) {
                
            } else {
                addToast(result.updateProjectInformationMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '서버 통신 불가'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
    };

    // 개요 수정 핸들러
    const handleUpdateSummary = async () => {
        const success = await updateSubmitProjectInformation();
        if (success) {
            addToast('프로젝트 개요가 수정되었습니다.', 'success');
            setShowEditSummary(false);
            window.location.reload();
        }
    };

    // 스킬/툴 수정 핸들러
    const handleUpdateSkillTool = async () => {
        const success = await updateSubmitProjectInformation();
        if (success) {
            addToast('스킬/툴이 수정되었습니다.', 'success');
            setShowEditSkillTool(false);
            window.location.reload();
        }
    };

    // 카테고리 수정 핸들러
    const handleUpdateCategory = async (category) => {
        setSelectCategory(category);
        setShowCategorySelect(false);

        // 카테고리만 업데이트하기 위해 임시로 설정
        const tempSummary = summary;
        const tempSkillTool = skillTool;

        try {
            const response = await fetch(`${API.API_BASE_URL}/project/skillstack/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updateProjectId: projectId,
                    updateProjectSkillTool: tempSkillTool,
                    updateProjectCategory: category,
                    updateProjectSummary: tempSummary
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '서버 통신 불가'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
                return;
            }

            const result = await response.json();

            if (result.updateProjectInformationStatus) {
                addToast('카테고리가 수정되었습니다.', 'success');
                window.location.reload();
            } else {
                addToast(result.updateProjectInformationMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '서버 통신 불가'
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
    };

    const getDurationDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffTime = end - start;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const getProjectDays = (project) => {
        if (!project?.created) return 0;

        if (project.status === 'I') {
            return getDurationDays(project.created, new Date());
        }

        if (project.status === 'C' || project.status === 'D') {
            return getDurationDays(project.created, project.endDay);
        }

        return 0;
    };

    const getMemberGradeLabel = (grade) => {
        return grade === 'L' ? '관리자' : '팀원';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const handleChangeGrade = async (memberId, currentGrade) => {
        const newGrade = currentGrade === 'L' ? 'M' : 'L';
        const gradeLabel = newGrade === 'L' ? '관리자' : '팀원';

        if (window.confirm(`이 팀원의 역할을 ${gradeLabel}로 변경하시겠습니까?`)) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/member/grade/update`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: memberId,
                        newGrade: newGrade
                    })
                });

                if (response.ok) {
                    addToast(`역할이 ${gradeLabel}로 변경되었습니다.`, 'success');
                    window.location.reload();
                } else {
                    addToast('역할 변경에 실패했습니다.', 'error');
                }
            } catch (error) {
                addToast('역할 변경 중 오류가 발생했습니다.', 'error');
            }
        }
    };

    const navigatedLoginPage = () => {
        const toastData = {
            status: 'warning',
            message: "로그인이 필요합니다."
        };
        localStorage.setItem('redirectToast', JSON.stringify(toastData));
        navigate("/login");
    };

    const handleAddMember = async () => {
        if (!projectBasic.teamValue) {
            if (!teamNameInput.trim()) {
                addToast('팀 이름을 입력해주세요.', 'warning');
                return;
            }
            if (!newMemberName.trim()) {
                addToast('팀원 이름을 입력해주세요.', 'warning');
                return;
            }

            try {
                const finalRole = newMemberRole === '직접입력' ? customRole : newMemberRole;

                const addMemberResponse = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput,
                        projectTeamMemberRole: finalRole
                    })
                });

                if (!addMemberResponse.ok) {
                    const toastData = {
                        status: 'warning',
                        message: "서버 통신 불가"
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                    return;
                }

                const result = await addMemberResponse.json();

                if (result.insertAddStatus) {
                    addToast('팀 프로젝트로 전환되고 팀원이 추가되었습니다.', 'success');
                    setNewMemberName('');
                    setNewMemberGrade('M');
                    setNewMemberRole('');
                    setCustomRole('');
                    setTeamNameInput('');
                    setShowAddMemberModal(false);
                    window.location.reload();
                } else {
                    addToast('팀원 추가에 실패했습니다.', 'error');
                }
            } catch (error) {
                addToast('처리 중 오류가 발생했습니다.', 'error');
            }
        } else {
            if (!newMemberName.trim()) {
                addToast('팀원 이름을 입력해주세요.', 'warning');
                return;
            }

            try {
                const finalRole = newMemberRole === '직접입력' ? customRole : newMemberRole;

                const response = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput,
                        projectTeamMemberRole: finalRole
                    })
                });
                const result = await response.json();

                if (result.insertAddStatus) {
                    addToast('팀원이 추가되었습니다.', 'success');
                    setNewMemberName('');
                    setNewMemberGrade('M');
                    setNewMemberRole('');
                    setCustomRole('');
                    setShowAddMemberModal(false);
                    window.location.reload();
                } else {
                    addToast(result.insertAddMessage, 'error');
                }
            } catch (error) {
                addToast('팀원 추가 중 오류가 발생했습니다.', 'error');
            }
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm('이 팀원을 제거하시겠습니까?')) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/member/remove`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        memberId: memberId
                    })
                });

                if (response.ok) {
                    addToast('팀원이 제거되었습니다.', 'success');
                    window.location.reload();
                } else {
                    addToast('팀원 제거에 실패했습니다.', 'error');
                }
            } catch (error) {
                addToast('팀원 제거 중 오류가 발생했습니다.', 'error');
            }
        }
    };

    const statusMenuRef = useRef(null);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                showStatusMenu &&
                statusMenuRef.current &&
                !statusMenuRef.current.contains(e.target)
            ) {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStatusMenu]);

    useEffect(() => {
        const fetchPermission = async () => {
            if (!isLogined || !loginSuccess) return;

            try {
                const res = await fetch(`${API.API_BASE_URL}/project/member/permission/check`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId })
                });

                const result = await res.json();

                if (result.permissionCheckStatus) {
                    setPermissionGrade(result.permissionGrade);
                } else {
                    setPermissionGrade('');
                }
            } catch {
                setPermissionGrade('');
            }
        };

        fetchPermission();
    }, [projectId, isLogined, loginSuccess]);

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

                if (!response.ok) {
                    const toastData = {
                        status: 'warning',
                        message: '프로젝트 목록을 불러올 수 없습니다.'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

                const result = await response.json();

                if (result.projectOneInfoStatus) {
                    if (result.projectOneInfobasic != null) {
                        setProjectBasic(result.projectOneInfobasic);
                    } else {
                        setProjectBasic([]);
                    }

                    if (result.projectMemberInformation != null) {
                        setProjectMember(result.projectMemberInformation);
                    } else {
                        setProjectMember([]);
                    }

                } else {
                    const toastData = {
                        status: 'warning',
                        message: result.projectOneInfoMessage
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

            } catch (error) {
                const toastData = {
                    status: 'error',
                    message: '프로젝트 페이지 useEffect API 에러'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        };
        getThisProjectInformation();
    }, []);

    // projectBasic 로드 후 state 초기화
    useEffect(() => {
        if (projectBasic && Object.keys(projectBasic).length > 0) {
            setSummary(projectBasic.summary || '');
            setSkillTool(projectBasic.skillStack || '');
            setSelectCategory(projectBasic.pjCategory || '');
        }
    }, [projectBasic]);

    const getStatusLabel = (status) => {
        const statusMap = {
            'H': '대기',
            'I': '진행중',
            'C': '완료',
            'D': '중단'
        };
        return statusMap[status] || '알 수 없음';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'H': '#6b7280',
            'I': '#3b82f6',
            'C': '#10b981',
            'D': '#ef4444'
        };
        return colorMap[status] || '#6b7280';
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/status/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    projectStatus: newStatus
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버가 실행중이 아니라 프로젝트 상태 변경이 불가능합니다 나중에 다시 시도해주십시오.'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }

            const result = await response.json();

            if (result.updateReturnStatus) {
                setProjectBasic(prev => ({
                    ...prev,
                    status: newStatus
                }));

                addToast('프로젝트 상태가 변경되었습니다.', 'success');
                setShowStatusMenu(false);
            } else {
                addToast(result.updateReturnMessage, "error");
            }
        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '에러 발생' + error.message
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            navigate('/');
        }
        setShowStatusMenu(false);
    };

    const handleDeleteProject = async () => {

        if (!loginSuccess || !isLogined) {
            addToast("로그인이 필요합니다.", "error");
            return;
        }

        if (projectBasic.status === 'H') {
            addToast("진행되지 않은 프로젝트는 삭제하실 수 없습니다", "error");
            return;
        }

        if (permissionGrade !== 'L') {
            addToast("프로젝트 삭제 권한이 없습니다.", "error");
            return;
        }

        if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId
                    })
                });

                if (!response.ok) {
                    const toastData = {
                        status: 'warning',
                        message: '현재 서버에 문제가 생겨 프로젝트의 삭제가 불가능합니다 잠시후 다시 시도해주십시오'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/');
                }

                const result = await response.json();

                if (result.deleteStatus) {
                    const toastData = {
                        status: 'success',
                        message: '삭제되었습니다.'
                    };
                    localStorage.setItem('redirectToast', JSON.stringify(toastData));
                    navigate('/project');
                } else {
                    addToast(result.deleteMessage, "error");
                    return;
                }

            } catch (error) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버에 문제가 생겨 프로젝트의 삭제가 불가능합니다 잠시후 다시 시도해주십시오'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                navigate('/');
            }
        }
    };

    const [calendarEvents, setCalendarEvents] = useState([
        {
            title: '프로젝트 시작',
            date: projectBasic.created,
            color: '#10b981'
        },
        ...(projectBasic.endDay ? [{
            title: '프로젝트 종료',
            date: projectBasic.endDay,
            color: '#3b82f6'
        }] : [])
    ]);

    return (
        <>
            <div className="project-manage-container">
                <div className="project-manage-header">
                    <div className="project-manage-thumb-wrapper">
                        {projectBasic.projectThumb ?
                            <img
                                className="project-manage-thumbnail"
                                src={`${API.API_BASE_URL}/projectThumb/${projectBasic.projectThumb}`}
                                alt="프로젝트 썸네일"
                            />
                            :
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="gray"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        }

                        <div className="project-manage-overlay">
                            <div className="project-manage-info">
                                <h1 className="project-title">{projectBasic.title}</h1>
                                <div className="project-status-wrapper" ref={statusMenuRef}>
                                    <button
                                        className="project-status-badge"
                                        style={{ backgroundColor: getStatusColor(projectBasic.status) }}
                                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    >
                                        {getStatusLabel(projectBasic.status)}
                                        <span className="status-arrow">▼</span>
                                    </button>

                                    {showStatusMenu && (
                                        <div className="status-dropdown">
                                            <button onClick={() => handleStatusChange('I')}>진행중</button>
                                            <button onClick={() => handleStatusChange('C')}>완료</button>
                                            <button onClick={() => handleStatusChange('D')}>중단</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {permissionGrade === 'L' && (
                                <button
                                    className="project-delete-btn"
                                    onClick={handleDeleteProject}
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="project-manage-content-area">
                    <div className="project-manage-summary-area">
                        <section className="summary-section">
                            <h3>프로젝트 개요</h3>
                            {showEditSummary ? (
                                <p className="summary-text">
                                    <textarea
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        autoComplete="off"
                                        placeholder={projectBasic.summary || '프로젝트 설명을 입력해주세요'}
                                    />
                                    <button onClick={handleUpdateSummary}>수정</button>
                                    <button onClick={() => {
                                        setSummary(projectBasic.summary || '');
                                        setShowEditSummary(false);
                                    }}>취소</button>
                                </p>
                            ) : (
                                <p className="summary-text">
                                    {projectBasic.summary || '프로젝트 설명이 없습니다.'}
                                    {permissionGrade === 'L' && (
                                        <button onClick={() => setShowEditSummary(true)}>수정하기</button>
                                    )}
                                </p>
                            )}
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section inline">
                            <div className="category-select-wrapper">
                                <span className="summary-label">카테고리</span>

                                <div className="category-select">
                                    <span className="summary-value">
                                        {projectBasic.pjCategory}
                                    </span>

                                    {permissionGrade === 'L' && (
                                        <button
                                            className="category-update-select-button"
                                            onClick={() => setShowCategorySelect(!showCategorySelect)}
                                        >
                                            ▼
                                        </button>
                                    )}

                                    {showCategorySelect && (
                                        <ul className="category-dropdown">
                                            {categories
                                                .filter(category => category !== projectBasic.pjCategory)
                                                .map(category => (
                                                    <li
                                                        key={category}
                                                        onClick={() => handleUpdateCategory(category)}
                                                    >
                                                        {category}
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="summary-label">상태</span>
                                <span
                                    className="summary-status"
                                    style={{ color: getStatusColor(projectBasic.status) }}
                                >
                                    {getStatusLabel(projectBasic.status)}
                                    <span className="status-duration">
                                        {projectBasic.status === 'I' && ` · ${getProjectDays(projectBasic)}일째`}
                                        {projectBasic.status === 'C' && ` · 총 ${getProjectDays(projectBasic)}일`}
                                        {projectBasic.status === 'D' && ` · ${getProjectDays(projectBasic)}일 만에 중단`}
                                    </span>
                                </span>
                            </div>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>사용 스킬 / 툴</h3>
                            {showEditSkillTool ? (
                                <div className="skill-inline">
                                    <input
                                        value={skillTool}
                                        onChange={(e) => setSkillTool(e.target.value)}
                                        autoComplete="off"
                                        placeholder={projectBasic.skillStack}
                                    />
                                    <button onClick={handleUpdateSkillTool}>수정</button>
                                    <button onClick={() => {
                                        setSkillTool(projectBasic.skillStack || '');
                                        setShowEditSkillTool(false);
                                    }}>취소</button>
                                </div>
                            ) : (
                                <div className="skill-inline">
                                    {projectBasic.skillStack?.split(',').map((skill, idx) => (
                                        <span key={idx} className="skill-badge">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                    {permissionGrade === 'L' && (
                                        <button onClick={() => setShowEditSkillTool(true)}>수정하기</button>
                                    )}
                                </div>
                            )}
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>진행 기간</h3>

                            {projectBasic.status === "I" && (
                                <div className="project-duration-container">
                                    {formatDate(projectBasic.created)} ~
                                </div>
                            )}

                            {(projectBasic.status === "D" || projectBasic.status === "C") && (
                                <div className="project-duration-container">
                                    {formatDate(projectBasic.created)} ~ {formatDate(projectBasic.endDay)}
                                </div>
                            )}
                        </section>
                    </div>
                    <div className="project-manage-teamValue-area">
                        <div className="project-manage-teamValue">
                            {projectBasic.teamValue ? "팀 프로젝트" : "개인 프로젝트"}
                        </div>

                        <div className="team-info-section">
                            <span className="team-info-label">
                                {projectBasic.teamValue ? "팀명" : "진행자"}
                            </span>
                            <div className="project-manage-teamName">
                                {projectBasic.teamValue ? projectBasic.teamName : projectBasic.starter}
                            </div>
                        </div>

                        {projectMember.length > 0 && (
                            <div className={permissionGrade === 'L' ? "team-member-information" : "team-member-information-non-leader"}>
                                {projectMember.map(member => (
                                    <div key={member.id} className="member-card">
                                        <div className="member-name">{member.pjMemberName}</div>

                                        <div className="member-detail-wrapper">
                                            <div className="member-detail">
                                                <span className="member-detail-label">권한:</span>
                                                <span className="member-grade-badge">
                                                    {getMemberGradeLabel(member.pjMemberGrade)}
                                                </span>
                                            </div>
                                            {member.pjMemberRole && (
                                                <div className="member-detail">
                                                    <span className="member-detail-label">담당:</span>
                                                    <span className="member-role-badge">
                                                        {member.pjMemberRole}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-actions">
                                            {permissionGrade === 'L' && member.pjStatus === 'T' && (
                                                <button
                                                    className="member-action-btn change-grade"
                                                    onClick={() => handleChangeGrade(member.id, member.pjMemberGrade)}
                                                >
                                                    {member.pjMemberGrade !== 'L' ? "관리자로 변경" : "팀원으로 변경"}
                                                </button>
                                            )}

                                            {permissionGrade === 'L' && member.pjStatus === 'T' && (
                                                <button
                                                    className="member-action-btn remove"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    제거
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLogined && loginSuccess ?
                            <button
                                className="add-member-btn"
                                onClick={() => {
                                    if (!isLogined || !loginSuccess) {
                                        navigatedLoginPage();
                                        return;
                                    }
                                    setShowAddMemberModal(true);
                                }}
                            >
                                {projectBasic.teamValue ? "+ 팀원 추가" : "팀 프로젝트 전환"}
                            </button>
                            :
                            <button
                                className="non-log-add-member-btn"
                                disabled
                            >
                                로그인 후 이용가능합니다
                            </button>
                        }
                    </div>

                    {showAddMemberModal && (
                        <div className="project-modal-overlay" onClick={() => setShowAddMemberModal(false)}>
                            <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3 className="project-modal-title">팀원 추가</h3>

                                {!projectBasic.teamValue && (
                                    <>
                                        <div className="project-modal-notice">
                                            개인 프로젝트에서 팀원을 추가하면 팀 프로젝트로 전환됩니다.
                                        </div>

                                        <div className="project-modal-input-group">
                                            <label className="project-modal-label">팀 이름</label>
                                            <input
                                                type="text"
                                                className="project-modal-input"
                                                placeholder="팀 이름을 입력하세요"
                                                value={teamNameInput}
                                                onChange={(e) => setTeamNameInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">팀원 이름</label>
                                    <input
                                        type="text"
                                        className="project-modal-input"
                                        placeholder="팀원 이름을 입력하세요"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                    />
                                </div>

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">권한</label>
                                    <select
                                        className="project-modal-input"
                                        value={newMemberGrade}
                                        onChange={(e) => setNewMemberGrade(e.target.value)}
                                    >
                                        <option value="M">팀원</option>
                                        <option value="L">관리자</option>
                                    </select>
                                </div>

                                <div className="project-modal-input-group">
                                    <label className="project-modal-label">담당 역할</label>
                                    <select
                                        className="project-modal-input"
                                        value={newMemberRole}
                                        onChange={(e) => {
                                            setNewMemberRole(e.target.value);
                                            if (e.target.value !== '직접입력') {
                                                setCustomRole('');
                                            }
                                        }}
                                    >
                                        <option value="">역할 선택</option>
                                        <option value="프론트엔드">프론트엔드</option>
                                        <option value="백엔드">백엔드</option>
                                        <option value="디자인">디자인</option>
                                        <option value="기획">기획</option>
                                        <option value="직접입력">직접 입력</option>
                                    </select>

                                    {newMemberRole === '직접입력' && (
                                        <input
                                            type="text"
                                            className="project-modal-input"
                                            style={{ marginTop: '8px' }}
                                            placeholder="역할을 입력하세요"
                                            value={customRole}
                                            onChange={(e) => setCustomRole(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="project-modal-actions">
                                    <button
                                        className="project-modal-btn cancel"
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setNewMemberName('');
                                            setNewMemberGrade('M');
                                            setNewMemberRole('');
                                            setCustomRole('');
                                            setTeamNameInput('');
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="project-modal-btn confirm"
                                        onClick={handleAddMember}
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="project-calendar-section">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="ko"
                        headerToolbar={{
                            left: 'prev',
                            center: 'title',
                            right: 'next'
                        }}
                        events={calendarEvents}
                        height="auto"
                        dateClick={(info) => {
                            console.log('날짜 클릭:', info.dateStr);
                        }}
                    />
                </div>
            </div>
        </>
    );
}
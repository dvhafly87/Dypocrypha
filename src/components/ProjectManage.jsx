import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../context/AuthContext.jsx';
import API from '../config/apiConfig.js';
import '../css/ProjectManage.css';

export default function ProjectManage() {
    const { isLogined, loginSuccess } = useAuth();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [projectBasic, setProjectBasic] = useState([]);
    const [projectMember, setProjectMember] = useState([]);
    const [teamNameInput, setTeamNameInput] = useState('');
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberGrade, setNewMemberGrade] = useState('M'); // 기본값: 팀원

    const getMemberGradeLabel = (grade) => {
        return grade === 'L' ? '관리자' : '팀원';
    };

    const getMemberStatLabel = (stat) => {
        const statMap = {
            'H': '대기',
            'I': '참여중'
        };
        return statMap[stat] || '알 수 없음';
    };

    const getMemberStatColor = (stat) => {
        const colorMap = {
            'H': '#f59e0b',
            'I': '#10b981'
        };
        return colorMap[stat] || '#6b7280';
    };

    // 팀원 역할 변경 핸들러
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
    }

    // 3. 팀원 추가 핸들러 (개인→팀 프로젝트 전환 포함)
    const handleAddMember = async () => {
        // 개인 프로젝트에서 팀 프로젝트로 전환하는 경우
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
                // 팀원 추가 (Grade, TeamName 포함)
                const addMemberResponse = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput
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
            // 이미 팀 프로젝트인 경우 - Grade 포함
            if (!newMemberName.trim()) {
                addToast('팀원 이름을 입력해주세요.', 'warning');
                return;
            }

            try {
                const response = await fetch(`${API.API_BASE_URL}/project/member/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId,
                        projectMemberName: newMemberName,
                        projectMemberGrade: newMemberGrade,
                        projectTeamName: teamNameInput
                    })
                });
                const result = await response.json();

                if (result.insertAddStatus) {
                    addToast('팀원이 추가되었습니다.', 'success');
                    setNewMemberName('');
                    setNewMemberGrade('M');
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

    // 4. 팀원 삭제 핸들러
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
    //status-dropdown 닫기---------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------

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
                    window.location.href = '/';
                }

                const result = await response.json();

                if (result.projectOneInfoStatus) {
                    if (result.projectOneInfobasic != null) {
                        setProjectBasic(result.projectOneInfobasic);
                    } else {
                        setProjectBasic([]);
                    }

                    //팀원 정보 엔티티 => 리스트로 넣음
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
        // 상태 변경 API 호출 로직
        try {
            const response = await fetch(`${API.API_BASE_URL}/project/status/update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                const toastData = {
                    status: 'warning',
                    message: '현재 서버가 실행중이 아니라 프로젝트 상태 변경이 불가능합니다 나중에 다시 시도해주십시오.'
                };
                localStorage.setItem('redirectToast', JSON.stringify(toastData));
                window.location.href = '/';
            }


        } catch (error) {
            const toastData = {
                status: 'warning',
                message: '에러 발생' + error.message
            };
            localStorage.setItem('redirectToast', JSON.stringify(toastData));
            window.location.href = '/';
        }
        setShowStatusMenu(false);
    };

    const handleDeleteProject = async () => {
        if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
            // 삭제 API 호출 로직
            try {
                const response = await fetch(`${API.API_BASE_URL}/project/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: projectId
                    })
                });

                if (response.ok) {
                    addToast('프로젝트가 삭제되었습니다.', 'success');
                    navigate('/');
                }
            } catch (error) {
                addToast('프로젝트 삭제에 실패했습니다.', 'error');
            }
        }
    };

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
                            <button
                                className="project-delete-btn"
                                onClick={handleDeleteProject}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
                <div className="project-manage-content-area">
                    <div className="project-manage-summary-area">
                        <section className="summary-section">
                            <h3>프로젝트 개요</h3>
                            <p className="summary-text">
                                {projectBasic.summary || '프로젝트 설명이 없습니다.'}
                            </p>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section inline">
                            <div>
                                <span className="summary-label">카테고리</span>
                                <span className="summary-value">{projectBasic.pjCategory}</span>
                            </div>

                            <div>
                                <span className="summary-label">상태</span>
                                <span
                                    className="summary-status"
                                    style={{ color: getStatusColor(projectBasic.status) }}
                                >
                                    {getStatusLabel(projectBasic.status)}
                                </span>
                            </div>
                        </section>

                        <div className="summary-divider" />

                        <section className="summary-section">
                            <h3>사용 스킬 / 툴</h3>
                            <div className="skill-inline">
                                {projectBasic.skillStack?.split(',').map((skill, idx) => (
                                    <span key={idx} className="skill-badge">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>
                    {/* 프로젝트 인원수 컨테이너  */}
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
                            <div className="team-member-information">
                                {projectMember.map(member => (
                                    <div key={member.id} className="member-card">
                                        <div className="member-name">{member.pjMemberName}</div>

                                        <div className="member-detail">
                                            <span className="member-detail-label">역할:</span>
                                            <span className="member-grade-badge">
                                                {getMemberGradeLabel(member.pjMemberGrade)}
                                            </span>
                                        </div>

                                        <div className="member-detail">
                                            <span className="member-detail-label">상태:</span>
                                            <span
                                                className="member-stat-badge"
                                                style={{
                                                    backgroundColor: getMemberStatColor(member.pjMemberStat) + '20',
                                                    color: getMemberStatColor(member.pjMemberStat)
                                                }}
                                            >
                                                {getMemberStatLabel(member.pjMemberStat)}
                                            </span>
                                        </div>

                                        {isLogined && loginSuccess && member.pjMemberGrade === 'L' &&(
                                            <div className="member-actions">
                                                <button
                                                    className="member-action-btn change-grade"
                                                    onClick={() => handleChangeGrade(member.id, member.pjMemberGrade)}
                                                >
                                                    {member.pjMemberGrade === 'L' ? '팀원으로 변경' : '관리자로 변경'}
                                                </button>
                                                {member.pjMemberGrade !== 'L' && (
                                                    <button
                                                        className="member-action-btn remove"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        제거
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="add-member-btn"
                            onClick={() => isLogined && loginSuccess
                                ? setShowAddMemberModal(true) : navigatedLoginPage()}
                        >
                            + 팀원 추가
                        </button>
                    </div>

                    {/* 팀원 추가 모달 */}
                    {showAddMemberModal && (
                        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h3 className="modal-title">팀원 추가</h3>

                                {!projectBasic.teamValue && (
                                    <>
                                        <div className="modal-notice">
                                            개인 프로젝트에서 팀원을 추가하면 팀 프로젝트로 전환됩니다.
                                        </div>

                                        <div className="modal-input-group">
                                            <label className="modal-label">팀 이름</label>
                                            <input
                                                type="text"
                                                className="modal-input"
                                                placeholder="팀 이름을 입력하세요"
                                                value={teamNameInput}
                                                onChange={(e) => setTeamNameInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="modal-input-group">
                                    <label className="modal-label">팀원 이름</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="팀원 이름을 입력하세요"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                    />
                                </div>

                                <div className="modal-input-group">
                                    <label className="modal-label">역할</label>
                                    <select
                                        className="modal-input"
                                        value={newMemberGrade}
                                        onChange={(e) => setNewMemberGrade(e.target.value)}
                                    >
                                        <option value="M">팀원</option>
                                        <option value="L">관리자</option>
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="modal-btn cancel"
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setNewMemberName('');
                                            setNewMemberGrade('M');
                                            setTeamNameInput('');
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="modal-btn confirm"
                                        onClick={handleAddMember}
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}